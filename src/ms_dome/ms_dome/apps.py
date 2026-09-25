from django.contrib.admin.apps import AdminConfig


class KeycloakAdminConfig(AdminConfig):
    default_site = "ms_dome.admin.KeycloakAdminSite"
