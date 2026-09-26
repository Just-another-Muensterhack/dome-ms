from datetime import datetime
from typing import Annotated, Any
from uuid import UUID

from ninja import Field, Schema
from pydantic import StringConstraints

from website.service import MAX_ATTRIBUTE_LENGTH, MAX_DESCRIPTION_LENGTH, MAX_PROMPT_LENGTH, MAX_SECTIONS

AttributeText = Annotated[str, StringConstraints(max_length=MAX_ATTRIBUTE_LENGTH)]


class WebsiteAttributes(Schema):
    """Categorical data of a website, free text so the frontend can offer its own choices."""

    category: AttributeText | None = Field(None, examples=["Café"])
    purpose: AttributeText | None = Field(None, examples=["Present the café and its opening hours"])
    location: AttributeText | None = Field(None, examples=["Münster"])
    language: AttributeText = Field("de", examples=["de"])
    tone: AttributeText | None = Field(None, examples=["friendly"])
    sections: list[AttributeText] = Field(default_factory=list, max_length=MAX_SECTIONS, examples=[["about", "contact"]])
    primary_color: str | None = Field(None, pattern=r"^#[0-9a-fA-F]{6}$", examples=["#2a9d8f"])


class WebsiteContentIn(Schema):
    website_id: UUID
    description: str = Field(..., min_length=1, max_length=MAX_DESCRIPTION_LENGTH)
    attributes: WebsiteAttributes = Field(default_factory=WebsiteAttributes)


class WebsiteContentEditIn(Schema):
    prompt: str = Field(..., min_length=1, max_length=MAX_PROMPT_LENGTH, examples=["Make the header dark blue"])


class WebsiteContentOut(Schema):
    """A version of a website's page, without the HTML."""

    id: UUID
    website_id: UUID
    is_active: bool
    # `<content id>.<base domain>`, serves this version whether it is active or not
    managed_domain: str
    source_id: UUID | None
    prompt: str
    description: str
    attributes: dict[str, Any]
    model: str
    created_at: datetime
    updated_at: datetime
