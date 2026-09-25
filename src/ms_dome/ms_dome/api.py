
from django.core.exceptions import ValidationError
from django.db import IntegrityError
from django.http import HttpRequest
from ninja import NinjaAPI

from analysis.api import analysis
from core.api import domains, websites
from ms_dome.auth import OIDCBearer

api = NinjaAPI(title="MSDome Core API", auth=OIDCBearer(), urls_namespace="core-api")

api.add_router("/analysis", analysis)
api.add_router("/websites", websites)
api.add_router("/domains", domains)


@api.exception_handler(ValidationError)
def validation_error(request: HttpRequest, exc: ValidationError):
    detail = exc.message_dict if hasattr(exc, "error_dict") else {"__all__": exc.messages}
    return api.create_response(request, {"detail": detail}, status=422)


@api.exception_handler(IntegrityError)
def integrity_error(request: HttpRequest, exc: IntegrityError):
    # race between `validate_unique` and the insert
    return api.create_response(request, {"detail": "The object conflicts with an existing one."}, status=409)
