"""Beispielinhalte ohne Modell, damit Frontend, Tests und Demo ohne API-Key laufen.

Die Texte bauen nur auf den Angaben des Kunden auf und erfinden keine Fakten. Sie sind bewusst
allgemein, zeigen aber, wie die Templates mit echten Texten wirken.
"""

import json
import re
from typing import TypeVar

from pydantic import BaseModel

from app.schemas import HtmlSite, SiteContent

T = TypeVar("T", bound=BaseModel)
_BLOCK = re.compile(r"<kundendaten>\n(.*)\n</kundendaten>", re.S)

# Pro Art: Hero-Aussage, erster Satz "Über uns", Schritte für den dritten Abschnitt, FAQ.
# Jeder Text in Du und Sie, weil die Anrede im Fragebogen gewählt wird.
_TEXTE = {
    "verein": {
        "hero": ("Mitmachen ist hier ganz einfach.", "Mitmachen ist hier ganz einfach."),
        "these": ("Bei uns zählt, dass du kommst.", "Bei uns zählt, dass Sie kommen."),
        "schritte": [
            ("Vorbeikommen", "Such dir einen Termin aus und komm einfach vorbei.", "Suchen Sie sich einen Termin aus und kommen Sie einfach vorbei."),
            ("Ausprobieren", "Trainiere ein paar Mal mit und schau, ob es passt.", "Trainieren Sie ein paar Mal mit und schauen Sie, ob es passt."),
            ("Mitglied werden", "Den Antrag bekommst du beim Training oder per E-Mail.", "Den Antrag bekommen Sie beim Training oder per E-Mail."),
        ],
        "faq": [
            ("Brauche ich Vorkenntnisse?", "Nein. Frag uns einfach, welche Gruppe zu dir passt.", "Nein. Fragen Sie uns einfach, welche Gruppe zu Ihnen passt."),
            ("Kann ich erst mal zuschauen?", "Klar. Komm zu einem Termin und schau dir alles in Ruhe an.", "Gern. Kommen Sie zu einem Termin und schauen Sie sich alles in Ruhe an."),
        ],
    },
    "unternehmen": {
        "hero": ("Gute Arbeit, klar erklärt.", "Gute Arbeit, klar erklärt."),
        "these": ("Wir arbeiten so, dass du es verstehst.", "Wir arbeiten so, dass Sie es verstehen."),
        "schritte": [
            ("Anfrage", "Du schreibst uns kurz, worum es geht.", "Sie schreiben uns kurz, worum es geht."),
            ("Gespräch", "Wir klären gemeinsam, was du brauchst.", "Wir klären gemeinsam, was Sie brauchen."),
            ("Umsetzung", "Wir legen los und halten dich auf dem Laufenden.", "Wir legen los und halten Sie auf dem Laufenden."),
        ],
        "faq": [
            ("Wie schnell meldet ihr euch?", "Wir antworten auf jede Anfrage so schnell wie möglich.", "Wir antworten auf jede Anfrage so schnell wie möglich."),
            ("Was kostet ein Erstgespräch?", "Frag uns einfach, wir sagen dir vorher, was auf dich zukommt.", "Fragen Sie uns einfach, wir sagen Ihnen vorher, was auf Sie zukommt."),
        ],
    },
    "praxis": {
        "hero": ("Zeit für deine Gesundheit.", "Zeit für Ihre Gesundheit."),
        "these": ("Wir nehmen uns Zeit für dich.", "Wir nehmen uns Zeit für Sie."),
        "schritte": [
            ("Termin anfragen", "Ruf an oder schreib uns eine E-Mail.", "Rufen Sie an oder schreiben Sie uns eine E-Mail."),
            ("Unterlagen mitbringen", "Bring Versichertenkarte und vorhandene Befunde mit.", "Bringen Sie Versichertenkarte und vorhandene Befunde mit."),
            ("Erstes Gespräch", "Wir besprechen in Ruhe, was dir hilft.", "Wir besprechen in Ruhe, was Ihnen hilft."),
        ],
        "faq": [
            ("Brauche ich eine Überweisung?", "Das hängt von der Behandlung ab. Frag uns einfach vorher.", "Das hängt von der Behandlung ab. Fragen Sie uns einfach vorher."),
        ],
    },
    "gastronomie": {
        "hero": ("Schön, dass du vorbeischaust.", "Schön, dass Sie vorbeischauen."),
        "these": ("Hier darfst du einfach ankommen.", "Hier dürfen Sie einfach ankommen."),
        "schritte": [
            ("Anfragen", "Schreib uns, wann und mit wie vielen Leuten du kommst.", "Schreiben Sie uns, wann und mit wie vielen Personen Sie kommen."),
            ("Absprechen", "Wir klären Wünsche und Details.", "Wir klären Wünsche und Details."),
            ("Genießen", "Du kommst, wir kümmern uns um den Rest.", "Sie kommen, wir kümmern uns um den Rest."),
        ],
        "faq": [
            ("Kann ich reservieren?", "Ja, am einfachsten per Telefon oder E-Mail.", "Ja, am einfachsten per Telefon oder E-Mail."),
        ],
    },
    "handwerk": {
        "hero": ("Handwerk, auf das man baut.", "Handwerk, auf das man baut."),
        "these": ("Wir machen es ordentlich, von Anfang an.", "Wir machen es ordentlich, von Anfang an."),
        "schritte": [
            ("Anfrage", "Du beschreibst kurz, was ansteht.", "Sie beschreiben kurz, was ansteht."),
            ("Besichtigung", "Wir schauen uns alles vor Ort an.", "Wir schauen uns alles vor Ort an."),
            ("Angebot", "Du bekommst ein klares Angebot ohne Überraschungen.", "Sie bekommen ein klares Angebot ohne Überraschungen."),
            ("Umsetzung", "Wir arbeiten sauber und räumen hinterher auf.", "Wir arbeiten sauber und räumen hinterher auf."),
        ],
        "faq": [
            ("In welcher Gegend seid ihr unterwegs?", "Frag uns einfach, wir sagen dir, ob wir zu dir kommen.", "Fragen Sie uns einfach, wir sagen Ihnen, ob wir zu Ihnen kommen."),
        ],
    },
    "sonstiges": {
        "hero": ("Schön, dass du hier bist.", "Schön, dass Sie hier sind."),
        "these": ("Worum es uns geht, in wenigen Worten.", "Worum es uns geht, in wenigen Worten."),
        "schritte": [],
        "faq": [],
    },
}


