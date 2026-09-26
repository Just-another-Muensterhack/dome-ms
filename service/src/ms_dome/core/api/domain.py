from uuid import UUID

from core.api.schema import DomainAvailabilityOut, DomainIn, DomainOut, DomainUpdate, ErrorOut
from core.service import HostManagementService
from django.http import HttpRequest
from ninja import Query, Router

from ms_dome.api import api

domains = Router(tags=["domains"])
api.add_router("/domains", domains)


@domains.get("/", response=list[DomainOut])
def list_domains(request: HttpRequest, website_id: UUID | None = None, webserver_id: UUID | None = None):
    service = HostManagementService(request.auth)  # ty: ignore[unresolved-attribute]
    return service.list_domains(website_id, webserver_id)


@domains.get("/available", response=DomainAvailabilityOut)
def check_managed_domain(request: HttpRequest, name: str = Query(..., max_length=255)):  # ty: ignore[call-non-callable]
    """Whether `<name>.website.<base domain>` can be registered, `name` may also be the full domain name."""
    return HostManagementService(request.auth).check_managed_domain(name)  # ty: ignore[unresolved-attribute]


@domains.get("/{domain_id}", response={200: DomainOut, 404: ErrorOut})
def get_domain(request: HttpRequest, domain_id: UUID):
    return HostManagementService(request.auth).get_domain(domain_id)  # ty: ignore[unresolved-attribute]


@domains.post("/", response={201: DomainOut, 409: ErrorOut, 422: ErrorOut})
def create_domain(request: HttpRequest, payload: DomainIn):
    return 201, HostManagementService(request.auth).create_domain(**payload.dict())  # ty: ignore[unresolved-attribute]


@domains.patch("/{domain_id}", response={200: DomainOut, 404: ErrorOut, 409: ErrorOut, 422: ErrorOut})
def update_domain(request: HttpRequest, domain_id: UUID, payload: DomainUpdate):
    service = HostManagementService(request.auth)  # ty: ignore[unresolved-attribute]
    return service.update_domain(domain_id, payload.dict(exclude_unset=True))


@domains.post("/{domain_id}/verify", response={200: DomainOut, 404: ErrorOut})
def verify_domain(request: HttpRequest, domain_id: UUID):
    """Look up the domain's `record_name` TXT record, `verified_at` is set if it holds `record_value`."""
    return HostManagementService(request.auth).verify_domain(domain_id)  # ty: ignore[unresolved-attribute]


@domains.delete("/{domain_id}", response={204: None, 404: ErrorOut})
def delete_domain(request: HttpRequest, domain_id: UUID):
    HostManagementService(request.auth).delete_domain(domain_id)  # ty: ignore[unresolved-attribute]
    return 204, None
