from core.api.schema import ErrorOut
from django.http import HttpRequest
from ninja import Router

from ms_dome.api import api
from website.schema import WebsiteContentIn, WebsiteContentOut
from website.service import WebsiteBuilderService, WebsiteGenerationError

website_builder = Router(tags=["website builder"])
api.add_router("/website-builder", website_builder)


@api.exception_handler(WebsiteGenerationError)
def website_generation_error(request: HttpRequest, exc: WebsiteGenerationError):
    return api.create_response(request, {"detail": str(exc)}, status=502)


@website_builder.post("/", response={200: WebsiteContentOut, 404: ErrorOut, 409: ErrorOut, 422: ErrorOut, 502: ErrorOut})
def generate_website(request: HttpRequest, payload: WebsiteContentIn):
    """Generate the page of a website from its description and attributes, a previously generated page is replaced."""
    service = WebsiteBuilderService(request.auth)  # ty: ignore[unresolved-attribute]
    return service.generate_website(
        payload.website_id, payload.description, payload.attributes.model_dump(exclude_none=True)
    )
