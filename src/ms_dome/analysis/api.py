from django.http import HttpRequest
from ninja import Router, Schema


class UserSchema(Schema):
    username: str
    email: str
    first_name: str
    last_name: str

analysis = Router(tags=["analysis"])

@analysis.get("/me", response=UserSchema)
def me(request: HttpRequest):
    return request.user  # ty: ignore[unresolved-attribute]
