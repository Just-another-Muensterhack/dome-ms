from analysis.prometheus import (
    host_label,
    host_regex,
    parse_country_vector,
    parse_matrix,
    website_hosts,
)


def test_host_label_marks_wildcards() -> None:
    assert host_label("example.com") == "example.com"
    assert host_label("example.com", wildcard=True) == "*.example.com"


def test_host_regex_escapes_dots_and_stars() -> None:
    assert host_regex(["a.example.com", "*.example.com"]) == r"a\.example\.com|\*\.example\.com"


def test_website_hosts_deduplicates_managed_and_custom() -> None:
    hosts = website_hosts(
        "11111111-1111-1111-1111-111111111111.dome.ms",
        [("shop.example.com", False), ("example.com", True), ("shop.example.com", False)],
    )
    assert hosts == [
        "11111111-1111-1111-1111-111111111111.dome.ms",
        "shop.example.com",
        "*.example.com",
    ]


def test_parse_matrix_sums_series_by_timestamp() -> None:
    payload = {
        "status": "success",
        "data": {
            "resultType": "matrix",
            "result": [
                {
                    "metric": {"host": "a.example.com"},
                    "values": [[1_700_000_000, "1.2"], [1_700_003_600, "2.4"]],
                },
                {
                    "metric": {"host": "b.example.com"},
                    "values": [[1_700_000_000, "0.8"], [1_700_003_600, "0.1"]],
                },
            ],
        },
    }

    assert parse_matrix(payload) == [
        {"count": 2, "date": "2023-11-14T22:13:20Z"},
        {"count": 2, "date": "2023-11-14T23:13:20Z"},
    ]


def test_parse_matrix_sums_fractional_counts() -> None:
    payload = {
        "status": "success",
        "data": {
            "resultType": "matrix",
            "result": [
                {"metric": {"host": "a.example.com"}, "values": [[1_700_003_600, "2.6"]]},
                {"metric": {"host": "b.example.com"}, "values": [[1_700_003_600, "0.4"]]},
            ],
        },
    }
    assert parse_matrix(payload) == [{"count": 3, "date": "2023-11-14T23:13:20Z"}]


def test_parse_country_vector_keeps_total_and_skips_unknown() -> None:
    payload = {
        "status": "success",
        "data": {
            "resultType": "vector",
            "result": [
                {"metric": {"country": "DE"}, "value": [1_700_000_000, "10"]},
                {"metric": {"country": "at"}, "value": [1_700_000_000, "4"]},
                {"metric": {"country": "-"}, "value": [1_700_000_000, "3"]},
                {"metric": {"country": "XX"}, "value": [1_700_000_000, "1"]},
            ],
        },
    }

    assert parse_country_vector(payload) == {
        "all": 18,
        "DE": 10,
        "AT": 4,
        "XX": 1,
    }
