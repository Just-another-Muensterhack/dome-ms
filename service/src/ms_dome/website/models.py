from uuid import uuid4

from core.models import Website
from django.core.files.storage import FileSystemStorage, Storage
from django.db import models


def website_storage() -> Storage:
    """Stores below `MEDIA_ROOT`, every version of a website has its own path so no file is ever replaced."""
    return FileSystemStorage()


def website_html_path(content: "WebsiteContent", _filename: str) -> str:
    # the path is derived from the website and content ids only, never from user input
    return f"websites/{content.website_id.hex}/{content.id.hex}/index.html"  # ty: ignore[unresolved-attribute]


class WebsiteContent(models.Model):
    """A generated version of a website's page: the description and attributes it was built from and the resulting
    HTML file. A website has many versions, at most one of them is active."""

    id = models.UUIDField(primary_key=True, default=uuid4, editable=False)
    website = models.ForeignKey(Website, on_delete=models.CASCADE, related_name="contents")
    name = models.CharField(max_length=255)
    is_active = models.BooleanField(default=False, help_text="Whether this version is the one served for the website.")
    source = models.ForeignKey(
        "self",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="edits",
        help_text="The version this one was edited from, empty for a generated version.",
    )
    prompt = models.TextField(blank=True, help_text="The change requested from the source version.")
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
        ordering = ("-created_at",)
        constraints = (
            models.UniqueConstraint(
                fields=("website",), condition=models.Q(is_active=True), name="website_content_unique_active"
            ),
        )

    def __str__(self):
        return self.name

    def read_html(self) -> str:
        with self.html.open("rb") as file:  # ty: ignore[unresolved-attribute]
            return file.read().decode("utf-8")
