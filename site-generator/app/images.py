"""Bilder annehmen, entschärfen, verkleinern. Standard-Zeichen und Favicon erzeugen.

Jedes Upload wird mit Pillow neu kodiert. Das entfernt EXIF-Daten (GPS, Kameradaten) und macht
Polyglot-Dateien unschädlich, weil nur die Pixel übernommen werden. SVG wird nicht angenommen,
weil SVG Scripts enthalten kann.
"""

import io
import re
import warnings

from markupsafe import escape
from PIL import Image, ImageOps, UnidentifiedImageError

MAX_BYTES = 8 * 1024 * 1024
Image.MAX_IMAGE_PIXELS = 40_000_000  # Schutz vor Dekompressionsbomben
_FORMATE = {"PNG", "JPEG", "WEBP"}
_FUELLWOERTER = {
    "e",
    "v",
    "ev",
    "gmbh",
    "ug",
    "kg",
    "ag",
    "gbr",
    "mbh",
    "und",
    "der",
    "die",
    "das",
    "the",
}


class BildFehler(Exception):
    """Text geht so an den Kunden."""


def _oeffnen(daten: bytes) -> Image.Image:
    if len(daten) > MAX_BYTES:
        raise BildFehler("Das Bild ist größer als 8 MB.")
    try:
        with warnings.catch_warnings():
            warnings.simplefilter("error", Image.DecompressionBombWarning)
            bild = Image.open(io.BytesIO(daten))
            if bild.format not in _FORMATE:
                raise BildFehler("Bitte PNG, JPG oder WebP hochladen.")
            bild.load()
    except (
        UnidentifiedImageError,
        Image.DecompressionBombError,
        Image.DecompressionBombWarning,
        OSError,
    ):
        raise BildFehler("Die Datei ist kein gültiges Bild.")
    return ImageOps.exif_transpose(bild)


def logo_verarbeiten(daten: bytes) -> tuple[bytes, str]:
    """Liefert PNG mit Transparenz (max. 512 px) und einen Farbvorschlag."""
    bild = _oeffnen(daten).convert("RGBA")
    bild.thumbnail((512, 512))
    puffer = io.BytesIO()
    bild.save(puffer, "PNG", optimize=True)
    return puffer.getvalue(), hauptfarbe(bild)


def bild_verarbeiten(daten: bytes) -> bytes:
    """Liefert WebP (max. 1600 px), ohne Metadaten."""
    bild = _oeffnen(daten).convert("RGB")
    bild.thumbnail((1600, 1600))
    puffer = io.BytesIO()
    bild.save(puffer, "WEBP", quality=80, method=4)
    return puffer.getvalue()


def favicon_aus_logo(logo_png: bytes) -> bytes:
    logo = Image.open(io.BytesIO(logo_png)).convert("RGBA")
    seite = max(logo.size)
    quadrat = Image.new("RGBA", (seite, seite), (0, 0, 0, 0))
    quadrat.paste(logo, ((seite - logo.width) // 2, (seite - logo.height) // 2))
    puffer = io.BytesIO()
    quadrat.resize((64, 64), Image.LANCZOS).save(puffer, "PNG")
    return puffer.getvalue()


def hauptfarbe(bild: Image.Image) -> str:
    """Häufigste kräftige Farbe. Weiß, Schwarz, Grau und Transparenz zählen nicht."""
    klein = bild.convert("RGBA")
    klein.thumbnail((96, 96))
    kandidaten: dict[tuple[int, int, int], int] = {}
    for r, g, b, a in klein.get_flattened_data():
        if a < 128:
            continue
        hoch, tief = max(r, g, b), min(r, g, b)
        if hoch - tief < 40 or hoch < 50 or tief > 225:
            continue
        schluessel = (r // 24 * 24, g // 24 * 24, b // 24 * 24)
        kandidaten[schluessel] = kandidaten.get(schluessel, 0) + 1
    if not kandidaten:
        return "#374151"
    r, g, b = max(kandidaten, key=kandidaten.get)
    return f"#{min(r + 12, 255):02x}{min(g + 12, 255):02x}{min(b + 12, 255):02x}"


# --- Standard-Zeichen ohne Logo -------------------------------------------------------------


def initialen(name: str) -> str:
    woerter = [
        w
        for w in re.findall(r"[A-Za-zÄÖÜäöüß]+", name)
        if w.lower().strip(".") not in _FUELLWOERTER
    ]
    if not woerter:
        return (re.sub(r"\W", "", name)[:1] or "W").upper()
    if len(woerter) == 1:
        return woerter[0][:2].capitalize()
    return (woerter[0][0] + woerter[1][0]).upper()


def monogramm_svg(name: str, akzent: str, auf_akzent: str) -> str:
    kuerzel = escape(initialen(name))
    groesse = 30 if len(kuerzel) > 1 else 36
    return (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img" '
        f'aria-label="{escape(name)}"><circle cx="32" cy="32" r="32" fill="{akzent}"/>'
        f'<text x="32" y="33" text-anchor="middle" dominant-baseline="central" '
        f'font-family="system-ui,-apple-system,Segoe UI,sans-serif" font-weight="700" '
        f'font-size="{groesse}" fill="{auf_akzent}">{kuerzel}</text></svg>'
    )
