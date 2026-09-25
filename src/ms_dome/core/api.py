from uuid import UUID

from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from django.db.models import QuerySet
from django.http import HttpRequest
from django.shortcuts import get_object_or_404
from ninja import Router

from core.models import Domain, Website
from core.schema import DomainIn, DomainOut, DomainUpdate, ErrorOut, WebsiteIn, WebsiteOut, WebsiteUpdate


def websites_for(user: User) -> QuerySet[Website]:  # ty: ignore[invalid-type-form]
    """Websites the user may access: superusers see all, everybody else only their own. Soft deleted ones are hidden."""
    qs = Website.objects.filter(deleted=False).prefetch_related("domains")  # ty: ignore[unresolved-attribute]
    return qs if user.is_superuser else qs.filter(owner=user)


def domains_for(user: User) -> QuerySet[Domain]:  # ty: ignore[invalid-type-form]
    """Domains the user may access: superusers see all, everybody else only their own."""
    qs = Domain.objects.all()  # ty: ignore[unresolved-attribute]
    return qs if user.is_superuser else qs.filter(owner=user)


def resolve_website(user: User, website_id: UUID | None) -> Website | None:
    if website_id is None:
        return None
    website = websites_for(user).filter(pk=website_id).first()
    if website is None:
        raise ValidationError({"website_id": "Website not found."})
    return website


# Websites

websites = Router(tags=["websites"])


@websites.get("/", response=list[WebsiteOut])
def list_websites(request: HttpRequest):
    return websites_for(request.auth).order_by("name")  # ty: ignore[unresolved-attribute]


@websites.get("/{website_id}", response={200: WebsiteOut, 404: ErrorOut})
def get_website(request: HttpRequest, website_id: UUID):
    return get_object_or_404(websites_for(request.auth), pk=website_id)  # ty: ignore[unresolved-attribute]


@websites.post("/", response={201: WebsiteOut, 409: ErrorOut, 422: ErrorOut})
def create_website(request: HttpRequest, payload: WebsiteIn):
    website = Website(owner=request.auth, **payload.dict())  # ty: ignore[unresolved-attribute]
    website.full_clean()
    website.save()
    return 201, website


@websites.patch("/{website_id}", response={200: WebsiteOut, 404: ErrorOut, 409: ErrorOut, 422: ErrorOut})
def update_website(request: HttpRequest, website_id: UUID, payload: WebsiteUpdate):
    website = get_object_or_404(websites_for(request.auth), pk=website_id)  # ty: ignore[unresolved-attribute]
    for field, value in payload.dict(exclude_unset=True).items():
        setattr(website, field, value)
    website.full_clean()
    website.save()
    return website


@websites.delete("/{website_id}", response={204: None, 404: ErrorOut})
def delete_website(request: HttpRequest, website_id: UUID):
    get_object_or_404(websites_for(request.auth), pk=website_id).soft_delete()  # ty: ignore[unresolved-attribute]
    return 204, None


# Domains

domains = Router(tags=["domains"])


@domains.get("/", response=list[DomainOut])
def list_domains(request: HttpRequest, website_id: UUID | None = None):
    qs = domains_for(request.auth)  # ty: ignore[unresolved-attribute]
    if website_id is not None:
        qs = qs.filter(website_id=website_id)
    return qs.order_by("name")


@domains.get("/{domain_id}", response={200: DomainOut, 404: ErrorOut})
def get_domain(request: HttpRequest, domain_id: UUID):
    return get_object_or_404(domains_for(request.auth), pk=domain_id)  # ty: ignore[unresolved-attribute]


@domains.post("/", response={201: DomainOut, 409: ErrorOut, 422: ErrorOut})
def create_domain(request: HttpRequest, payload: DomainIn):
    domain = Domain(
        owner=request.auth,  # ty: ignore[unresolved-attribute]
        name=payload.name,
        wildcard=payload.wildcard,
        website=resolve_website(request.auth, payload.website_id),  # ty: ignore[unresolved-attribute]
    )
    domain.full_clean()
    domain.save()
    return 201, domain


@domains.patch("/{domain_id}", response={200: DomainOut, 404: ErrorOut, 409: ErrorOut, 422: ErrorOut})
def update_domain(request: HttpRequest, domain_id: UUID, payload: DomainUpdate):
    domain = get_object_or_404(domains_for(request.auth), pk=domain_id)  # ty: ignore[unresolved-attribute]
    data = payload.dict(exclude_unset=True)
    if "website_id" in data:
        domain.website = resolve_website(request.auth, data.pop("website_id"))  # ty: ignore[unresolved-attribute]
    for field, value in data.items():
        if value is None:
            raise ValidationError({field: "This field may not be null."})
        setattr(domain, field, value)
    domain.full_clean()
    domain.save()
    return domain


@domains.delete("/{domain_id}", response={204: None, 404: ErrorOut})
def delete_domain(request: HttpRequest, domain_id: UUID):
    get_object_or_404(domains_for(request.auth), pk=domain_id).delete()  # ty: ignore[unresolved-attribute]
    return 204, None
