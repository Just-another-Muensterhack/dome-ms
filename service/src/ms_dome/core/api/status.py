from django.conf import settings
from django.http import HttpRequest
from ninja import Router, Schema

from core.system_status import systems_are_operational
from ms_dome.api import api


class SystemStatusOut(Schema):
    operational: bool


status = Router(tags=["status"])
api.add_router("/status", status)


@status.get("/", response=SystemStatusOut, auth=None)
def system_status(request: HttpRequest) -> SystemStatusOut:
    return SystemStatusOut(operational=systems_are_operational(settings.GATUS_STATUSES_URL))
