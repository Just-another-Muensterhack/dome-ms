"""Eingaben vom Kunden und Ausgaben des Modells.

Kontaktdaten und Zeiten laufen nie durch das Modell: Sie kommen direkt aus dem Fragebogen ins
Template, damit die KI keine Telefonnummer, Adresse oder Öffnungszeit erfinden kann.
"""

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

Kategorie = Literal["verein", "unternehmen", "praxis", "gastronomie", "handwerk", "sonstiges"]
Stil = Literal["klar", "warm", "modern"]
Modus = Literal["vorlage", "html"]
HEX_FARBE = r"^#[0-9a-fA-F]{6}$"
UPLOAD_ID = r"^[0-9a-f]{32}$"


class Strict(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)


class Kontakt(Strict):
    email: str = Field("", max_length=120, pattern=r"^$|^[^@\s<>\"']+@[^@\s<>\"']+\.[a-zA-Z]{2,}$")
    telefon: str = Field("", max_length=40, pattern=r"^[0-9 +()/\-]*$")
    adresse: str = Field("", max_length=200)


class BildRef(Strict):
    id: str = Field(pattern=UPLOAD_ID)
    beschreibung: str = Field("", max_length=150, description="Wird zum Alt-Text")


class SiteRequest(Strict):
    # Schritt 1: Wer seid ihr (Pflicht bis auf den Ort)
    name: str = Field(min_length=2, max_length=80)
    kategorie: Kategorie
    beschreibung: str = Field(min_length=10, max_length=1500)
    ort: str = Field("", max_length=80)
    # Schritt 2: Was bietet ihr
    angebote: list[str] = Field(default_factory=list, max_length=8)
    zeiten: str = Field("", max_length=400, description="Öffnungs-, Sprech- oder Trainingszeiten")
    # Schritt 3: Logo und Bilder (IDs aus POST /api/uploads)
    logo_id: str | None = Field(None, pattern=UPLOAD_ID)
    bilder: list[BildRef] = Field(default_factory=list, max_length=6)
    bildrechte_bestaetigt: bool = False
    # Schritt 4: Aussehen
    farbe: str = Field("#2f6f4f", pattern=HEX_FARBE)
    stil: Stil = "klar"
    anrede: Literal["sie", "du"] = "sie"
    # Schritt 5: Kontakt und Wünsche
    kontakt: Kontakt = Field(default_factory=Kontakt)
    wuensche: str = Field("", max_length=1000)
    modus: Modus = "vorlage"

    @field_validator("angebote")
    @classmethod
    def angebote_bereinigen(cls, v: list[str]) -> list[str]:
        return [a.strip()[:120] for a in v if a.strip()]

    @model_validator(mode="after")
    def rechte_pruefen(self) -> "SiteRequest":
        if (self.bilder or self.logo_id) and not self.bildrechte_bestaetigt:
            raise ValueError("Bitte bestätigen, dass ihr die Rechte an Logo und Bildern habt.")
        return self


class ReviseRequest(Strict):
    anweisung: str = Field(min_length=3, max_length=500)


# --- Modellausgabe, Modus "vorlage" ---------------------------------------------------------


class Hero(Strict):
    ueberschrift: str = Field(max_length=90)
    unterzeile: str = Field(max_length=240)
    cta_text: str = Field(max_length=30)


class Punkt(Strict):
    titel: str = Field(max_length=80)
    text: str = Field(max_length=400)


class Abschnitt(Strict):
    id: str = Field(max_length=30)
    titel: str = Field(max_length=80)
    text: str = Field(max_length=900)
    punkte: list[Punkt] = Field(default_factory=list, max_length=8)


class Faq(Strict):
    frage: str = Field(max_length=160)
    antwort: str = Field(max_length=500)


class Design(Strict):
    farbe: str = Field(pattern=HEX_FARBE)
    stil: Stil


class SiteContent(Strict):
    seitentitel: str = Field(max_length=70)
    meta_beschreibung: str = Field(max_length=170)
    hero: Hero
    abschnitte: list[Abschnitt] = Field(min_length=1, max_length=6)
    faq: list[Faq] = Field(default_factory=list, max_length=5)
    kontakt_text: str = Field(max_length=300)
    design: Design


# --- Modellausgabe, Modus "html" ------------------------------------------------------------


class HtmlSite(Strict):
    seitentitel: str = Field(max_length=70)
    meta_beschreibung: str = Field(max_length=170)
    body_html: str = Field(max_length=60_000, description="Nur der Inhalt von <body>, ohne Scripts")
    css: str = Field(max_length=30_000)


# --- API-Antworten --------------------------------------------------------------------------


class UploadResponse(BaseModel):
    upload_id: str
    url: str
    farbvorschlag: str | None = None


class SiteResponse(BaseModel):
    site_id: str
    modus: Modus
    preview_url: str
    download_url: str
    seitentitel: str
