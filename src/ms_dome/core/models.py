import re
from uuid import uuid4

from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from django.db import models
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


class Domain(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid4, editable=False)
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name="domains")
    name = models.CharField(max_length=255, unique=True)
    wildcard = models.BooleanField(default=False)
    website = models.ForeignKey("Website", on_delete=models.CASCADE, related_name="domains", null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"*.{self.name}" if self.wildcard else self.name

    def clean(self):
        errors = {}
        if self.name:
            try:
                self.name = normalize_domain_name(self.name)  # ty: ignore[invalid-argument-type, invalid-assignment]
            except ValidationError as exc:
                errors["name"] = exc.messages

        if self.website is not None:
            if self.website.deleted:  # ty: ignore[unresolved-attribute]
                errors["website"] = "The website has been deleted."
            elif self.website.owner_id != self.owner_id:  # ty: ignore[unresolved-attribute]
                errors["website"] = "The website must belong to the same owner as the domain."

        if errors:
            raise ValidationError(errors)


class Website(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid4, editable=False)
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name="websites")
    tags = models.JSONField(default=list, blank=True)
    name = models.CharField(max_length=255, unique=True)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    deleted_at = models.DateTimeField(null=True, blank=True)
    deleted = models.BooleanField(default=False)

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

    def soft_delete(self) -> None:
        self.deleted = True  # ty: ignore[invalid-assignment]
        self.deleted_at = timezone.now()
        self.save(update_fields=["deleted", "deleted_at", "updated_at"])
