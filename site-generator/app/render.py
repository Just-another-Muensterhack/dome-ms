"""Macht aus Modellausgabe und Fragebogen fertige HTML-Dateien.

Vorlage-Modus: Jinja mit Autoescape, das Modell liefert nur Text.
HTML-Modus: Das Modell liefert Markup, das mit nh3 auf eine Positivliste reduziert wird. Die
ausgelieferte Seite hat zusätzlich eine CSP ohne Scripts (siehe main.py), doppelt hält besser.
"""

import re
from datetime import date
from pathlib import Path

import nh3
from jinja2 import Environment, FileSystemLoader, select_autoescape
from markupsafe import Markup, escape

from app.design import KATEGORIE_LABEL, kapitel, palette, typenschild, zeilen, zeitplan
from app.images import monogramm_svg
from app.schemas import HtmlSite, SiteContent, SiteRequest

_env = Environment(
    loader=FileSystemLoader(Path(__file__).parent / "templates"),
    autoescape=select_autoescape(["html", "j2"]),
    trim_blocks=True,
    lstrip_blocks=True,
)

_ERLAUBTE_TAGS = {
    "header",
    "footer",
    "main",
    "section",
    "article",
    "aside",
    "nav",
    "div",
    "span",
    "h1",
    "h2",
    "h3",
    "h4",
    "p",
    "br",
    "hr",
    "strong",
    "em",
    "b",
    "i",
    "small",
    "blockquote",
    "ul",
    "ol",
    "li",
    "dl",
    "dt",
    "dd",
    "a",
    "figure",
    "figcaption",
    "table",
    "thead",
    "tbody",
    "tr",
    "th",
    "td",
    "address",
    "details",
    "summary",
}
_ERLAUBTE_ATTRIBUTE = {"*": {"class", "id", "aria-label", "role"}, "a": {"href", "title"}}


# --- Farben ---------------------------------------------------------------------------------


def _rgb(hex_farbe: str) -> tuple[float, float, float]:
    h = hex_farbe.lstrip("#")
    return tuple(int(h[i : i + 2], 16) / 255 for i in (0, 2, 4))  # type: ignore[return-value]


def _luminanz(hex_farbe: str) -> float:
    def kanal(c: float) -> float:
        return c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4

    r, g, b = (kanal(c) for c in _rgb(hex_farbe))
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def _kontrast(a: str, b: str) -> float:
    la, lb = sorted((_luminanz(a), _luminanz(b)), reverse=True)
    return (la + 0.05) / (lb + 0.05)


def _abdunkeln(hex_farbe: str, faktor: float) -> str:
    return "#" + "".join(f"{round(c * 255 * (1 - faktor)):02x}" for c in _rgb(hex_farbe))


def _mischen_mit_weiss(hex_farbe: str, anteil: float) -> str:
    return "#" + "".join(f"{round((c + (1 - c) * anteil) * 255):02x}" for c in _rgb(hex_farbe))


def farbschema(akzent: str) -> dict[str, str]:
    """Hellt oder dunkelt die Kundenfarbe so ab, dass Text darauf und daneben lesbar bleibt."""
    akzent_text = akzent
    schritt = 0.0
    while _kontrast(akzent_text, "#ffffff") < 4.5 and schritt < 0.9:
        schritt += 0.1
        akzent_text = _abdunkeln(akzent, schritt)
    auf_akzent = (
        "#ffffff" if _kontrast(akzent, "#ffffff") >= _kontrast(akzent, "#111111") else "#111111"
    )
    return {
        "akzent": akzent,
        "akzent_text": akzent_text,
        "auf_akzent": auf_akzent,
        "akzent_hell": _mischen_mit_weiss(akzent, 0.9),
    }


# --- Gemeinsame Bausteine -------------------------------------------------------------------


def _kontakt_html(req: SiteRequest) -> Markup:
    k = req.kontakt
    zeilen = []
    if k.adresse:
        zeilen.append(f"<p>{escape(k.adresse)}</p>")
    if k.telefon:
        tel = re.sub(r"[^0-9+]", "", k.telefon)
        zeilen.append(f'<p><a href="tel:{tel}">{escape(k.telefon)}</a></p>')
    if k.email:
        zeilen.append(f'<p><a href="mailto:{escape(k.email)}">{escape(k.email)}</a></p>')
    if not zeilen:
        zeilen.append("<p>Kontaktdaten folgen.</p>")
    return Markup('<address class="kontakt-daten">' + "".join(zeilen) + "</address>")


def _zeiten_html(req: SiteRequest) -> Markup:
    if not req.zeiten.strip():
        return Markup("")
    zeilen = "".join(f"<li>{escape(z.strip())}</li>" for z in req.zeiten.splitlines() if z.strip())
    return Markup(f'<ul class="zeiten">{zeilen}</ul>')


