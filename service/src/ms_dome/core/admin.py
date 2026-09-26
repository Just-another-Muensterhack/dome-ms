from django.contrib import admin
from django.forms.models import BaseInlineFormSet

from core.models import Domain, Webserver, Website


class DomainInlineFormSet(BaseInlineFormSet):
    """Inline domains always belong to the owner of their host.

    The owner is set before validation, so `Domain.clean` checks new domains against the host's owner.
    """

    def _construct_form(self, i, **kwargs):
        form = super()._construct_form(i, **kwargs)
        form.instance.owner_id = self.instance.owner_id
        return form


class DomainInline(admin.TabularInline):
    model = Domain
    formset = DomainInlineFormSet
    fields = ("name", "wildcard", "managed", "verified_at", "created_at", "updated_at")
    readonly_fields = ("managed", "verified_at", "created_at", "updated_at")
    extra = 0
    show_change_link = True


class HostAdmin(admin.ModelAdmin):
    """Common admin of the `Host` models."""

    list_display = ("name", "owner", "deleted", "created_at", "updated_at")
    list_filter = ("deleted", "created_at")
    search_fields = ("name", "description", "owner__username", "owner__email")
    autocomplete_fields = ("owner",)
    readonly_fields = ("id", "created_at", "updated_at", "deleted", "deleted_at")
    fields = ("id", "name", "owner", "description", "tags", "deleted", "deleted_at", "created_at", "updated_at")
    inlines = (DomainInline,)
    actions = ("soft_delete",)

    def get_readonly_fields(self, request, obj=None):
        # the owner is fixed once created, so a host and its domains always share it
        return (*self.readonly_fields, "owner") if obj else self.readonly_fields

    @admin.action(description="Soft delete selected %(verbose_name_plural)s")
    def soft_delete(self, request, queryset):
        for host in queryset.filter(deleted=False):
            host.soft_delete()


@admin.register(Website)
class WebsiteAdmin(HostAdmin):
    pass


@admin.register(Webserver)
class WebserverAdmin(HostAdmin):
    list_display = ("name", "owner", "ipv4", "ipv6", "cname", "deleted", "created_at", "updated_at")
    search_fields = (*HostAdmin.search_fields, "ipv4", "ipv6", "cname")
    fields = (*HostAdmin.fields[:5], "ipv4", "ipv6", "cname", *HostAdmin.fields[5:])


@admin.register(Domain)
class DomainAdmin(admin.ModelAdmin):
    list_display = (
        "__str__",
        "owner",
        "website",
        "webserver",
        "wildcard",
        "managed",
        "verified_at",
        "created_at",
        "updated_at",
    )
    list_filter = ("wildcard", "managed", ("verified_at", admin.EmptyFieldListFilter), "created_at")
    search_fields = ("name", "website__name", "webserver__name", "owner__username", "owner__email")
    autocomplete_fields = ("owner", "website", "webserver")
    readonly_fields = ("id", "managed", "verified_at", "record_name", "record_value", "created_at", "updated_at")
    fields = (
        "id",
        "name",
        "wildcard",
        "managed",
        "owner",
        "website",
        "webserver",
        "verified_at",
        "record_name",
        "record_value",
        "created_at",
        "updated_at",
    )
    list_select_related = ("owner", "website", "webserver")

    def get_readonly_fields(self, request, obj=None):
        return (*self.readonly_fields, "owner") if obj else self.readonly_fields
