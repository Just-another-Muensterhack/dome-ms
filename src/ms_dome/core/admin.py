from django.contrib import admin
from django.forms.models import BaseInlineFormSet

from core.models import Domain, Website


class DomainInlineFormSet(BaseInlineFormSet):
    """Inline domains always belong to the owner of their website.

    The owner is set before validation, so `Domain.clean` checks the domains against the (possibly changed) owner.
    """

    def _construct_form(self, i, **kwargs):
        form = super()._construct_form(i, **kwargs)
        form.instance.owner_id = self.instance.owner_id
        return form


class DomainInline(admin.TabularInline):
    model = Domain
    formset = DomainInlineFormSet
    fields = ("name", "wildcard", "created_at", "updated_at")
    readonly_fields = ("created_at", "updated_at")
    extra = 0
    show_change_link = True


@admin.register(Website)
class WebsiteAdmin(admin.ModelAdmin):
    list_display = ("name", "owner", "deleted", "created_at", "updated_at")
    list_filter = ("deleted", "created_at")
    search_fields = ("name", "description", "owner__username", "owner__email")
    autocomplete_fields = ("owner",)
    readonly_fields = ("id", "created_at", "updated_at", "deleted_at")
    fields = ("id", "name", "owner", "description", "tags", "deleted", "deleted_at", "created_at", "updated_at")
    inlines = (DomainInline,)

    def save_related(self, request, form, formsets, change):
        super().save_related(request, form, formsets, change)
        # unchanged inline rows are not saved, move them over to a new owner as well
        form.instance.domains.exclude(owner=form.instance.owner).update(owner=form.instance.owner)


@admin.register(Domain)
class DomainAdmin(admin.ModelAdmin):
    list_display = ("__str__", "owner", "website", "wildcard", "created_at", "updated_at")
    list_filter = ("wildcard", "created_at")
    search_fields = ("name", "website__name", "owner__username", "owner__email")
    autocomplete_fields = ("owner", "website")
    readonly_fields = ("id", "created_at", "updated_at")
    fields = ("id", "name", "wildcard", "owner", "website", "created_at", "updated_at")
    list_select_related = ("owner", "website")
