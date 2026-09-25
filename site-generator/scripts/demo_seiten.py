"""Rendert eine Beispielseite in allen drei Stilen mit echten Texten, ohne Modell.

Aufruf: uv run python scripts/demo_seiten.py
Die Seiten landen im normalen Datenordner und sind unter /sites/<id>/ erreichbar.
"""

import io
import json

from PIL import Image, ImageDraw

from app.config import get_settings
from app.generator import Generator
from app.schemas import SiteContent, SiteRequest
from app.storage import Storage

INHALT = {
    "seitentitel": "SV Blau-Weiß Gievenbeck, Sport im Münsteraner Westen",
    "meta_beschreibung": "Fußball ab 4 Jahren, Tischtennis und Walking in Münster-Gievenbeck. Probetraining kostenlos.",
    "hero": {
        "ueberschrift": "Hier spielt der Westen von Münster.",
        "unterzeile": "Fußball ab vier Jahren, Tischtennis am Dienstag und eine Walking-Runde für alle, die lieber reden als rennen. Ehrenamtlich organisiert und offen für jeden.",
        "cta_text": "Probetraining anfragen",
    },
    "abschnitte": [
        {
            "id": "ueber-uns",
            "titel": "Über uns",
            "text": "Bei uns zählt, dass du kommst, nicht wie gut du schon bist. Rund 400 Mitglieder, vom Bambini bis zur Walking-Gruppe, halten den Verein am Laufen. Alles ehrenamtlich, alles mit Herz.\nWir sind kein Leistungszentrum und wollen auch keins werden. Wer bei uns trainiert, lernt Fußball und lernt Leute kennen.",
            "punkte": [],
        },
        {
            "id": "angebote",
            "titel": "Abteilungen",
            "text": "Vier Wege, bei uns mitzumachen.",
            "punkte": [
                {
                    "titel": "Fußball Jugend",
                    "text": "Von den Bambini bis zur A-Jugend, mit ausgebildeten Trainerinnen und Trainern.",
                },
                {
                    "titel": "Tischtennis",
                    "text": "Dienstags in der Halle, für Einsteiger und alle, die ihren Aufschlag verbessern wollen.",
                },
                {
                    "titel": "Walking 60+",
                    "text": "Samstags eine Stunde rund um Gievenbeck. Das Tempo bestimmt die Gruppe.",
                },
                {
                    "titel": "Vereinsfest",
                    "text": "Einmal im Jahr im Juni: Turnier, Grill und der ganze Stadtteil auf dem Platz.",
                },
            ],
        },
        {
            "id": "zeiten",
            "titel": "Training und Termine",
            "text": "Einfach vorbeikommen, Sportsachen mitbringen, fertig.",
            "punkte": [],
        },
        {
            "id": "mitmachen",
            "titel": "Mitmachen",
            "text": "Das erste Training ist immer kostenlos.",
            "punkte": [
                {
                    "titel": "Vorbeikommen",
                    "text": "Such dir einen Termin aus und komm zum Platz. Anmelden musst du dich nicht.",
                },
                {
                    "titel": "Ausprobieren",
                    "text": "Trainiere zwei oder drei Mal mit und schau, ob es passt.",
                },
                {
                    "titel": "Mitglied werden",
                    "text": "Den Antrag bekommst du beim Training oder per E-Mail.",
                },
            ],
        },
    ],
    "faq": [
        {
            "frage": "Brauche ich Vorkenntnisse?",
            "antwort": "Nein. Unsere Gruppen sind nach Alter sortiert, nicht nach Können.",
        },
        {
            "frage": "Was muss ich zum Probetraining mitbringen?",
            "antwort": "Sportsachen, Hallenschuhe oder Stollen und etwas zu trinken.",
        },
        {
            "frage": "Wir suchen Trainer. Kann ich helfen?",
            "antwort": "Sehr gern. Schreib uns eine E-Mail, wir melden uns innerhalb einer Woche.",
        },
    ],
    "kontakt_text": "Komm einfach vorbei oder schreib uns.",
    "design": {"farbe": "#1f4e8c", "stil": "klar"},
}


class DemoLLM:
    def generate(self, system, user, schema):
        return SiteContent.model_validate(INHALT)


def testbild(farben, text) -> bytes:
    bild = Image.new("RGB", (1400, 1000))
    zeichnen = ImageDraw.Draw(bild)
    for y in range(1000):
        t = y / 1000
        zeichnen.line(
            [(0, y), (1400, y)], fill=tuple(int(a + (b - a) * t) for a, b in zip(*farben))
        )
    zeichnen.ellipse((820, 180, 1260, 620), fill=tuple(min(255, c + 40) for c in farben[1]))
    zeichnen.rectangle((0, 760, 1400, 1000), fill=tuple(max(0, c - 30) for c in farben[0]))
    puffer = io.BytesIO()
    bild.save(puffer, "JPEG", quality=88)
    return puffer.getvalue()


def main():
    settings = get_settings()
    storage = Storage(settings.data_dir)
    from app.images import bild_verarbeiten

    bilder = []
    for farben, text in [
        (((30, 60, 40), (120, 170, 110)), "Platz"),
        (((20, 40, 80), (140, 170, 210)), "Halle"),
        (((90, 50, 30), (220, 170, 120)), "Fest"),
        (((50, 50, 60), (180, 180, 170)), "Team"),
    ]:
        bilder.append(storage.upload_speichern(bild_verarbeiten(testbild(farben, text)), "webp"))

    gen = Generator(DemoLLM(), storage)
    urls = {}
    for stil, farbe in [("klar", "#1f4e8c"), ("warm", "#b5452b"), ("modern", "#e8ff3a")]:
        req = SiteRequest(
            name="SV Blau-Weiß Gievenbeck e. V.",
            kategorie="verein",
            ort="Münster-Gievenbeck",
            beschreibung="Sportverein im Westen von Münster mit Fußball, Tischtennis und Walking.",
            angebote=["Fußball Jugend", "Tischtennis", "Walking 60+", "Vereinsfest"],
            zeiten="Mo und Do 16:30 Uhr: Fußball Jugend\nDi 19:00 Uhr: Tischtennis\nSa 10:00 Uhr: Walking ab Sportplatz",
            farbe=farbe,
            stil=stil,
            anrede="du",
            kontakt={
                "email": "info@bw-gievenbeck.de",
                "telefon": "0251 987654",
                "adresse": "Toppheideweg 20, 48161 Münster",
            },
            bilder=[
                {"id": b, "beschreibung": t}
                for b, t in zip(
                    bilder,
                    [
                        "Die D-Jugend beim Abschlusstraining",
                        "Tischtennis am Dienstag",
                        "Vereinsfest im Juni",
                        "Unser Trainerteam",
                    ],
                )
            ],
            bildrechte_bestaetigt=True,
        )
        site_id, _ = gen.erstellen(req)
        urls[stil] = f"http://localhost:8765/sites/{site_id}/"
    print(json.dumps(urls, indent=1))


if __name__ == "__main__":
    main()
