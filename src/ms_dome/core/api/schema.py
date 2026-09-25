from datetime import datetime
from uuid import UUID

from ninja import Field, Schema


class DomainIn(Schema):
    name: str = Field(..., max_length=255)
    wildcard: bool = False
    website_id: UUID | None = None


class DomainUpdate(Schema):
    """Partial update, only the fields sent are changed. Send `website_id: null` to detach the website."""

    name: str | None = Field(None, max_length=255)
    wildcard: bool | None = None
    website_id: UUID | None = None


class DomainOut(Schema):
    id: UUID
    name: str
    wildcard: bool
    website_id: UUID | None
    created_at: datetime
    updated_at: datetime


class WebsiteIn(Schema):
    name: str = Field(..., max_length=255)
    description: str = ""
    tags: list[str] = []


class WebsiteUpdate(Schema):
    """Partial update, only the fields sent are changed."""

    name: str | None = Field(None, max_length=255)
    description: str | None = None
    tags: list[str] | None = None


class WebsiteOut(Schema):
    id: UUID
    name: str
    description: str
    tags: list[str]
    domains: list[DomainOut]
    created_at: datetime
    updated_at: datetime


class ErrorOut(Schema):
    detail: str | dict[str, list[str]]
