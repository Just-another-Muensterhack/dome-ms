"""Django admin that authenticates via Keycloak instead of the username / password form."""

from urllib.parse import urlencode

from django.contrib import admin
from django.contrib.auth import REDIRECT_FIELD_NAME
from django.core.exceptions import PermissionDenied
from django.http import HttpRequest, HttpResponse, HttpResponseRedirect
from django.urls import reverse
from mozilla_django_oidc.views import OIDCLogoutView


class KeycloakAdminSite(admin.AdminSite):
    """Admin site that is only reachable for staff users logged in via Keycloak.

    `is_staff` / `is_superuser` are synced from the Keycloak realm roles on every login,
    see `ms_dome.auth.KeycloakOIDCBackend.update_user`.
    """

    def login(self, request: HttpRequest, extra_context: dict | None = None) -> HttpResponse:
        if not request.user.is_authenticated:  # ty: ignore[unresolved-attribute]
            next_url = request.GET.get(REDIRECT_FIELD_NAME) or reverse("admin:index", current_app=self.name)
            query = urlencode({REDIRECT_FIELD_NAME: next_url})
            return HttpResponseRedirect(f"{reverse('oidc_authentication_init')}?{query}")
        if not self.has_permission(request):
            raise PermissionDenied("Admin access requires the staff role in Keycloak.")
        return HttpResponseRedirect(reverse("admin:index", current_app=self.name))

    def logout(self, request: HttpRequest, extra_context: dict | None = None) -> HttpResponse:
        return OIDCLogoutView.as_view()(request)
