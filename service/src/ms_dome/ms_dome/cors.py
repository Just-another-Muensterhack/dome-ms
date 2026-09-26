import os

from django.conf import settings
from django.http import HttpRequest, HttpResponse

# generated and uploaded websites are static files served from this origin
MEDIA_CONTENT_SECURITY_POLICY = (
    "default-src 'none'",
    "script-src 'self' 'unsafe-inline' https: http:",
    "img-src 'self' https: http: data:",
    "style-src 'self' 'unsafe-inline' https: http:",
    "font-src 'self' https: http: data:",
    "connect-src 'self' https: http:",
    "base-uri 'none'",
    "form-action 'none'",
)


class CorsMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response
        raw = os.environ.get(
            "CORS_ALLOWED_ORIGINS",
            "http://localhost:3000,http://127.0.0.1:3000",
        )
        self.allowed_origins = [item.strip() for item in raw.split(",") if item.strip()]
        self.media_prefix = "/" + settings.MEDIA_URL.lstrip("/")

    def __call__(self, request: HttpRequest) -> HttpResponse:
        if request.method == "OPTIONS":
            response = HttpResponse()
        else:
            response = self.get_response(request)

        origin = request.headers.get("Origin")
        if origin and (origin in self.allowed_origins or "*" in self.allowed_origins):
            response["Access-Control-Allow-Origin"] = origin
            response["Access-Control-Allow-Credentials"] = "true"
            response["Access-Control-Allow-Headers"] = request.headers.get(
                "Access-Control-Request-Headers",
                "authorization,content-type",
            )
            response["Access-Control-Allow-Methods"] = "GET, POST, PUT, PATCH, DELETE, OPTIONS"
            response["Access-Control-Max-Age"] = "86400"

        # media is only served by django in DEBUG, the frontend embeds the websites in an iframe
        if request.path.startswith(self.media_prefix):
            response.headers.pop("X-Frame-Options", None)
            response["Content-Security-Policy"] = "; ".join(
                (*MEDIA_CONTENT_SECURITY_POLICY, f"frame-ancestors {self.frame_ancestors()}")
            )

        return response

    def frame_ancestors(self) -> str:
        if "*" in self.allowed_origins:
            return "*"
        return " ".join(("'self'", *self.allowed_origins))