def _marke(req: SiteRequest, farben: dict, assets: dict) -> dict:
    """Logo, falls hochgeladen, sonst ein Standard-Zeichen aus den Initialen. Dazu das Favicon."""
    if assets.get("logo"):
        return {
            "marke": Markup(
                f'<img class="logo" src="{assets["logo"]}" alt="Logo {escape(req.name)}">'
            ),
            "favicon": ("favicon.png", "image/png"),
            "extra": {},
        }
    svg = monogramm_svg(req.name, farben["akzent"], farben["auf_akzent"])
    return {
        "marke": Markup(f'<span class="logo monogramm" aria-hidden="true">{svg}</span>'),
        "favicon": ("favicon.svg", "image/svg+xml"),
        "extra": {"favicon.svg": svg},
    }


def _basis(req: SiteRequest, seitentitel: str, farben: dict, stil: str, assets: dict) -> dict:
    m = _marke(req, farben, assets)
    return {
        "req": req,
        "seitentitel": seitentitel,
        "farben": farben,
        "p": palette(farben["akzent"]),
        "stil": stil,
        "marke": m["marke"],
        "favicon": m["favicon"],
        "bilder": assets.get("bilder", []),
        "jahr": date.today().year,
    }, m["extra"]


def _rechtliches(basis: dict) -> dict[str, str]:
    return {
        "impressum.html": _env.get_template("impressum.html.j2").render(**basis),
        "datenschutz.html": _env.get_template("datenschutz.html.j2").render(**basis),
    }


# --- Modus "vorlage" ------------------------------------------------------------------------


def render_vorlage(req: SiteRequest, content: SiteContent, assets: dict) -> dict[str, str]:
    farben = farbschema(content.design.farbe)
    stil = content.design.stil
    basis, extra = _basis(req, content.seitentitel, farben, stil, assets)
    kap = kapitel(req, content)
    bilder = basis["bilder"]
    # Hat die Seite einen "Über uns"-Abschnitt, bekommt er das zweite Bild, die Galerie den Rest.
    ab = 2 if any(k["art"] == "these" for k in kap) and len(bilder) > 1 else 1
    index = _env.get_template("index.html.j2").render(
        **basis,
        c=content,
        kapitel=kap,
        hero_zeilen=zeilen(content.hero.ueberschrift, {"klar": 17, "warm": 20, "modern": 12}[stil]),
        schild=typenschild(req),
        plan=zeitplan(req.zeiten),
        galerie=bilder[ab:],
        kategorie_label=KATEGORIE_LABEL[req.kategorie],
        tel=re.sub(r"[^0-9+]", "", req.kontakt.telefon),
    )
    return {"index.html": index, **_rechtliches(basis), **extra}


# --- Modus "html" ---------------------------------------------------------------------------


def _css_bereinigen(css: str) -> str:
    css = re.sub(r"@import[^;]*;?", "", css, flags=re.IGNORECASE)
    css = re.sub(r"url\s*\([^)]*\)", "none", css, flags=re.IGNORECASE)
    css = re.sub(r"expression\s*\(", "(", css, flags=re.IGNORECASE)
    # Verhindert, dass ein "</style>" im CSS aus dem Style-Block ausbricht.
    return css.replace("<", "\\3c ")


def html_bereinigen(body_html: str) -> str:
    return nh3.clean(
        body_html,
        tags=_ERLAUBTE_TAGS,
        attributes=_ERLAUBTE_ATTRIBUTE,
        url_schemes={"mailto", "tel"},
        link_rel="noopener noreferrer",
        strip_comments=True,
    )


def _platzhalter_ersetzen(body: str, ersetzungen: dict[str, str]) -> str:
    for marke, html in ersetzungen.items():
        body = body.replace(marke, html, 1).replace(marke, "")
    # Übrig gebliebene Platzhalter (etwa {{BILD_5}} ohne fünftes Bild) verschwinden.
    return re.sub(r"\{\{[A-Z_0-9]+\}\}", "", body)


def render_html(req: SiteRequest, site: HtmlSite, assets: dict) -> dict[str, str]:
    farben = farbschema(req.farbe)
    basis, extra = _basis(req, site.seitentitel, farben, req.stil, assets)
    # Bilder und Logo setzt das System erst nach dem Bereinigen ein, das Modell sieht nur Platzhalter.
    ersetzungen = {
        "{{KONTAKT}}": _kontakt_html(req),
        "{{ZEITEN}}": _zeiten_html(req),
        "{{LOGO}}": basis["marke"],
    }
    for i, b in enumerate(basis["bilder"], start=1):
        ersetzungen[f"{{{{BILD_{i}}}}}"] = Markup(
            f'<img src="{b["src"]}" alt="{escape(b["alt"])}" loading="lazy">'
        )
    body = _platzhalter_ersetzen(html_bereinigen(site.body_html), ersetzungen)
    index = _env.get_template("html_shell.html.j2").render(
        seitentitel=site.seitentitel,
        meta_beschreibung=site.meta_beschreibung,
        favicon=basis["favicon"],
        css=Markup(_css_bereinigen(site.css)),
        body=Markup(body),
    )
    return {"index.html": index, **_rechtliches(basis), **extra}
