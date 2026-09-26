import json
from urllib.error import URLError
from urllib.request import Request, urlopen

STATUS_PAGE_URL = "https://status.dome.ms/"
DEFAULT_STATUSES_URL = "https://status.dome.ms/api/v1/endpoints/statuses"
TIMEOUT_SECONDS = 4
MAX_BYTES = 1_000_000


def latest_result(endpoint: object) -> dict | None:
    if not isinstance(endpoint, dict):
        return None
    results = endpoint.get("results")
    if not isinstance(results, list):
        return None
    stamped = [item for item in results if isinstance(item, dict)]
    if len(stamped) == 0:
        return None
    return max(stamped, key=lambda item: str(item.get("timestamp") or ""))


def all_systems_operational(payload: object) -> bool:
    if not isinstance(payload, list) or len(payload) == 0:
        return False
    for endpoint in payload:
        result = latest_result(endpoint)
        if result is None or result.get("success") is not True:
            return False
    return True


def fetch_statuses(url: str, timeout: float = TIMEOUT_SECONDS) -> object:
    request = Request(url, headers={"Accept": "application/json", "User-Agent": "dome-ms"})
    with urlopen(request, timeout=timeout) as response:
        raw = response.read(MAX_BYTES + 1)
    if len(raw) > MAX_BYTES:
        raise ValueError("status payload is too large")
    return json.loads(raw)


def systems_are_operational(url: str, timeout: float = TIMEOUT_SECONDS) -> bool:
    try:
        return all_systems_operational(fetch_statuses(url, timeout))
    except (URLError, TimeoutError, OSError, json.JSONDecodeError, ValueError):
        return False
