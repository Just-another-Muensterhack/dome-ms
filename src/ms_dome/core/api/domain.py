from uuid import UUID

from core.api.schema import DomainIn, DomainOut, DomainUpdate, ErrorOut
from core.service import HostManagementService
from django.http import HttpRequest
from ninja import Router

from ms_dome.api import api

domains = Router(tags=["domains"])
api.add_router("/domains", domains)


@domains.get("/", response=list[DomainOut])
def list_domains(request: HttpRequest, website_id: UUID | None = None, webserver_id: UUID | None = None):
    service = HostManagementService(request.auth)  # ty: ignore[unresolved-attribute]
    return service.list_domains(website_id, webserver_id)


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


@domains.delete("/{domain_id}", response={204: None, 404: ErrorOut})
def delete_domain(request: HttpRequest, domain_id: UUID):
    HostManagementService(request.auth).delete_domain(domain_id)  # ty: ignore[unresolved-attribute]
    return 204, None
