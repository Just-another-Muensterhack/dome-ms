from django.conf import settings
from django.core.management.base import BaseCommand, CommandError

from core import nginx


class Command(BaseCommand):
    help = (
        "Write the nginx config of every host, website version and verified domain to NGINX_CONFIG_DIR and remove "
        "the stale ones. Run at startup, afterwards the configs are kept in sync on every change."
    )

    def handle(self, *args, **options):
        if settings.NGINX_CONFIG_DIR is None:
            raise CommandError("Set NGINX_CONFIG_DIR to write the nginx configs.")
        result = nginx.sync()
        self.stdout.write(
            self.style.SUCCESS(
                f"{len(result.written)} written, {len(result.removed)} removed, {result.unchanged} unchanged "
                f"in {settings.NGINX_CONFIG_DIR}"
            )
        )
