from uuid import UUID

from analysis.prometheus import (
    PrometheusError,
    empty_analytics,
    fetch_website_analytics,
    website_hosts,
)
from analysis.schema import WebsiteAnalyticsOut
from core.api.schema import ErrorOut, WebsiteIn, WebsiteOut, WebsiteUpdate
from core.service import HostManagementService, NotFoundError
from django.conf import settings
from django.http import HttpRequest
from ninja import Router

from ms_dome.api import api

websites = Router(tags=["websites"])
api.add_router("/websites", websites)


@websites.get("/", response=list[WebsiteOut])
def list_websites(request: HttpRequest):
    return HostManagementService(request.auth).list_websites()  # ty: ignore[unresolved-attribute]


@websites.get("/{website_id}", response={200: WebsiteOut, 404: ErrorOut})
def get_website(request: HttpRequest, website_id: UUID):
    return HostManagementService(request.auth).get_website(website_id)  # ty: ignore[unresolved-attribute]


@websites.get(
    "/{website_id}/analytics",
    response={200: WebsiteAnalyticsOut, 404: ErrorOut, 503: ErrorOut},
)
def website_analytics(request: HttpRequest, website_id: UUID):
    service = HostManagementService(request.auth)  # ty: ignore[unresolved-attribute]
    try:
        website = service.get_website(website_id)
    except NotFoundError as exc:
        return 404, {"detail": str(exc)}

    base_url = settings.PROMETHEUS_URL.strip()
    if not base_url:
        return empty_analytics()

    domains = [
        (domain.name, domain.wildcard)
        for domain in website.domains.filter(verified_at__isnull=False).only("name", "wildcard")
    ]
    hosts = website_hosts(website.managed_domain, domains)
    try:
        return fetch_website_analytics(base_url, hosts)
    except PrometheusError as exc:
        return 503, {"detail": str(exc)}


@websites.post("/", response={201: WebsiteOut, 409: ErrorOut, 422: ErrorOut})
def create_website(request: HttpRequest, payload: WebsiteIn):
    return 201, HostManagementService(request.auth).create_website(**payload.dict())  # ty: ignore[unresolved-attribute]


@websites.patch("/{website_id}", response={200: WebsiteOut, 404: ErrorOut, 409: ErrorOut, 422: ErrorOut})
def update_website(request: HttpRequest, website_id: UUID, payload: WebsiteUpdate):
    service = HostManagementService(request.auth)  # ty: ignore[unresolved-attribute]
    return service.update_website(website_id, payload.dict(exclude_unset=True))


@websites.delete("/{website_id}", response={204: None, 404: ErrorOut})
def delete_website(request: HttpRequest, website_id: UUID):
    HostManagementService(request.auth).delete_website(website_id)  # ty: ignore[unresolved-attribute]
    return 204, None
