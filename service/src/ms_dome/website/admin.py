from django.contrib import admin

from website.models import WebsiteContent


@admin.register(WebsiteContent)
class WebsiteContentAdmin(admin.ModelAdmin):
    list_display = ("website", "is_active", "model", "created_at")
    list_filter = ("is_active",)
    search_fields = ("website__name", "description", "prompt")
    readonly_fields = (
        "id", "website", "is_active", "source", "prompt", "html", "model", "created_at", "updated_at"
    )
