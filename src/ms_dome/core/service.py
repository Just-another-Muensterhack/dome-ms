"""Application service of the core app: the use cases for hosts (websites, webservers) and their domains.

Layers:
- Domain model (`core.models`): the entities guard their own invariants in `clean` and their constraints.
- Repository: the model managers, `Website.objects.visible_to(user)` / `Webserver.objects.visible_to(user)` /
  `Domain.objects.visible_to(user)` give access-scoped collections of the aggregates.
- Application service (`HostManagementService`): one method per use case, performed on behalf of a user. It loads
  the aggregates, applies the changes and persists them.
- API (`core.api`): translates HTTP to calls on `HostManagementService` and back.

The service knows nothing about HTTP, it signals failures with `NotFoundError` and Django's `ValidationError`.
"""

from typing import Any
from uuid import UUID

from core.models import Domain, Host, Webserver, Website
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from django.db.models import Model, QuerySet


class NotFoundError(Exception):
    """The object does not exist or the acting user may not access it."""


class HostManagementService:
    """Use cases for websites, webservers and domains, performed on behalf of `user`."""

    WEBSITE_FIELDS = frozenset({"name", "description", "tags"})
    WEBSERVER_FIELDS = WEBSITE_FIELDS | {"ipv4", "ipv6", "cname"}
    # addresses may be cleared, as long as one of them stays set (checked by the model)
    WEBSERVER_NULLABLE_FIELDS = frozenset({"ipv4", "ipv6"})
    DOMAIN_FIELDS = frozenset({"name", "wildcard"})
    # the foreign key of a domain to each kind of host, as sent by the caller
    HOST_KEYS: dict[str, type[Host]] = {"website_id": Website, "webserver_id": Webserver}

    def __init__(self, user: User) -> None:
        self.user = user

    # Websites

    def list_websites(self) -> QuerySet[Website]:  # ty: ignore[invalid-type-form]
        return self._hosts(Website).order_by("name")

    def get_website(self, website_id: UUID) -> Website:
        return self._get(self._hosts(Website), website_id)

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

    # Webservers

    def list_webservers(self) -> QuerySet[Webserver]:  # ty: ignore[invalid-type-form]
        return self._hosts(Webserver).order_by("name")

    def get_webserver(self, webserver_id: UUID) -> Webserver:
        return self._get(self._hosts(Webserver), webserver_id)

    def create_webserver(
        self,
        *,
        name: str,
        description: str = "",
        tags: list[str] | None = None,
        ipv4: str | None = None,
        ipv6: str | None = None,
        cname: str = "",
    ) -> Webserver:
        webserver = Webserver(
            owner=self.user, name=name, description=description, tags=tags or [], ipv4=ipv4, ipv6=ipv6, cname=cname
        )
        return self._save(webserver)

    def update_webserver(self, webserver_id: UUID, changes: dict[str, Any]) -> Webserver:
        """Partial update, only the fields in `changes` are touched. `ipv4` / `ipv6: None` clears the address."""
        webserver = self.get_webserver(webserver_id)
        self._apply(webserver, changes, self.WEBSERVER_FIELDS, nullable=self.WEBSERVER_NULLABLE_FIELDS)
        return self._save(webserver)

    def delete_webserver(self, webserver_id: UUID) -> None:
        self.get_webserver(webserver_id).soft_delete()

    # Domains

    def list_domains(self, website_id: UUID | None = None, webserver_id: UUID | None = None) -> QuerySet[Domain]:  # ty: ignore[invalid-type-form]
        qs = self._domains()
        if website_id is not None:
            qs = qs.filter(website_id=website_id)
        if webserver_id is not None:
            qs = qs.filter(webserver_id=webserver_id)
        return qs.order_by("name")

    def get_domain(self, domain_id: UUID) -> Domain:
        return self._get(self._domains(), domain_id)

    def create_domain(
        self, *, name: str, wildcard: bool = False, website_id: UUID | None = None, webserver_id: UUID | None = None
    ) -> Domain:
        domain = Domain(owner=self.user, name=name, wildcard=wildcard)
        self._assign_hosts(domain, {"website_id": website_id, "webserver_id": webserver_id})
        return self._save(domain)

    def update_domain(self, domain_id: UUID, changes: dict[str, Any]) -> Domain:
        """Partial update, only the fields in `changes` are touched.

        `website_id` / `webserver_id: None` detaches the host. Attaching a domain to a host detaches it from the
        other kind of host unless that one is sent as well, so a domain can be moved with a single change.
        """
        domain = self.get_domain(domain_id)
        changes = dict(changes)
        host_changes = {key: changes.pop(key) for key in self.HOST_KEYS if key in changes}
        if any(host_id is not None for host_id in host_changes.values()):
            for key in self.HOST_KEYS:
                host_changes.setdefault(key, None)
        self._assign_hosts(domain, host_changes)
        self._apply(domain, changes, self.DOMAIN_FIELDS)
        return self._save(domain)

    def delete_domain(self, domain_id: UUID) -> None:
        self.get_domain(domain_id).delete()

    # Internals

    def _hosts[H: Host](self, model: type[H]) -> QuerySet[H]:  # ty: ignore[invalid-type-form]
        # hosts are always returned with their domains
        return model.objects.visible_to(self.user).prefetch_related("domains")  # ty: ignore[unresolved-attribute]

    def _domains(self) -> QuerySet[Domain]:  # ty: ignore[invalid-type-form]
        return Domain.objects.visible_to(self.user)

    def _assign_hosts(self, domain: Domain, host_ids: dict[str, UUID | None]) -> None:
        """Set the domain's hosts from `{"website_id": ..., "webserver_id": ...}`, `None` detaches."""
        for key, host_id in host_ids.items():
            model = self.HOST_KEYS[key]
            host = None
            if host_id is not None:
                host = self._hosts(model).filter(pk=host_id).first()
                if host is None:
                    raise ValidationError({key: f"{model.__name__} not found."})
            setattr(domain, key.removesuffix("_id"), host)

    @staticmethod
    def _get[M: Model](qs: QuerySet[M], pk: UUID) -> M:  # ty: ignore[invalid-type-form]
        obj = qs.filter(pk=pk).first()
        if obj is None:
            raise NotFoundError(f"{qs.model.__name__} not found.")
        return obj

    @staticmethod
    def _apply(
        obj: Model, changes: dict[str, Any], allowed: frozenset[str], nullable: frozenset[str] = frozenset()
    ) -> None:
        unknown = changes.keys() - allowed
        if unknown:
            raise ValidationError({field: "This field can not be changed." for field in sorted(unknown)})
        for field, value in changes.items():
            if value is None and field not in nullable:
                raise ValidationError({field: "This field may not be null."})
            setattr(obj, field, value)

    @staticmethod
    def _save[M: Model](obj: M) -> M:
        obj.full_clean()
        obj.save()
        return obj
