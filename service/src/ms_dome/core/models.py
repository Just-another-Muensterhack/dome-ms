import re
import secrets
from uuid import uuid4

from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from django.db import models, transaction
from django.db.models import Q
from django.utils import timezone

# A single DNS label: 1-63 chars, alphanumerics and hyphens, no leading / trailing hyphen
_LABEL_RE = re.compile(r"^(?!-)[a-z0-9-]{1,63}(?<!-)$")


def normalize_domain_name(name: str) -> str:
    """Lowercase, strip the trailing root dot and convert internationalized names to punycode.

    Raises a `ValidationError` if the result is not a valid fully qualified host name.
    """
    name = name.strip().lower().rstrip(".")
    if name.startswith("*"):
        raise ValidationError("Do not prefix the name with '*.', set the wildcard flag instead.")
    try:
        name = name.encode("idna").decode("ascii")
    except UnicodeError as exc:
        raise ValidationError("Enter a valid domain name.") from exc

    labels = name.split(".")
    if len(name) > 253 or len(labels) < 2 or not all(_LABEL_RE.match(label) for label in labels):
        raise ValidationError("Enter a valid domain name, e.g. 'example.com'.")
    if labels[-1].isdigit():
        raise ValidationError("IP addresses are not allowed, enter a domain name.")
    return name


def new_verification_token() -> str:
    return secrets.token_urlsafe(32)


class DomainQuerySet(models.QuerySet):
    def visible_to(self, user: User) -> "DomainQuerySet":
        """Domains the user may access: superusers see all, everybody else only their own."""
        return self if user.is_superuser else self.filter(owner=user)


class HostQuerySet(models.QuerySet):
    def visible_to(self, user: User) -> "HostQuerySet":
        """Hosts the user may access: superusers see all, everybody else only their own. Soft deleted ones are hidden."""
        qs = self.filter(deleted=False)
        return qs if user.is_superuser else qs.filter(owner=user)


WebsiteQuerySet = WebserverQuerySet = HostQuerySet


class Domain(models.Model):
    objects = models.Manager.from_queryset(DomainQuerySet)()

    id = models.UUIDField(primary_key=True, default=uuid4, editable=False)
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name="domains")
    name = models.CharField(max_length=255)
    wildcard = models.BooleanField(default=False)
    website = models.ForeignKey("Website", on_delete=models.CASCADE, related_name="domains", null=True, blank=True)
    webserver = models.ForeignKey("Webserver", on_delete=models.CASCADE, related_name="domains", null=True, blank=True)
    # ownership is proven by publishing `record_value` as TXT record at `record_name`
    token = models.CharField(max_length=64, default=new_verification_token, editable=False)
    verified_at = models.DateTimeField(null=True, blank=True, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["owner", "name"],
                name="unique_domain_name_per_owner",
                violation_error_message="You already have a domain with this name.",
            ),
            # a domain points to at most one host, either a website or a webserver
            models.CheckConstraint(
                condition=Q(website__isnull=True) | Q(webserver__isnull=True),
                name="domain_single_host",
                violation_error_message="A domain can belong to either a website or a webserver, not both.",
            ),
        ]

    def __str__(self):
        return f"*.{self.name}" if self.wildcard else self.name

    @classmethod
    def from_db(cls, db, field_names, values, *, fetch_mode=None):
        instance = super().from_db(db, field_names, values, fetch_mode=fetch_mode)
        # remember the stored name, a rename has to be verified again
        instance._stored_name = instance.__dict__.get("name")
        return instance

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        self._stored_name = self.name

    @property
    def verified(self) -> bool:
        return self.verified_at is not None

    @property
    def record_name(self) -> str:
        return f"_dome-ms-challenge.{self.name}"

    @property
    def record_value(self) -> str:
        return f"dome-ms-verification={self.token}"

    def clean(self):
        errors = {}
        if self.name:
            try:
                self.name = normalize_domain_name(self.name)  # ty: ignore[invalid-argument-type, invalid-assignment]
            except ValidationError as exc:
                errors["name"] = exc.messages

        stored_name = getattr(self, "_stored_name", None)
        if stored_name is not None and self.name != stored_name:
            # the proof was for the old name, a fresh token keeps an old TXT record from verifying the new one
            self.verified_at = None  # ty: ignore[invalid-assignment]
            self.token = new_verification_token()  # ty: ignore[invalid-assignment]

        if self.website is not None and self.webserver is not None:
            errors["webserver"] = "A domain can belong to either a website or a webserver, not both."
        for field in ("website", "webserver"):
            host = getattr(self, field)
            if host is None:
                continue
            if not self.verified:
                errors[field] = (
                    "Verify the domain before attaching it, a renamed domain has to be verified again."
                    if stored_name is not None and self.name != stored_name
                    else "Verify the domain before attaching it."
                )
            elif host.deleted:
                errors[field] = f"The {field} has been deleted."
            elif host.owner_id != self.owner_id:  # ty: ignore[unresolved-attribute]
                errors[field] = f"The {field} must belong to the same owner as the domain."

        if errors:
            raise ValidationError(errors)


