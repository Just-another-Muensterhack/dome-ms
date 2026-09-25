"""Seitenstruktur je Art. Die Gliederung legt der Code fest, die KI füllt nur die Texte.

Der Abschnitt "zeiten" wird nur geplant, wenn der Kunde Zeiten angegeben hat, sonst würde die
KI welche erfinden.
"""

from app.schemas import Kategorie, SiteRequest

# (id, Titelvorschlag, worum es im Abschnitt geht)
Plan = list[tuple[str, str, str]]

_STRUKTUR: dict[Kategorie, Plan] = {
    "verein": [
        ("ueber-uns", "Über uns", "Wer der Verein ist, wofür er steht, was ihn ausmacht"),
        ("angebote", "Abteilungen und Angebote", "Je Angebot ein Punkt mit kurzer Beschreibung"),
        (
            "zeiten",
            "Training und Termine",
            "Kurze Einleitung zu den Zeiten, die Zeiten selbst setzt das System",
        ),
        ("mitmachen", "Mitmachen", "Wie man Mitglied wird oder zum Probetraining kommt"),
    ],
    "unternehmen": [
        ("ueber-uns", "Über uns", "Wer das Unternehmen ist und für wen es arbeitet"),
        ("angebote", "Leistungen", "Je Leistung ein Punkt mit Nutzen für den Kunden"),
        ("vorteile", "Warum wir", "Drei konkrete Gründe aus der Beschreibung, nichts erfinden"),
        (
            "ablauf",
            "So läuft die Zusammenarbeit",
            "Drei bis vier Schritte vom Erstkontakt bis zum Ergebnis",
        ),
    ],
    "praxis": [
        ("ueber-uns", "Über die Praxis", "Wer hier arbeitet und wie die Praxis arbeitet"),
        ("angebote", "Leistungen", "Je Leistung ein Punkt, sachlich, ohne Heilversprechen"),
        ("zeiten", "Sprechzeiten", "Kurze Einleitung, die Zeiten selbst setzt das System"),
        ("ablauf", "Ihr erster Termin", "Wie man einen Termin bekommt und was man mitbringt"),
    ],
    "gastronomie": [
        ("ueber-uns", "Über uns", "Atmosphäre, Küche, was das Lokal besonders macht"),
        ("angebote", "Speisen und Angebote", "Je Angebot ein Punkt, keine Preise erfinden"),
        ("zeiten", "Öffnungszeiten", "Kurze Einleitung, die Zeiten selbst setzt das System"),
        ("anlass", "Feiern und Reservieren", "Wie man reserviert oder eine Feier anfragt"),
    ],
    "handwerk": [
        ("ueber-uns", "Über uns", "Wer der Betrieb ist und in welcher Region er arbeitet"),
        ("angebote", "Leistungen", "Je Leistung ein Punkt"),
        ("vorteile", "Darum wir", "Drei konkrete Gründe aus der Beschreibung, nichts erfinden"),
        ("ablauf", "So arbeiten wir", "Drei bis vier Schritte von der Anfrage bis zur Abnahme"),
    ],
    "sonstiges": [
        ("ueber-uns", "Über uns", "Wer dahinter steht und worum es geht"),
        ("angebote", "Angebot", "Je Angebot ein Punkt"),
        ("vorteile", "Was uns ausmacht", "Drei konkrete Punkte aus der Beschreibung"),
    ],
}


def plan_fuer(req: SiteRequest) -> Plan:
    return [s for s in _STRUKTUR[req.kategorie] if s[0] != "zeiten" or req.zeiten.strip()]
