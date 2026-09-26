"""Keep the nginx configs in line with the served hosts, website versions and domains."""

from django.db.models.signals import post_delete, post_save

from core import nginx
from core.models import Domain, Webserver, Website

# every change that adds, removes or retargets a served name; the website content is referenced lazily, it lives in
# the website app which depends on core
SENDERS = (Domain, Website, Webserver, "website.WebsiteContent")


def _changed(sender, **kwargs) -> None:
    nginx.schedule_sync()


def connect() -> None:
    for sender in SENDERS:
        for signal in (post_save, post_delete):
            signal.connect(_changed, sender=sender, dispatch_uid="core.signals.nginx_sync")
