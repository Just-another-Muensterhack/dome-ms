from core.system_status import all_systems_operational, latest_result


def test_latest_result_is_the_newest_timestamp() -> None:
    endpoint = {
        "results": [
            {"success": False, "timestamp": "2026-09-26T15:10:00Z"},
            {"success": True, "timestamp": "2026-09-26T15:08:00Z"},
        ]
    }

    assert latest_result(endpoint) == {"success": False, "timestamp": "2026-09-26T15:10:00Z"}


def test_all_systems_operational_when_every_latest_result_succeeds() -> None:
    payload = [
        {"results": [{"success": False, "timestamp": "2026-09-26T15:07:00Z"}, {"success": True, "timestamp": "2026-09-26T15:10:00Z"}]},
        {"results": [{"success": True, "timestamp": "2026-09-26T15:10:00Z"}]},
    ]

    assert all_systems_operational(payload) is True


def test_not_operational_when_any_latest_result_fails() -> None:
    payload = [
        {"results": [{"success": True, "timestamp": "2026-09-26T15:10:00Z"}]},
        {"results": [{"success": True, "timestamp": "2026-09-26T15:08:00Z"}, {"success": False, "timestamp": "2026-09-26T15:10:00Z"}]},
    ]

    assert all_systems_operational(payload) is False


def test_not_operational_without_a_complete_feed() -> None:
    assert all_systems_operational([]) is False
    assert all_systems_operational([{"results": []}]) is False
    assert all_systems_operational(None) is False
    assert all_systems_operational([{"results": [{"timestamp": "2026-09-26T15:10:00Z"}]}]) is False
