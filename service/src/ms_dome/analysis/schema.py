from datetime import datetime
from uuid import UUID

from ninja import Schema


class Metric(Schema):
    name: str
    value: int

class MetricSet(Schema):
    domain_id: UUID
    timestamp: datetime
    metric: list[Metric]
