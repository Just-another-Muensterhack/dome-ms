from django.http import HttpRequest
from ninja import NinjaAPI, Schema

from ms_dome.auth import OIDCBearer  # ty: ignore[unresolved-import]

api = NinjaAPI(title="MSDome API", auth=OIDCBearer())


class UserSchema(Schema):
    username: str
    email: str
    first_name: str
    last_name: str


@api.get("/me", response=UserSchema)
def me(request: HttpRequest):
    return request.user  # ty: ignore[unresolved-attribute]
