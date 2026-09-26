from __future__ import annotations

import json
import math
import re
from datetime import UTC, datetime, timedelta
from typing import Any
from urllib.error import URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

TIMEOUT_SECONDS = 8
MAX_BYTES = 2_000_000
RANGE_DAYS = 30
STEP_SECONDS = 3600


def host_label(name: str, *, wildcard: bool = False) -> str:
    return f"*.{name}" if wildcard else name


def host_regex(hosts: list[str]) -> str:
    return "|".join(re.escape(host) for host in hosts if host)


def empty_analytics() -> dict[str, Any]:
    return {
        "visitors": {"all": 0},
        "requests": [],
        "blockedRequests": [],
    }


def _round_count(value: object) -> int:
    try:
        number = float(value)  # ty: ignore[invalid-argument-type]
    except (TypeError, ValueError):
        return 0
    if not math.isfinite(number) or number <= 0:
        return 0
    return int(round(number))


def parse_matrix(payload: object) -> list[dict[str, Any]]:
    if not isinstance(payload, dict) or payload.get("status") != "success":
        raise ValueError("prometheus matrix response is invalid")
    data = payload.get("data")
    if not isinstance(data, dict) or data.get("resultType") != "matrix":
        raise ValueError("prometheus matrix response is invalid")
    result = data.get("result")
    if not isinstance(result, list):
        raise ValueError("prometheus matrix response is invalid")

    totals: dict[int, float] = {}
    for series in result:
        if not isinstance(series, dict):
            continue
        values = series.get("values")
        if not isinstance(values, list):
            continue
        for point in values:
            if not isinstance(point, list) or len(point) < 2:
                continue
            try:
                stamp = int(float(point[0]))
                amount = float(point[1])
            except (TypeError, ValueError):
                continue
            if not math.isfinite(amount):
                continue
            totals[stamp] = totals.get(stamp, 0.0) + amount

    return [
        {
            "count": _round_count(amount),
            "date": datetime.fromtimestamp(stamp, tz=UTC).isoformat().replace("+00:00", "Z"),
        }
        for stamp, amount in sorted(totals.items())
    ]


def parse_country_vector(payload: object) -> dict[str, int]:
    if not isinstance(payload, dict) or payload.get("status") != "success":
        raise ValueError("prometheus vector response is invalid")
    data = payload.get("data")
    if not isinstance(data, dict) or data.get("resultType") != "vector":
        raise ValueError("prometheus vector response is invalid")
    result = data.get("result")
    if not isinstance(result, list):
        raise ValueError("prometheus vector response is invalid")

    visitors: dict[str, int] = {"all": 0}
    for series in result:
        if not isinstance(series, dict):
            continue
        metric = series.get("metric")
        value = series.get("value")
        if not isinstance(metric, dict) or not isinstance(value, list) or len(value) < 2:
            continue
        count = _round_count(value[1])
        visitors["all"] += count
        country = metric.get("country")
        if not isinstance(country, str):
            continue
        code = country.strip().upper()
        if len(code) != 2 or code == "--" or code == "-":
            continue
        visitors[code] = visitors.get(code, 0) + count
    return visitors


class PrometheusError(Exception):
    pass


def _request_json(url: str, timeout: float = TIMEOUT_SECONDS) -> object:
    request = Request(url, headers={"Accept": "application/json", "User-Agent": "dome-ms"})
    try:
        with urlopen(request, timeout=timeout) as response:
            raw = response.read(MAX_BYTES + 1)
    except (URLError, TimeoutError, OSError) as exc:
        raise PrometheusError("prometheus is unreachable") from exc
    if len(raw) > MAX_BYTES:
        raise PrometheusError("prometheus response is too large")
    try:
        return json.loads(raw)
    except json.JSONDecodeError as exc:
        raise PrometheusError("prometheus response is invalid") from exc


def query_range(base_url: str, query: str, *, start: datetime, end: datetime, step: int = STEP_SECONDS) -> object:
    params = urlencode(
        {
            "query": query,
            "start": start.timestamp(),
            "end": end.timestamp(),
            "step": step,
        }
    )
    return _request_json(f"{base_url.rstrip('/')}/api/v1/query_range?{params}")


def query_instant(base_url: str, query: str, *, moment: datetime | None = None) -> object:
    params: dict[str, str | float] = {"query": query}
    if moment is not None:
        params["time"] = moment.timestamp()
    return _request_json(f"{base_url.rstrip('/')}/api/v1/query?{urlencode(params)}")


def website_hosts(managed_domain: str, domains: list[tuple[str, bool]]) -> list[str]:
    hosts = [managed_domain]
    for name, wildcard in domains:
        label = host_label(name, wildcard=wildcard)
        if label not in hosts:
            hosts.append(label)
    return hosts


def fetch_website_analytics(base_url: str, hosts: list[str]) -> dict[str, Any]:
    if not hosts:
        return empty_analytics()

    selector = f'host=~"{host_regex(hosts)}"'
    end = datetime.now(tz=UTC)
    start = end - timedelta(days=RANGE_DAYS)
    requests_query = f"sum by (host) (increase(dome_http_response_count_total{{{selector}}}[1h]))"
    blocked_query = f"sum by (host) (increase(dome_waf_blocked_total{{{selector}}}[1h]))"
    visitors_query = f"sum by (country) (increase(dome_http_response_count_total{{{selector}}}[{RANGE_DAYS}d]))"

    try:
        requests = parse_matrix(query_range(base_url, requests_query, start=start, end=end))
        blocked = parse_matrix(query_range(base_url, blocked_query, start=start, end=end))
        visitors = parse_country_vector(query_instant(base_url, visitors_query, moment=end))
    except ValueError as exc:
        raise PrometheusError(str(exc)) from exc

    return {
        "visitors": visitors,
        "requests": requests,
        "blockedRequests": blocked,
    }
