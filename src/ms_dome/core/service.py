"""Application service of the core app: the use cases for websites and domains.

Layers:
- Domain model (`core.models`): the entities guard their own invariants in `clean`.
- Repository: the model managers, `Website.objects.visible_to(user)` / `Domain.objects.visible_to(user)` give
  access-scoped collections of the aggregates.
- Application service (`CoreService`): one method per use case, performed on behalf of a user. It loads the
  aggregates, applies the changes and persists them.
- API (`core.api`): translates HTTP to calls on `CoreService` and back.

The service knows nothing about HTTP, it signals failures with `NotFoundError` and Django's `ValidationError`.
"""

from typing import Any
from uuid import UUID

from core.models import Domain, Website
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from django.db.models import Model, QuerySet


class NotFoundError(Exception):
    """The object does not exist or the acting user may not access it."""


class WebsiteManagementService:
    """Use cases for websites and domains, performed on behalf of `user`."""

    WEBSITE_FIELDS = frozenset({"name", "description", "tags"})
    DOMAIN_FIELDS = frozenset({"name", "wildcard"})

    def __init__(self, user: User) -> None:
        self.user = user

    # Websites

    def list_websites(self) -> QuerySet[Website]:  # ty: ignore[invalid-type-form]
        return self._websites().order_by("name")

    def get_website(self, website_id: UUID) -> Website:
        return self._get(self._websites(), website_id)

    def create_website(self, *, name: str, description: str = "", tags: list[str] | None = None) -> Website:
        website = Website(owner=self.user, name=name, description=description, tags=tags or [])
        return self._save(website)

    def update_website(self, website_id: UUID, changes: dict[str, Any]) -> Website:
        """Partial update, only the fields in `changes` are touched."""
        website = self.get_website(website_id)
        self._apply(website, changes, self.WEBSITE_FIELDS)
        return self._save(website)

    def delete_website(self, website_id: UUID) -> None:
        self.get_website(website_id).soft_delete()

    # Domains

    def list_domains(self, website_id: UUID | None = None) -> QuerySet[Domain]:  # ty: ignore[invalid-type-form]
        qs = self._domains()
        if website_id is not None:
            qs = qs.filter(website_id=website_id)
        return qs.order_by("name")

    def get_domain(self, domain_id: UUID) -> Domain:
        return self._get(self._domains(), domain_id)

    def create_domain(self, *, name: str, wildcard: bool = False, website_id: UUID | None = None) -> Domain:
        domain = Domain(owner=self.user, name=name, wildcard=wildcard, website=self._resolve_website(website_id))
        return self._save(domain)

    def update_domain(self, domain_id: UUID, changes: dict[str, Any]) -> Domain:
        """Partial update, only the fields in `changes` are touched. `website_id: None` detaches the website."""
        domain = self.get_domain(domain_id)
        changes = dict(changes)
        if "website_id" in changes:
            domain.website = self._resolve_website(changes.pop("website_id"))  # ty: ignore[invalid-assignment]
        self._apply(domain, changes, self.DOMAIN_FIELDS)
        return self._save(domain)

    def delete_domain(self, domain_id: UUID) -> None:
        self.get_domain(domain_id).delete()

    # Internals

    def _websites(self) -> QuerySet[Website]:  # ty: ignore[invalid-type-form]
        # websites are always returned with their domains
        return Website.objects.visible_to(self.user).prefetch_related("domains")

    def _domains(self) -> QuerySet[Domain]:  # ty: ignore[invalid-type-form]
        return Domain.objects.visible_to(self.user)

    def _resolve_website(self, website_id: UUID | None) -> Website | None:
        if website_id is None:
            return None
        website = self._websites().filter(pk=website_id).first()
        if website is None:
            raise ValidationError({"website_id": "Website not found."})
        return website

    @staticmethod
    def _get[M: Model](qs: QuerySet[M], pk: UUID) -> M:  # ty: ignore[invalid-type-form]
        obj = qs.filter(pk=pk).first()
        if obj is None:
            raise NotFoundError(f"{qs.model.__name__} not found.")
        return obj

    @staticmethod
    def _apply(obj: Model, changes: dict[str, Any], allowed: frozenset[str]) -> None:
        unknown = changes.keys() - allowed
        if unknown:
            raise ValidationError({field: "This field can not be changed." for field in sorted(unknown)})
        for field, value in changes.items():
            if value is None:
                raise ValidationError({field: "This field may not be null."})
            setattr(obj, field, value)

    @staticmethod
    def _save[M: Model](obj: M) -> M:
        obj.full_clean()
        obj.save()
        return obj
