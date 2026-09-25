"""Prometheus endpoint exposing metadata of the platform like the number of domains and hosts.

The values are read from the database on every scrape, so every gunicorn worker returns the same numbers and no
multiprocess setup is needed.
"""
import hmac
import time
from collections.abc import Iterator
from datetime import timedelta

from django.conf import settings
from django.contrib.auth.models import User
from django.db import DatabaseError, connection
from django.db.migrations.executor import MigrationExecutor
from django.db.models import Count, Exists, Max, OuterRef, Q
from django.http import HttpRequest, HttpResponse
from django.utils import timezone
from prometheus_client import CONTENT_TYPE_LATEST, CollectorRegistry, generate_latest
from prometheus_client.core import GaugeMetricFamily
from prometheus_client.registry import Collector

from core.models import Domain, Webserver, Website
from website.models import WebsiteContent

ACTIVE_USER_WINDOWS = {"1d": timedelta(days=1), "7d": timedelta(days=7), "30d": timedelta(days=30)}


def _bool(value: bool) -> str:
    return "true" if value else "false"


def _users() -> Iterator[GaugeMetricFamily]:
    users = GaugeMetricFamily("msdome_users", "Number of users.", labels=["role"])
    counts = User.objects.aggregate(
        superuser=Count("id", filter=Q(is_superuser=True)),
        staff=Count("id", filter=Q(is_staff=True, is_superuser=False)),
        user=Count("id", filter=Q(is_staff=False, is_superuser=False)),
    )
    for role, count in counts.items():
        users.add_metric([role], count)
    yield users

    active = GaugeMetricFamily(
        "msdome_users_active", "Number of users that logged in within the time window.", labels=["window"]
    )
    now = timezone.now()
    counts = User.objects.aggregate(
        **{window: Count("id", filter=Q(last_login__gte=now - delta)) for window, delta in ACTIVE_USER_WINDOWS.items()}
    )
    for window, count in counts.items():
        active.add_metric([window], count)
    yield active

    yield GaugeMetricFamily(
        "msdome_users_with_domains",
        "Number of users owning at least one domain.",
        value=User.objects.filter(Exists(Domain.objects.filter(owner=OuterRef("pk")))).count(),
    )


def _domains() -> Iterator[GaugeMetricFamily]:
    domains = GaugeMetricFamily(
        "msdome_domains", "Number of domains by the kind of host they point to.", labels=["host_type", "wildcard"]
    )
    # annotation names must not shadow the `website` / `webserver` fields the filters refer to
    rows = Domain.objects.values("wildcard").annotate(
        count_website=Count("id", filter=Q(website__isnull=False)),
        count_webserver=Count("id", filter=Q(webserver__isnull=False)),
        count_none=Count("id", filter=Q(website__isnull=True, webserver__isnull=True)),
    )
    for row in rows:
        for host_type in ("website", "webserver", "none"):
            domains.add_metric([host_type, _bool(row["wildcard"])], row[f"count_{host_type}"])
    yield domains

    kinds = GaugeMetricFamily(
        "msdome_domains_by_kind",
        f"Number of domains below the platform domain {settings.PLATFORM_DOMAIN} and own domains of the users.",
        labels=["kind"],
    )
    platform = Q(name=settings.PLATFORM_DOMAIN) | Q(name__endswith=f".{settings.PLATFORM_DOMAIN}")
    counts = Domain.objects.aggregate(platform=Count("id", filter=platform), custom=Count("id", filter=~platform))
    for kind, count in counts.items():
        kinds.add_metric([kind], count)
    yield kinds


def _hosts() -> Iterator[GaugeMetricFamily]:
    for model, name in ((Website, "websites"), (Webserver, "webservers")):
        hosts = GaugeMetricFamily(f"msdome_{name}", f"Number of {name}.", labels=["deleted"])
        counts = model.objects.aggregate(
            true=Count("id", filter=Q(deleted=True)),
            false=Count("id", filter=Q(deleted=False)),
        )
        for deleted, count in counts.items():
            hosts.add_metric([deleted], count)
        yield hosts

    yield GaugeMetricFamily(
        "msdome_websites_without_content",
        "Number of active websites that have no generated page yet.",
        value=Website.objects.filter(deleted=False, content__isnull=True).count(),
    )

    addresses = GaugeMetricFamily(
        "msdome_webserver_addresses", "Number of active webservers per configured address type.", labels=["type"]
    )
    counts = Webserver.objects.filter(deleted=False).aggregate(
        ipv4=Count("id", filter=Q(ipv4__isnull=False)),
        ipv6=Count("id", filter=Q(ipv6__isnull=False)),
        cname=Count("id", filter=~Q(cname="")),
    )
    for address_type, count in counts.items():
        addresses.add_metric([address_type], count)
    yield addresses

    contents = GaugeMetricFamily(
        "msdome_website_contents", "Number of generated website pages by language model.", labels=["model"]
    )
    for row in WebsiteContent.objects.values("model").annotate(count=Count("id")):
        contents.add_metric([row["model"]], row["count"])
    yield contents


def _timestamps() -> Iterator[GaugeMetricFamily]:
    latest = GaugeMetricFamily(
        "msdome_last_created_timestamp_seconds", "Unix time the newest object of a kind was created.", labels=["object"]
    )
    for kind, queryset, field in (
        ("user", User.objects, "date_joined"),
        ("domain", Domain.objects, "created_at"),
        ("website", Website.objects, "created_at"),
        ("webserver", Webserver.objects, "created_at"),
        ("website_content", WebsiteContent.objects, "updated_at"),
    ):
        value = queryset.aggregate(latest=Max(field))["latest"]
        if value is not None:
            latest.add_metric([kind], value.timestamp())
    yield latest


def _migrations() -> Iterator[GaugeMetricFamily]:
    executor = MigrationExecutor(connection)
    plan = executor.migration_plan(executor.loader.graph.leaf_nodes())
    yield GaugeMetricFamily("msdome_migrations_pending", "Number of unapplied database migrations.", value=len(plan))


class MetadataCollector(Collector):
    def collect(self) -> Iterator[GaugeMetricFamily]:
        start = time.perf_counter()
        try:
            # collect everything first so a failing query does not leave a partial set of metrics
            families = [*_users(), *_domains(), *_hosts(), *_timestamps(), *_migrations()]
            up = 1
        except DatabaseError:
            families, up = [], 0

        yield from families
        yield GaugeMetricFamily("msdome_database_up", "Whether the database could be queried.", value=up)
        yield GaugeMetricFamily(
            "msdome_metrics_collect_duration_seconds",
            "Time it took to collect the metadata metrics.",
            value=time.perf_counter() - start,
        )


registry = CollectorRegistry()
registry.register(MetadataCollector())


def metrics(request: HttpRequest) -> HttpResponse:
    token = settings.METRICS_TOKEN
    if token and not hmac.compare_digest(request.headers.get("Authorization", ""), f"Bearer {token}"):
        return HttpResponse(status=401, headers={"WWW-Authenticate": "Bearer"})
    return HttpResponse(generate_latest(registry), content_type=CONTENT_TYPE_LATEST)