class FakeClient:
    def generate(self, system: str, user: str, schema: type[T]) -> T:
        payload = json.loads(_BLOCK.search(user).group(1))
        kunde = payload["kunde"]
        name = kunde["name"]
        wunsch = payload.get("aenderungswunsch", "")
        du = kunde.get("anrede") == "du"

        if schema is HtmlSite:
            return schema.model_validate(
                {
                    "seitentitel": name,
                    "meta_beschreibung": f"{name}: {kunde['beschreibung'][:120]}",
                    "body_html": (
                        f"<header>{{{{LOGO}}}}<h1>{name}</h1><p>{kunde['beschreibung']}</p></header>"
                        "<main><figure>{{BILD_1}}</figure>"
                        "<section id='kontakt'><h2>Kontakt</h2>{{KONTAKT}}</section>"
                        "<section id='zeiten'>{{ZEITEN}}</section></main>"
                        "<footer><a href='impressum.html'>Impressum</a> "
                        "<a href='datenschutz.html'>Datenschutz</a></footer>"
                    ),
                    "css": "body{font-family:system-ui;margin:0 auto;max-width:60rem;padding:1rem}",
                }
            )

        assert schema is SiteContent
        t = _TEXTE[kunde["kategorie"]]
        waehle = 0 if du else 1
        ort = f" in {kunde['ort']}" if kunde["ort"] else ""
        beschreibung = kunde["beschreibung"].strip()

        abschnitte = []
        for teil in payload["gliederung"]:
            sid = teil["id"]
            text, punkte = "", []
            if sid == "ueber-uns":
                text = f"{t['these'][waehle]} {beschreibung}"
            elif sid == "angebote":
                text = "Das bieten wir an." if kunde["angebote"] else beschreibung
                mehr = "Frag uns gern, was dazugehört." if du else "Fragen Sie uns gern, was dazugehört."
                punkte = [{"titel": a, "text": mehr} for a in kunde["angebote"]]
            elif sid == "zeiten":
                text = "Alle Zeiten auf einen Blick."
            elif t["schritte"]:
                text = "So einfach geht es los."
                punkte = [{"titel": s[0], "text": s[1 + waehle]} for s in t["schritte"]]
            else:
                text = beschreibung
            abschnitte.append({"id": sid, "titel": teil["titel_vorschlag"], "text": text, "punkte": punkte})

        return schema.model_validate(
            {
                "seitentitel": f"{name}{ort}"[:70],
                "meta_beschreibung": f"{name}{ort}: {beschreibung}"[:170],
                "hero": {
                    "ueberschrift": t["hero"][waehle],
                    "unterzeile": (wunsch or beschreibung)[:240],
                    "cta_text": "Kontakt aufnehmen",
                },
                "abschnitte": abschnitte
                or [{"id": "ueber-uns", "titel": "Über uns", "text": beschreibung, "punkte": []}],
                "faq": [{"frage": f[0], "antwort": f[1 + waehle]} for f in t["faq"]],
                "kontakt_text": "Schreib uns einfach." if du else "Schreiben Sie uns einfach.",
                "design": {"farbe": kunde["farbe"], "stil": kunde["stil"]},
            }
        )
