"""Gestaltung: Palette aus der Markenfarbe und die Aufbereitung der Inhalte für die Templates.

Alle Neutraltöne werden zur Farbton-Achse der Markenfarbe getönt (OKLCH). So wirkt jede Seite
aus einem Guss, egal welche Farbe der Kunde wählt.
"""

import math
import re

from app.schemas import Abschnitt, SiteContent, SiteRequest

KATEGORIE_LABEL = {
    "verein": "Verein",
    "unternehmen": "Unternehmen",
    "praxis": "Praxis",
    "gastronomie": "Gastronomie",
    "handwerk": "Handwerk",
    "sonstiges": "",
}


# --- Farbe ----------------------------------------------------------------------------------


def hex_zu_oklch(hex_farbe: str) -> tuple[float, float, float]:
    h = hex_farbe.lstrip("#")
    r, g, b = (int(h[i : i + 2], 16) / 255 for i in (0, 2, 4))

    def lin(c: float) -> float:
        return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4

    r, g, b = lin(r), lin(g), lin(b)
    l_ = (0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b) ** (1 / 3)
    m_ = (0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b) ** (1 / 3)
    s_ = (0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b) ** (1 / 3)
    L = 0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_
    a = 1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_
    bb = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_
    return L, math.hypot(a, bb), math.degrees(math.atan2(bb, a)) % 360


def _ok(l: float, c: float, h: float) -> str:
    return f"oklch({l:.3f} {c:.3f} {h:.1f})"


def palette(akzent: str) -> dict[str, str]:
    L, C, H = hex_zu_oklch(akzent)
    # Graue Markenfarben bekommen fast neutrale Töne, bunte eine spürbare Tönung.
    nc = 0.006 if C < 0.03 else min(C * 0.2, 0.028)
    return {
        "marke": akzent,
        # dunkle Zone
        "d_papier": _ok(0.195, nc, H),
        "d_papier2": _ok(0.245, nc * 1.1, H),
        "d_tinte": _ok(0.945, nc * 0.45, H),
        "d_tinte_leise": _ok(0.775, nc * 0.8, H),
        "d_linie": _ok(0.335, nc, H),
        "d_akzent": _ok(max(L, 0.74), min(C, 0.16), H),
        # helle Zone
        "h_papier": _ok(0.962, nc * 0.45, H),
        "h_papier2": _ok(0.925, nc * 0.7, H),
        "h_tinte": _ok(0.235, nc, H),
        "h_tinte_leise": _ok(0.445, nc * 0.9, H),
        "h_linie": _ok(0.86, nc * 0.8, H),
        "h_akzent": _ok(min(L, 0.52), min(max(C, 0.02), 0.17), H),
        # für "warm": festes Creme. Farbtöne zu mischen ergäbe bei Blau ein grünliches Papier.
        "w_papier": _ok(0.955, 0.02, 82),
        "w_papier2": _ok(0.92, 0.028, 80),
        "w_marke_hell": _ok(0.9, min(C * 0.45, 0.07), H),
    }


# --- Inhalte --------------------------------------------------------------------------------


def zeilen(text: str, ziel: int) -> list[str]:
    """Bricht eine Überschrift in ausgewogene Zeilen, damit sie wie gesetzt wirkt."""
    woerter = text.split()
    if len(text) <= ziel or len(woerter) < 3:
        return [text]
    anzahl = max(2, round(len(text) / ziel))
    soll = len(text) / anzahl
    ergebnis, aktuell = [], ""
    for w in woerter:
        kandidat = f"{aktuell} {w}".strip()
        if aktuell and len(kandidat) > soll * 1.15 and len(ergebnis) < anzahl - 1:
            ergebnis.append(aktuell)
            aktuell = w
        else:
            aktuell = kandidat
    ergebnis.append(aktuell)
    return ergebnis


def _erster_satz(text: str) -> tuple[str, str]:
    text = text.strip()
    m = re.match(r"(.+?[.!?])(\s+|$)(.*)", text, re.S)
    if not m or len(m.group(1)) > 200:
        return "", text
    return m.group(1), m.group(3).strip()


def zeitplan(zeiten: str) -> list[tuple[str, str]]:
    zeilen_ = []
    for z in zeiten.splitlines():
        z = z.strip()
        if not z:
            continue
        # "Mo 17:00 Uhr: Jugend" soll links die Zeit und rechts das Angebot zeigen. Der
        # Doppelpunkt in "17:00" darf dabei nicht trennen, deshalb nur ": " mit Leerzeichen.
        wann, _, was = z.partition(": ")
        zeilen_.append((wann, was))
    return zeilen_


def _art(a: Abschnitt) -> str:
    if a.id == "zeiten":
        return "zeiten"
    if a.id == "angebote":
        return "liste"
    if a.id == "ueber-uns":
        return "these"
    return "schritte" if a.punkte else "text"


def kapitel(req: SiteRequest, content: SiteContent) -> list[dict]:
    ergebnis = []
    for nr, a in enumerate(content.abschnitte, start=1):
        absaetze = [p.strip() for p in a.text.split("\n") if p.strip()]
        lead, rest = _erster_satz(absaetze[0]) if absaetze else ("", "")
        rest_absaetze = ([rest] if rest else []) + absaetze[1:]
        ergebnis.append(
            {
                "nr": f"{nr:02d}",
                "id": a.id,
                "titel": a.titel,
                "lead": lead,
                "absaetze": rest_absaetze if lead else absaetze,
                "punkte": a.punkte,
                "art": _art(a),
            }
        )
    return ergebnis


def typenschild(req: SiteRequest) -> list[tuple[str, str]]:
    zeilen_ = []
    if req.ort:
        zeilen_.append(("Wo", req.ort))
    if req.angebote:
        rest = len(req.angebote) - 3
        zeilen_.append(
            ("Was", ", ".join(req.angebote[:3]) + (f" und {rest} mehr" if rest > 0 else ""))
        )
    plan = zeitplan(req.zeiten)
    if plan:
        zeilen_.append(("Wann", plan[0][0] + (f" · {plan[0][1]}" if plan[0][1] else "")))
    elif req.kontakt.email:
        zeilen_.append(("Kontakt", req.kontakt.email))
    return zeilen_[:3]
