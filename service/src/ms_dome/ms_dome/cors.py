import os

from django.http import HttpRequest, HttpResponse


class CorsMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response
        raw = os.environ.get(
            "CORS_ALLOWED_ORIGINS",
            "http://localhost:3000,http://127.0.0.1:3000",
        )
        self.allowed_origins = [item.strip() for item in raw.split(",") if item.strip()]

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

        return response
