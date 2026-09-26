from ninja import Schema


class WebsiteAnalyticsCountOut(Schema):
    count: int
    date: str


class WebsiteAnalyticsOut(Schema):
    visitors: dict[str, int]
    requests: list[WebsiteAnalyticsCountOut]
    blockedRequests: list[WebsiteAnalyticsCountOut]
