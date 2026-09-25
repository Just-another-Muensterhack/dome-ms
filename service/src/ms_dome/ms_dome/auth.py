"""Authentication against Keycloak via mozilla-django-oidc.

`KeycloakOIDCBackend` is used for the session based browser login (Django admin, `/oidc/` views),
`OIDCBearer` authenticates django-ninja requests carrying an access token in the `Authorization` header.
"""

import logging
from typing import Any

from urllib.parse import urlencode

from django.conf import settings
from django.contrib.auth.models import AbstractBaseUser
from django.core.exceptions import SuspiciousOperation
from django.http import HttpRequest
from django.shortcuts import resolve_url
from mozilla_django_oidc.auth import OIDCAuthenticationBackend
from ninja.security import HttpBearer
from requests.exceptions import RequestException

logger = logging.getLogger(__name__)


def username_from_claims(email: str | None, claims: dict[str, Any]) -> str:
    """Use the stable Keycloak user id (`sub`) as Django username."""
    return claims["sub"]


def provider_logout(request: HttpRequest) -> str:
    """Build the Keycloak end session URL, so logging out of Django also ends the Keycloak SSO session."""
    params = {
        "client_id": settings.OIDC_RP_CLIENT_ID,
        "post_logout_redirect_uri": request.build_absolute_uri(resolve_url(settings.LOGOUT_REDIRECT_URL)),
    }
    if id_token := request.session.get("oidc_id_token"):  # ty: ignore[unresolved-attribute]
        params["id_token_hint"] = id_token
    return f"{settings.OIDC_OP_LOGOUT_ENDPOINT}?{urlencode(params)}"


class KeycloakOIDCBackend(OIDCAuthenticationBackend):
    """Maps Keycloak users onto Django users by their `sub` claim instead of their email address."""

    def filter_users_by_claims(self, claims: dict[str, Any]):
        sub = claims.get("sub")
        if not sub:
            return self.UserModel.objects.none()
        return self.UserModel.objects.filter(username=sub)

    def verify_claims(self, claims: dict[str, Any]) -> bool:
        return "sub" in claims

    def create_user(self, claims: dict[str, Any]) -> AbstractBaseUser:
        user = super().create_user(claims)
        return self.update_user(user, claims)

    def update_user(self, user: AbstractBaseUser, claims: dict[str, Any]) -> AbstractBaseUser:
        # Keycloak is the source of truth for admin access, see the `roles` mapper in the realm config
        roles = set(claims.get("roles", []))
        is_superuser = settings.OIDC_SUPERUSER_ROLE in roles
        values = {
            "email": claims.get("email", ""),
            "first_name": claims.get("given_name", ""),
            "last_name": claims.get("family_name", ""),
            "is_staff": is_superuser or settings.OIDC_STAFF_ROLE in roles,
            "is_superuser": is_superuser,
        }
        changed = [field for field, value in values.items() if getattr(user, field) != value]
        for field in changed:
            setattr(user, field, values[field])
        if changed:
            user.save(update_fields=changed)
        return user


class OIDCBearer(HttpBearer):
    """django-ninja auth validating the bearer token against the Keycloak userinfo endpoint.

    On success the Django user is set as `request.user` (and returned as `request.auth`).
    """

    def __init__(self) -> None:
        super().__init__()
        self.backend = KeycloakOIDCBackend()

    def authenticate(self, request: HttpRequest, token: str) -> AbstractBaseUser | None:
        try:
            user = self.backend.get_or_create_user(token, None, None)
        except RequestException as exc:
            # Keycloak answers 401 for invalid / expired tokens
            logger.info("OIDC token rejected: %s", exc)
            return None
        except SuspiciousOperation as exc:
            logger.info("OIDC login failed: %s", exc)
            return None

        if user is None or not user.is_active:
            return None

        request.user = user  # ty: ignore[unresolved-attribute]
        return user