def _unique_active_name_per_owner(model_name: str) -> models.UniqueConstraint:
    # names are per owner, a soft deleted host frees its name
    return models.UniqueConstraint(
        fields=["owner", "name"],
        condition=Q(deleted=False),
        name=f"unique_active_{model_name}_name_per_owner",
        violation_error_message=f"You already have a {model_name} with this name.",
    )


class Host(models.Model):
    """Common fields and behaviour of everything a domain can point to."""

    id = models.UUIDField(primary_key=True, default=uuid4, editable=False)
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name="%(class)ss")
    tags = models.JSONField(default=list, blank=True)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    deleted_at = models.DateTimeField(null=True, blank=True)
    deleted = models.BooleanField(default=False)

    class Meta:
        abstract = True

    def __str__(self):
        return self.name

    def clean(self):
        self.name = self.name.strip()  # ty: ignore[unresolved-attribute]
        if not self.name:
            raise ValidationError({"name": "The name must not be blank."})

        if not isinstance(self.tags, list) or not all(isinstance(tag, str) for tag in self.tags):
            raise ValidationError({"tags": "Tags must be a list of strings."})
        # drop blanks and duplicates, keep the order
        self.tags = list(dict.fromkeys(tag.strip() for tag in self.tags if tag.strip()))  # ty: ignore[invalid-assignment]

        # keep the soft delete flag and timestamp consistent
        if self.deleted and self.deleted_at is None:
            self.deleted_at = timezone.now()
        elif not self.deleted:
            self.deleted_at = None  # ty: ignore[invalid-assignment]

    @transaction.atomic
    def soft_delete(self) -> None:
        """Hide the host and release its domains, they stay with the owner but are no longer attached."""
        self.deleted = True  # ty: ignore[invalid-assignment]
        self.deleted_at = timezone.now()
        self.save(update_fields=["deleted", "deleted_at", "updated_at"])
        # a domain belongs to a single host, so clearing both foreign keys only detaches it from this one
        self.domains.update(website=None, webserver=None, updated_at=timezone.now())  # ty: ignore[unresolved-attribute]


class Website(Host):
    objects = models.Manager.from_queryset(WebsiteQuerySet)()

    class Meta:
        constraints = [_unique_active_name_per_owner("website")]


class Webserver(Host):
    objects = models.Manager.from_queryset(WebserverQuerySet)()

    ipv4 = models.GenericIPAddressField(protocol="IPv4", null=True, blank=True)
    ipv6 = models.GenericIPAddressField(protocol="IPv6", null=True, blank=True)
    cname = models.CharField(max_length=255, blank=True)

    class Meta:
        constraints = [
            _unique_active_name_per_owner("webserver"),
            models.CheckConstraint(
                condition=Q(ipv4__isnull=False) | Q(ipv6__isnull=False) | ~Q(cname=""),
                name="webserver_has_address",
                violation_error_message="Set at least one of IPv4, IPv6 or CNAME.",
            ),
        ]

    def clean(self):
        super().clean()
        if self.cname:
            try:
                self.cname = normalize_domain_name(self.cname)  # ty: ignore[invalid-argument-type, invalid-assignment]
            except ValidationError as exc:
                raise ValidationError({"cname": exc.messages}) from exc
        # "at least one of ipv4 / ipv6 / cname" is enforced by the `webserver_has_address` constraint
