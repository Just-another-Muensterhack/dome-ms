from uuid import UUID

from core.api.schema import ErrorOut, WebsiteIn, WebsiteOut, WebsiteUpdate
from core.service import HostManagementService
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
