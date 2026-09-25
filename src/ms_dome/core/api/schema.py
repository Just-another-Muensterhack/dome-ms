from datetime import datetime
from uuid import UUID

from ninja import Field, Schema


class DomainIn(Schema):
    name: str = Field(..., max_length=255)
    wildcard: bool = False
    website_id: UUID | None = None
    webserver_id: UUID | None = None


class DomainUpdate(Schema):
    """Partial update, only the fields sent are changed.

    Send `website_id` / `webserver_id: null` to detach the host. Attaching the domain to one kind of host detaches it
    from the other, unless that one is sent as well.
    """

    name: str | None = Field(None, max_length=255)
    wildcard: bool | None = None
    website_id: UUID | None = None
    webserver_id: UUID | None = None


class DomainOut(Schema):
    id: UUID
    name: str
    wildcard: bool
    website_id: UUID | None
    webserver_id: UUID | None
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


class WebserverIn(Schema):
    """At least one of `ipv4`, `ipv6` and `cname` must be set."""

    name: str = Field(..., max_length=255)
    description: str = ""
    tags: list[str] = []
    ipv4: str | None = None
    ipv6: str | None = None
    cname: str = Field("", max_length=255)


class WebserverUpdate(Schema):
    """Partial update, only the fields sent are changed.

    Send `ipv4` / `ipv6: null` or `cname: ""` to clear an address, at least one of them must stay set.
    """

    name: str | None = Field(None, max_length=255)
    description: str | None = None
    tags: list[str] | None = None
    ipv4: str | None = None
    ipv6: str | None = None
    cname: str | None = Field(None, max_length=255)


class WebserverOut(Schema):
    id: UUID
    name: str
    description: str
    tags: list[str]
    ipv4: str | None
    ipv6: str | None
    cname: str
    domains: list[DomainOut]
    created_at: datetime
    updated_at: datetime


class ErrorOut(Schema):
    detail: str | dict[str, list[str]]
