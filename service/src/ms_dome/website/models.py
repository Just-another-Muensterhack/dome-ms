from uuid import uuid4

from core.models import Website
from django.core.files.storage import FileSystemStorage, Storage
from django.db import models


def website_storage() -> Storage:
    """Stores below `MEDIA_ROOT`, a regenerated website replaces its previous file instead of getting a new name."""
    return FileSystemStorage(allow_overwrite=True)


def website_html_path(content: "WebsiteContent", _filename: str) -> str:
    # the path is derived from the website id only, never from user input
    return f"websites/{content.website_id.hex}/index.html"  # ty: ignore[unresolved-attribute]


class WebsiteContent(models.Model):
    """The generated page of a website: the description and attributes it was built from and the resulting HTML file."""

    id = models.UUIDField(primary_key=True, default=uuid4, editable=False)
    website = models.OneToOneField(Website, on_delete=models.CASCADE, related_name="content")
    description = models.TextField()
    attributes = models.JSONField(
        default=dict, blank=True, help_text="Categorical data of the website like category, purpose or location."
    )
    html = models.FileField(upload_to=website_html_path, storage=website_storage, max_length=255)
    model = models.CharField(max_length=255, help_text="The language model that generated the HTML.")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "website contents"

    def __str__(self):
        return f"Content of {self.website}"
