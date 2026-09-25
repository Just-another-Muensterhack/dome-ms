from django.contrib import admin

from website.models import WebsiteContent


@admin.register(WebsiteContent)
class WebsiteContentAdmin(admin.ModelAdmin):
    list_display = ("website", "model", "updated_at")
    search_fields = ("website__name", "description")
    readonly_fields = ("id", "website", "html", "model", "created_at", "updated_at")
