from uuid import UUID

from core.api.schema import ErrorOut, WebserverIn, WebserverOut, WebserverUpdate
from core.service import HostManagementService
from django.http import HttpRequest
from ninja import Router

from ms_dome.api import api

webservers = Router(tags=["webservers"])
api.add_router("/webservers", webservers)


@webservers.get("/", response=list[WebserverOut])
def list_webservers(request: HttpRequest):
    return HostManagementService(request.auth).list_webservers()  # ty: ignore[unresolved-attribute]


@webservers.get("/{webserver_id}", response={200: WebserverOut, 404: ErrorOut})
def get_webserver(request: HttpRequest, webserver_id: UUID):
    return HostManagementService(request.auth).get_webserver(webserver_id)  # ty: ignore[unresolved-attribute]


@webservers.post("/", response={201: WebserverOut, 409: ErrorOut, 422: ErrorOut})
def create_webserver(request: HttpRequest, payload: WebserverIn):
    return 201, HostManagementService(request.auth).create_webserver(**payload.dict())  # ty: ignore[unresolved-attribute]


@webservers.patch("/{webserver_id}", response={200: WebserverOut, 404: ErrorOut, 409: ErrorOut, 422: ErrorOut})
def update_webserver(request: HttpRequest, webserver_id: UUID, payload: WebserverUpdate):
    service = HostManagementService(request.auth)  # ty: ignore[unresolved-attribute]
    return service.update_webserver(webserver_id, payload.dict(exclude_unset=True))


@webservers.delete("/{webserver_id}", response={204: None, 404: ErrorOut})
def delete_webserver(request: HttpRequest, webserver_id: UUID):
    HostManagementService(request.auth).delete_webserver(webserver_id)  # ty: ignore[unresolved-attribute]
    return 204, None
