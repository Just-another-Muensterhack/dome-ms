from datetime import datetime
from typing import Annotated, Any
from uuid import UUID

from ninja import Field, Schema
from pydantic import StringConstraints

from website.service import (
    MAX_ATTRIBUTE_LENGTH,
    MAX_DESCRIPTION_LENGTH,
    MAX_NAME_LENGTH,
    MAX_PROMPT_LENGTH,
    MAX_SECTIONS,
    MAX_UPLOAD_FILES,
)

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


ContentName = Annotated[str, StringConstraints(max_length=MAX_NAME_LENGTH)]


class WebsiteContentIn(Schema):
    website_id: UUID
    # without a name the version is called `Version <n>`
    name: ContentName | None = Field(None, examples=["Summer menu"])
    description: str = Field(..., min_length=1, max_length=MAX_DESCRIPTION_LENGTH)
    attributes: WebsiteAttributes = Field(default_factory=WebsiteAttributes)


class WebsiteContentEditIn(Schema):
    prompt: str = Field(..., min_length=1, max_length=MAX_PROMPT_LENGTH, examples=["Make the header dark blue"])
    # without a name the version is called `Version <n>`
    name: ContentName | None = Field(None, examples=["Dark header"])


class WebsiteContentUploadIn(Schema):
    """The form fields of an upload, sent as `multipart/form-data` with the files."""

    website_id: UUID
    # without a name the version is called `Version <n>`
    name: ContentName | None = Field(None, examples=["Summer menu"])
    # the relative path of each file in the order of `files`, e.g. `css/style.css`, the file names without it; the
    # file name of an upload loses its directories, so the paths are sent separately
    paths: list[str] = Field(default_factory=list, max_length=MAX_UPLOAD_FILES, examples=[["index.html", "css/a.css"]])


class WebsiteContentUpdate(Schema):
    name: ContentName = Field(..., min_length=1, examples=["Summer menu"])


class WebsiteContentOut(Schema):
    """A version of a website's page, without the HTML."""

    id: UUID
    website_id: UUID
    # `generated` or `uploaded`, only generated versions can be edited
    kind: str
    name: str
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
