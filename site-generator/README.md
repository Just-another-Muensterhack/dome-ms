# KI-Website-Generator

Kunden füllen einen kurzen Fragebogen aus, die KI schreibt daraus eine fertige, statische Website.
Änderungen gehen per Satz ("mach die Texte kürzer"). Ergebnis: Vorschau im Browser und ZIP-Download.

## Starten

```bash
cp .env.example .env        # Provider und Key eintragen, ohne Key läuft LLM_PROVIDER=fake
uv sync
uv run uvicorn app.main:app --port 8765 --reload
```

Dann http://localhost:8765 öffnen (Kunden-Flow) oder http://localhost:8765/docs (API-Doku).

## Ablauf für den Kunden

| Schritt           | Angaben                                              | Pflicht                 |
| ----------------- | ---------------------------------------------------- | ----------------------- |
| 1. Wer seid ihr   | Name, Art, Kurzbeschreibung, Ort                     | Name, Art, Beschreibung |
| 2. Was bietet ihr | Angebote als Stichpunkte, Zeiten                     | nein                    |
| 3. Logo und Bilder | Logo, bis zu 6 Bilder mit Beschreibung, Bildrechte bestätigen | Bestätigung, sobald etwas hochgeladen ist |
| 4. Aussehen       | Farbe, Stil (klar, warm, modern), Sie oder Du, Modus | nein                    |
| 5. Kontakt        | E-Mail, Telefon, Adresse, Freitext-Wünsche           | nein                    |

Danach: Vorschau (Desktop und Handy), Änderung per Satz, Download als ZIP.

## API für das Frontend

| Methode | Pfad                       | Zweck                                                       |
| ------- | -------------------------- | ----------------------------------------------------------- |
| POST    | `/api/uploads`             | Multipart `datei` und `art` (logo oder bild), liefert `upload_id`, beim Logo auch einen Farbvorschlag |
| POST    | `/api/sites`               | Fragebogen rein, `site_id` und `preview_url` raus           |
| POST    | `/api/sites/{id}/revise`   | `{"anweisung": "..."}`, überarbeitet die Seite              |
| GET     | `/sites/{id}/`             | fertige Seite, dazu `impressum.html` und `datenschutz.html` |
| GET     | `/api/sites/{id}/download` | ZIP mit allen Seiten                                        |
| GET     | `/health`                  | Healthcheck                                                 |

Die Vorschau lässt sich per iframe einbetten, wenn die Frontend-Origin in `ALLOWED_ORIGINS` steht.

## Zwei Modi

- **Vorlage (Standard):** Die KI liefert nur Texte als JSON, geprüft gegen ein Schema. Layout, Farben
  und Gliederung je Art kommen aus dem Code (`app/structure.py`, `app/templates/`). Stabil und sicher.
- **Frei gestaltet:** Die KI schreibt HTML und CSS selbst. Das Markup wird mit nh3 auf eine
  Positivliste reduziert, externe Ressourcen fliegen raus.

## Sicherheit und Datenschutz

- Kontaktdaten und Zeiten gehen nie an die KI, sie werden direkt ins Template gesetzt.
- Kundeneingaben stehen nie im System-Prompt, sondern als markierter Datenblock (Schutz gegen Prompt-Injection).
- Ausgelieferte Seiten haben eine CSP ohne Scripts (`default-src 'none'`), die Vorschau läuft in einem Sandbox-iframe.
- Bilder werden neu kodiert (EXIF und GPS weg), nur PNG, JPG, WebP bis 8 MB, kein SVG. Ungenutzte Uploads werden nach 24 Stunden gelöscht.
- Ohne Logo erzeugt der Generator ein Zeichen aus den Initialen, das auch als Favicon dient.
- Keine Cookies, kein Tracking, keine externen Fonts. Impressum und Datenschutz als Entwurf mit markierten Lücken.
- Validierung mit Pydantic (unbekannte Felder werden abgelehnt), Rate Limit pro IP, CORS nur für konfigurierte Origins.

## Modell wechseln

In der `.env`: `LLM_PROVIDER=anthropic` mit `ANTHROPIC_API_KEY`, oder `LLM_PROVIDER=openai` mit
`OPENAI_BASE_URL` für OpenAI, Azure OpenAI oder Ollama (`http://localhost:11434/v1`).

## Offen nach dem MVP

- Impressumsdaten im Flow abfragen, Pflicht vor dem Veröffentlichen
- Veröffentlichen auf die Domain aus dem Onboarding
- Upload-Aufräumen als regelmäßiger Job statt nur beim Start
- Datenbank statt Dateiablage, Rate Limit über Redis bei mehreren Instanzen

## Tests

```bash
uv run pytest
```
