"""
URL configuration for ms_dome project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from pathlib import Path

from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.http import HttpRequest, JsonResponse
from django.urls import include, path, re_path
from django.views.static import serve
from django.utils.module_loading import autodiscover_modules

from ms_dome.api import api


def health(_request: HttpRequest) -> JsonResponse:
    return JsonResponse({"status": "ok"})

# every app registers its routers on `api` when its `api` module is imported
autodiscover_modules("api")

urlpatterns = [
    path('health/', health),
    path('admin/', admin.site.urls),
    path('oidc/', include('mozilla_django_oidc.urls')),
    path('api/v1/', api.urls),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
else:
    # staticfiles only serves in DEBUG, so serve the admin's assets straight from the package
    urlpatterns.append(re_path(
        rf"^{settings.STATIC_URL.lstrip('/')}(?P<path>admin/.*)$",
        serve,
        {"document_root": Path(admin.__file__).parent / "static"},
    ))
