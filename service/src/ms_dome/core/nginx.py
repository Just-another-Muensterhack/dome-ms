"""nginx server configs for every host, website version and verified domain.

Every served name gets its own config file in `settings.NGINX_CONFIG_DIR`:
- `<website id>.<base>` and the website's verified domains serve its active version,
- `<content id>.<base>` serves that version,
- `<webserver id>.<base>` and the webserver's verified domains are proxied to its address.

`sync` renders all configs from the database and brings the directory in line with them, so a missed change is
repaired by the next sync. nginx has to be reloaded to pick up the changes.
"""

import fcntl
import functools
import ipaddress
import logging
import os
import tempfile
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

from django.apps import apps
from django.conf import settings
from django.core.exceptions import ImproperlyConfigured
from django.db import transaction
from django.db.models import Q
from django.template import Engine

from core.models import Domain, Webserver, Website, is_managed_domain_name

logger = logging.getLogger(__name__)

SUFFIX = ".conf"
LOCK_FILE = ".sync.lock"

# a template and its context, rendered once per server name
type Target = tuple[str, dict[str, Any]]


@dataclass
class SyncResult:
    written: list[str] = field(default_factory=list)
    removed: list[str] = field(default_factory=list)
    unchanged: int = 0

    @property
    def changed(self) -> bool:
        return bool(self.written or self.removed)


def schedule_sync() -> None:
    """Sync once the current transaction commits, a failure is logged and does not affect the caller."""
    if settings.NGINX_CONFIG_DIR is not None:
        transaction.on_commit(sync, robust=True)


def sync() -> SyncResult:
    """Write the config of every served name, rewriting only changed files, and remove all other configs."""
    directory = settings.NGINX_CONFIG_DIR
    if directory is None:
        raise ImproperlyConfigured("Set NGINX_CONFIG_DIR to write the nginx configs.")
    directory.mkdir(parents=True, exist_ok=True)
    result = SyncResult()
    with open(directory / LOCK_FILE, "w") as lock:
        # concurrent syncs run one after another, each reads the database under the lock so the last one wins
        fcntl.flock(lock, fcntl.LOCK_EX)
        configs = render_configs()
        for name, content in configs.items():
            path = directory / name
            if path.exists() and path.read_text() == content:
                result.unchanged += 1
                continue
            _write_atomic(path, content)
            result.written.append(name)
        for path in directory.glob(f"*{SUFFIX}"):
            if path.name not in configs:
                path.unlink()
                result.removed.append(path.name)
    if result.changed:
        logger.info("nginx configs synced: %d written, %d removed", len(result.written), len(result.removed))
    return result


def render_configs() -> dict[str, str]:
    """The file name and content of every config."""
    WebsiteContent = apps.get_model("website", "WebsiteContent")  # the website app depends on core, not vice versa
    engine = _engine(settings.NGINX_TEMPLATE_DIR)
    configs: dict[str, str] = {}

    def add(server_name: str, description: str, target: Target) -> None:
        template, context = target
        context = {**context, "server_name": server_name, "description": description}
        configs[_file_name(server_name)] = engine.render_to_string(template, context)

    contents = WebsiteContent.objects.filter(website__deleted=False).only("id", "website_id", "is_active", "html")
    active = {content.website_id: content for content in contents if content.is_active}
    targets: dict[Any, Target] = {}

    for website in Website.objects.filter(deleted=False).only("id"):
        targets[website.pk] = _static(active.get(website.pk))
        add(website.managed_domain, f"website {website.pk}", targets[website.pk])
    for webserver in Webserver.objects.filter(deleted=False).only("id", "ipv4", "ipv6", "cname"):
        targets[webserver.pk] = _proxy(webserver)
        add(webserver.managed_domain, f"webserver {webserver.pk}", targets[webserver.pk])
    for content in contents:
        add(content.managed_domain, f"website content {content.pk}", _static(content))

    # a verified name is unique, so no domain overwrites another's config; managed ones are verified on registration
    domains = (
        Domain.objects.filter(verified_at__isnull=False)
        .filter(Q(website__deleted=False) | Q(webserver__deleted=False))
        .order_by("name")
    )
    for domain in domains:
        server_name = f"*.{domain.name}" if domain.wildcard else domain.name
        add(server_name, f"domain {domain.pk}", targets[domain.website_id or domain.webserver_id])
    return configs


@functools.cache
def _engine(directory: Path) -> Engine:
    # a separate engine, so the templates are only looked up in `directory` and not in the apps' template dirs
    return Engine(dirs=[str(directory)], autoescape=True)


def _file_name(server_name: str) -> str:
    # every name is a validated host name or a UUID below the base domain, never a path; `_` is not allowed in a host
    # name, so a wildcard never shares a file with a plain name
    name = server_name.replace("*.", "_wildcard.", 1)
    if "/" in name or name.startswith("."):
        raise ValueError(f"Unsafe config name {server_name!r}.")
    return f"{name}{SUFFIX}"


def _static(content: Any | None) -> Target:
    """Serve the HTML of `content`, 404 without one."""
    root = settings.NGINX_MEDIA_ROOT / Path(content.html.name).parent if content is not None else None
    return "static.conf", {"root": root}


def _proxy(webserver: Webserver) -> Target:
    """Proxy to the webserver's first public address, 404 without one."""
    for address in (webserver.ipv4, webserver.ipv6):
        if not address:
            continue
        ip = ipaddress.ip_address(address)  # ty: ignore[invalid-argument-type]
        # private, loopback and link local addresses would expose our internal network
        if ip.is_global:
            upstream = f"[{ip}]" if ip.version == 6 else str(ip)
            return "proxy.conf", {"upstream": upstream, "resolver": None}
    if webserver.cname and not is_managed_domain_name(webserver.cname):  # ty: ignore[invalid-argument-type]
        return "proxy.conf", {"upstream": webserver.cname, "resolver": settings.NGINX_RESOLVER}
    logger.debug("webserver %s has no public address, it is not proxied", webserver.pk)
    return _static(None)


def _write_atomic(path: Path, content: str) -> None:
    # a temporary name without the config suffix, nginx never includes a half written file
    fd, tmp = tempfile.mkstemp(dir=path.parent, prefix=".", suffix=".tmp")
    try:
        with os.fdopen(fd, "w") as file:
            file.write(content)
        os.chmod(tmp, 0o644)
        os.replace(tmp, path)
    except BaseException:
        os.unlink(tmp)
        raise
