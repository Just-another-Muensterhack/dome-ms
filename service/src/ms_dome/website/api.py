from uuid import UUID

from core.api.schema import ErrorOut
from django.core.exceptions import ValidationError
from django.http import HttpRequest
from ninja import File, Form, Router, UploadedFile
from website.schema import (
    WebsiteContentEditIn,
    WebsiteContentIn,
    WebsiteContentOut,
    WebsiteContentUpdate,
    WebsiteContentUploadIn,
)
from website.service import WebsiteBuilderService, WebsiteGenerationError

from ms_dome.api import api

website_builder = Router(tags=["website builder"])
api.add_router("/website-builder", website_builder)


@api.exception_handler(WebsiteGenerationError)
def website_generation_error(request: HttpRequest, exc: WebsiteGenerationError):
    return api.create_response(request, {"detail": str(exc)}, status=502)


@website_builder.get("/", response={200: list[WebsiteContentOut], 404: ErrorOut})
def list_contents(request: HttpRequest, website_id: UUID):
    """All versions of a website's page, newest first."""
    return WebsiteBuilderService(request.auth).list_contents(website_id)  # ty: ignore[unresolved-attribute]


# registered before the `/{content_id}` routes, their pattern also matches `/upload`
@website_builder.post("/upload", response={201: WebsiteContentOut, 404: ErrorOut, 409: ErrorOut, 422: ErrorOut})
def upload_website(request: HttpRequest, payload: Form[WebsiteContentUploadIn], files: File[list[UploadedFile]]):
    """Create a new version of a website's page from uploaded files (HTML, CSS, JavaScript, images, videos, fonts,
    ...), stored as they are. `index.html` is the entry page.

    Send the files as `files` and their relative paths, e.g. `css/style.css`, in the same order as `paths`; without
    `paths` the files are stored under their names. The first version of a website is activated, later ones through
    the activate endpoint.
    """
    paths = payload.paths or [file.name or "" for file in files]
    if len(paths) != len(files):
        raise ValidationError({"paths": "Send one path per file."})
    service = WebsiteBuilderService(request.auth)  # ty: ignore[unresolved-attribute]
    return 201, service.upload_website(payload.website_id, list(zip(paths, files, strict=True)), payload.name)


@website_builder.post("/generate", response={201: WebsiteContentOut, 404: ErrorOut, 409: ErrorOut, 422: ErrorOut, 502: ErrorOut})
def generate_website(request: HttpRequest, payload: WebsiteContentIn):
    """Generate a new version of a website's page from its description and attributes.

    The first version of a website is activated, later ones through the activate endpoint.
    """
    service = WebsiteBuilderService(request.auth)  # ty: ignore[unresolved-attribute]
    content = service.generate_website(
        payload.website_id, payload.description, payload.attributes.model_dump(exclude_none=True), payload.name
    )
    return 201, content


@website_builder.get("/{content_id}", response={200: WebsiteContentOut, 404: ErrorOut})
def get_content(request: HttpRequest, content_id: UUID):
    return WebsiteBuilderService(request.auth).get_content(content_id)  # ty: ignore[unresolved-attribute]


@website_builder.post(
    "/{content_id}/edit", response={201: WebsiteContentOut, 404: ErrorOut, 409: ErrorOut, 422: ErrorOut, 502: ErrorOut}
)
def edit_content(request: HttpRequest, content_id: UUID, payload: WebsiteContentEditIn):
    """Apply the change described by the prompt to a version, the result is stored as a new, inactive version."""
    service = WebsiteBuilderService(request.auth)  # ty: ignore[unresolved-attribute]
    return 201, service.edit_content(content_id, payload.prompt, payload.name)


@website_builder.patch("/{content_id}", response={200: WebsiteContentOut, 404: ErrorOut, 422: ErrorOut})
def rename_content(request: HttpRequest, content_id: UUID, payload: WebsiteContentUpdate):
    """Rename a version."""
    return WebsiteBuilderService(request.auth).rename_content(content_id, payload.name)  # ty: ignore[unresolved-attribute]


@website_builder.post("/{content_id}/activate", response={200: WebsiteContentOut, 404: ErrorOut, 409: ErrorOut})
def activate_content(request: HttpRequest, content_id: UUID):
    """Make a version the active one of its website, the previously active version is deactivated."""
    return WebsiteBuilderService(request.auth).activate_content(content_id)  # ty: ignore[unresolved-attribute]


@website_builder.delete("/{content_id}", response={204: None, 404: ErrorOut, 422: ErrorOut})
def delete_content(request: HttpRequest, content_id: UUID):
    """Delete a version and its HTML file, the active version only if it is the website's last one."""
    WebsiteBuilderService(request.auth).delete_content(content_id)  # ty: ignore[unresolved-attribute]
    return 204, None
