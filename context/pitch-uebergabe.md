# dome.ms – Übergabe Pitch-Stand (Münsterhack 2026)

> Stand: 25.09.2026, nachmittags · Verfasst von Sophia (Pitch & Story) mit Claude
> Zweck: Wer das liest, kann genau hier weiterarbeiten.
> Ergänzt die `masterdatei.md` (Produkt, Architektur, Moat, User Stories). Diese Datei deckt **Pitch, Story, Faktenlage und offene Entscheidungen** ab.
> Ausführliche Recherche mit allen Quellen: Claude-Doc „dome.ms – Deep Research für den Pitch“ (https://claude.ai/code/artifact/e13bf770-e370-4b48-8170-84f376be0967)

---

## 1. Kontext

- **Event:** Münsterhack 2026. Pitch vor der Jury **morgen (26.09.)**, heute Nachmittag Probe-Pitch vor den Mentoren (Feedback-Runde).
- **Ziel:** 1. Platz. Außerdem: so überzeugend, dass Partner und Geldgeber sagen „bitte nach dem Hackathon umsetzen, wir unterstützen euch“.
- **Rollen:** Sophia verantwortet Pitch und Story, die Entwickler bauen die Demo. Im Pitch erklärt eine Person aus dem Dev-Team ca. 30 Sekunden Lösung und Technik.
- **Repo:** `dome-ms-frontend` (Next.js-Grundgerüst in `apps/web`, Kontext in `context/masterdatei.md`). Stand heute Mittag: nur Grundstruktur, noch keine Demo-Funktionen.

## 2. Die Idee in einem Satz

**„dome.ms ist das Cloudflare für Münster, nur dass es den Münsteranern gehört.“**

Ein Verein (später Genossenschaft) betreibt ein Netz aus Servern vertrauenswürdiger Partner in Münster (Wunschpartner: Rechenzentren, IT-Firmen, Stadtwerke, Uni). Darauf laufen Schutz (Reverse-Proxy, WAF, Bot-Schutz) und Hosting. Vereine, Kleinunternehmen und Initiativen nutzen das Netz ohne eigene Technik. Drei Leistungen:

1. **Website in Minuten:** Beschreiben, was man braucht, eine KI baut daraus eine statische Seite (Markdown, jederzeit exportierbar).
2. **Schutz-Modus:** Wer schon einen Server hat, stellt den DNS um. Bots und Angriffe werden gefiltert, der eigene Server ist von außen unsichtbar.
3. **Open Data als Nebenprodukt:** Termine und Öffnungszeiten landen (nur mit Zustimmung) maschinenlesbar in einem Stadt-Datenportal.

## 3. Wichtigste Erkenntnisse aus Chat und Recherche

1. **Unser USP ist NICHT die KI-Bot-Erkennung.** Cloudflare blockt seit dem **15.09.2026** KI-Trainings- und Agent-Crawler standardmäßig, auch im Gratis-Tarif. Bot-Schutz ist Pflichtprogramm, kein Alleinstellungsmerkmal.
2. **Der echte USP ist die Kombination:** gehört den Mitgliedern + Website in 20 Minuten für Nicht-Techniker + Partner vor Ort, die man kennt.
3. **Kernsatz des Pitches:** *„Wo der Server steht, ist egal. Entscheidend ist, wem er gehört.“* Er verbindet Problem (CLOUD Act, Abhängigkeit) und Lösung (Genossenschaft).
4. **Open Source ist der Beweis für Souveränität, kein Anhängsel:** Unabhängige Fachleute können prüfen, was mit den Daten passiert, niemand ist eingesperrt, nicht mal bei uns. Andere Städte können das Modell übernehmen.
5. **Größte Gefahr ist Gaia-X** (zu viele Beteiligte, kein Produkt). Zweitgrößte ist **De-Mail** (Souveränität verkauft nichts, wenn die Bedienung umständlich ist). Also klein starten, Einfachheit über alles.
6. **Bestes Vorbild sind die Energiegenossenschaften** (998 Genossenschaften, 220.000 Mitglieder, getragen von lokalen Banken und Handwerk). **CHATONS** (Frankreich, ~100 lokale Hoster mit gemeinsamer Charta) ist fast genau unser Föderationsmodell.
7. **Größte unbewiesene Annahme:** dass Hosting-Partner Server stellen. Eine einzige Absichtserklärung (Verein, Firma oder Partner) wäre mehr wert als jede Folie.
8. **Geldgeber sind nicht VCs.** Eine eG hat keinen Exit und eine Stimme pro Mitglied. Die richtigen Unterstützer: Stadtwerke, Volksbanken, LVM, NRW.BANK, Stiftungen, Förderprogramme. Die eG kann investierende Mitglieder aufnehmen.

## 4. Faktencheck: So dürfen wir es sagen

| Aussage | Status | Formulierung im Pitch |
|---|---|---|
| Über die Hälfte des Web-Traffics sind Bots | ✅ | 57,5 % der HTML-Anfragen (Cloudflare Radar, Juni 2026) |
| Jede fünfte Website läuft über Cloudflare | ✅ | ~20 % (W3Techs, Nov. 2025), die Nr. 2 hat 1–2 % |
| Cloudflare-Ausfall legt Netz lahm | ✅ | 18.11.2025: X, ChatGPT und tausende Seiten stundenlang weg |
| CLOUD Act | ✅ genau formulieren | „Ein US-Gesetz verpflichtet amerikanische Anbieter, Daten auf Anordnung herauszugeben, auch wenn der Server in Frankfurt steht.“ **Nicht** „die USA sehen alles“ |
| Cloudflare ist DSGVO-widrig | ❌ | Das EU-Gericht hat das Datenabkommen am 03.09.2025 bestätigt, die Berufung beim EuGH läuft. Sagen: „erlaubt, aber mit Rechtsunsicherheit, zwei Vorgänger wurden schon gekippt“ |
| Nur Cloudflare ist bezahlbar | ❌ | „Cloudflare ist der Standard, fast ohne Konkurrenz“ |
| Statische Seiten sind unhackbar | ❌ | „kaum Angriffsfläche“ |
| Münster hat die Souveränität erfunden | ❌ | „Hier wurde 1648 der Grundstein gelegt“ (so formuliert es auch die Stadt Münster) |
| Strafgerichtshof verlor Microsoft-Mail | ⚠️ umstritten | Microsoft bestreitet es. Belegt: Der IStGH wechselt zu openDesk (deutsches Open Source). Nur für die Fragerunde |
| Stadtwerke-Nodes wehren DDoS ab | ❌ | Schutz gegen Bots, Scanner, Angriffe auf Anwendungsebene. Große DDoS-Angriffe brauchen Upstream-Partner |
| Stadtwerke/Uni sind Partner | ❌ | Wunschpartner. Als Einladung formulieren, nicht als Tatsache |
| Domain dome.ms | ❓ | .ms = Montserrat. Verfügbarkeit und Kosten **noch prüfen** |

## 5. Aktuelle Pitch-Struktur (7 Folien, ca. 4 Minuten)

Roter Faden: Petras Website ist weg → die schnelle Lösung macht noch abhängiger → wem gehört der Server? → dome.ms gehört den Münsteranern → Demo → klein starten, Münster zuerst → Bitte an den Raum.

| # | Folie | Inhalt | Zeit |
|---|---|---|---|
| 1 | Hook | Schwarze Folie mit Browser-Fehlermeldung „tsv-gievenbeck.de nicht erreichbar“, 3 Sek. Stille, dann WhatsApp aus der Vereinsgruppe: „Weiß jemand, wer unsere Website gemacht hat??“ Petra, Kassenwartin (fiktiv) | 25 s |
| 2 | Einzeiler | „Das Cloudflare für Münster, nur dass es den Münsteranern gehört.“ Visual: Kuppel über der Münster-Silhouette | 10 s |
| 3 | Problem | Petra nimmt den nächsten Baukasten, der Mittelständler mit Bot-Problem geht zu Cloudflare. Über die Hälfte des Traffics sind Bots. **Brücke:** „Dann hat Petra dasselbe Problem nur woanders: Sie weiß nicht, wem ihre Seite gehört.“ | 35 s |
| 4 | Warum jetzt | Cloudflare-Ausfall 2025 (ein Fünftel des Internets), CLOUD Act → „Wo der Server steht, ist egal. Entscheidend ist, wem er gehört.“ Dazu: „Abhängigkeit war früher bequem. Heute ist sie ein Risiko.“ | 40 s |
| 5 | Lösung + Demo | Bild vom **Türsteher**: Kunden rein, Bots raus, und der Türsteher sitzt in Münster. Drei Icons: Website bauen, schützen, sichtbar werden. Keine Technikbegriffe (kein DNS, kein „statisch“) | 60 s |
| 6 | Warum das funktioniert | Gehört den Mitgliedern (erst e. V., dann eG), offener Code, deshalb bezahlbar (kein Profit, keine Lizenzen, Partner bringen Kapazität, statische Seiten sind billig). Unternehmen tragen den Betrieb, Vereine ab 5 € | 40 s |
| 7 | Warum Münster + Schluss | 1648 Grundstein der Gleichberechtigung souveräner Staaten, egal wie klein. „Der Sportverein soll so souverän sein wie der Konzern. Eine Stadt muss anfangen.“ Münster kann Genossenschaft (LVM ist ein Versicherungsverein auf Gegenseitigkeit). Schluss: Petra sagt „Warum? Unsere Seite läuft hier in Münster.“ | 30 s |

**Bereits entschieden:**
- Kein „Wo liegen wir falsch?“ am Ende des Mentoren-Pitches. Das gehört ins Gespräch, nicht in den Pitch.
- Der Strafgerichtshof kommt aus dem Pitch raus und nur in die Fragerunde (zu weit weg, wirkt alarmistisch).
- Schlusssatz „läuft hier in Münster“ statt „bei den Stadtwerken“, solange die Stadtwerke kein Partner sind.
- 1648 nur einmal, kurz, nicht kitschig.

## 6. Geschäftsmodell (Vorschlag, im Team abstimmen)

| Mitgliedsart | Leistung | Beitrag |
|---|---|---|
| Verein / Initiative | Website, Subdomain, Hosting, Open Data | 5 €/Monat |
| Kleinunternehmen | Website, eigene Domain, Migration | 15 €/Monat |
| Unternehmen mit eigenem Server | Schutz-Modus (Proxy, WAF, Bot-Schutz, Dashboard) | 49 €/Monat (zum Vergleich: Myra ab 399 €, Cloudflare gratis aber US) |
| Hosting-Partner | stellt Nodes, wird zertifiziert | kein Beitrag bzw. Vergütung |

**Rechenbeispiel:** 150 Vereine + 100 Kleinunternehmen + 60 Schutz-Kunden ≈ 62.000 €/Jahr, das trägt eine Vollzeitstelle (~60.000 €, Schätzung). Münster hat ~200 Sportvereine im Stadtsportbund.

**Startfinanzierung:**
- **Prototype Fund:** bis 158.333 € für Teams bis 4 Personen, Open Source mit gesellschaftlichem Nutzen. **Bewerbung ab 01.10.2026**, also direkt nach dem Hackathon.
- **Gründungsstipendium.NRW:** 1.200 €/Monat pro Person. Antragsfrist laut Seite am 30.09.2026, Verlängerung prüfen. Setzt Vollzeit voraus.
- Partner (Digital Hub münsterLAND, Stadtwerke, Volksbanken, LVM) für Sponsoring, Nodes und investierende Mitglieder.

## 7. Konkurrenz auf einen Blick

- **Cloudflare (USA):** gratis, kann alles, blockt KI-Bots. Schwäche: US-Jurisdiktion, Klumpenrisiko, kein persönlicher Kontakt.
- **Myra, Link11 (DE):** souverän, aber für Behörden und Konzerne, ab ~399 €/Monat.
- **Bunny.net (Slowenien):** günstig, aber für Entwickler, ohne Community.
- **Jimdo, Wix, IONOS:** Petras eigentliche Alternative. Kein Schutz eigener Server, schwieriger Export, keine Mitbestimmung.
- **Hostsharing eG:** Hosting-Genossenschaft seit 2000 (~260 Mitglieder). Beweis, dass das Modell überlebt, aber klein bleibt, wenn es nur Techniker anspricht.
- **CrowdSec, Anubis, Coraza, Caddy (Open Source):** keine Gegner, sondern **unsere Bausteine**. Botschaft: „Wir erfinden die Sicherheitstechnik nicht neu, wir machen sie für alle nutzbar, die keinen Admin haben.“

## 8. Harte Fragen: vorbereitete Antworten

| Frage | Antwort |
|---|---|
| Cloudflare ist gratis und blockt KI-Bots auch. Warum ihr? | Bei Cloudflare seid ihr Kunde eines US-Konzerns, bei uns Miteigentümer. Und Petra braucht nicht Cloudflare, sondern eine Seite, die dem Verein gehört und in 20 Minuten steht. |
| Ist Cloudflare nicht DSGVO-konform? | Aktuell ja. Aber zwei Vorgänger-Abkommen wurden gekippt, die nächste Instanz läuft. Wir bieten Sicherheit, die nicht von einem Urteil in Luxemburg abhängt. |
| Warum sollten die Stadtwerke mitmachen? | Sichtbarkeit als Träger der digitalen Infrastruktur Münsters, Mitbestimmung, regionale Wertschöpfung wie bei Energiegenossenschaften. Ehrlich: noch nicht bestätigt. |
| Großer DDoS-Angriff? | Dafür brauchen wir Upstream-Partner. Unser Fokus sind Bots, Scanner und Angriffe auf Anwendungsebene, also das, was kleine Seiten wirklich trifft. |
| Ist das nicht Gaia-X im Kleinen? | Gaia-X hatte zu viele Beteiligte und kein Produkt. Wir starten mit drei Partnern und einem Prototyp. |
| Haftung und Datenschutz? | Wie jeder Hoster: Nutzungsbedingungen, Meldeweg, AV-Verträge. Die eG bringt einen Prüfverband als zusätzliche Kontrolle. |
| Wie verdient ihr Geld? | Gestaffelte Mitgliedsbeiträge. Unternehmen tragen den Betrieb, Vereine die Reichweite. Ab ~310 Mitgliedern trägt sich eine Vollzeitstelle. |
| Warum Münster und nicht Berlin? | Eine Stadt muss anfangen. Münster hat die Tradition (1648, Genossenschaften), die richtige Größe und uns. Danach ist es eine Blaupause für andere Städte. |

**Weitere Risiken für später** (nicht im Pitch): Ein e. V. darf nicht hauptsächlich wirtschaftlich tätig sein, deshalb früh eG gründen (einmalig ~1.500–4.000 €). NIS2 gilt seit 06.12.2025, DNS-Dienste fallen unabhängig von der Größe darunter, juristisch prüfen. Nachts-um-drei-Support braucht bezahlte Bereitschaft. „Lokaler Traffic bleibt lokal“ nicht technisch versprechen (das Glasfasernetz der Stadtwerke-Tochter betreibt die Telekom).

## 9. Offene Entscheidungen

- [ ] **Hauptzielgruppe im Pitch:** Vereine (Petra) oder Unternehmen mit Schutz-Modus? Aktueller Vorschlag: Petra als emotionaler Einstieg, der Mittelständler taucht kurz im Problemteil auf, Unternehmen finanzieren das Modell.
- [ ] Rolle von **Open Data** im Pitch: Wow-Moment in der Demo oder weglassen, um den Fokus zu halten?
- [ ] **Preise** im Team bestätigen.
- [ ] **Name/Domain** klären (dome.ms verfügbar?).
- [ ] Wer im Team spricht welchen Teil?

## 10. Nächste Schritte

1. **Mit den Entwicklern die drei Demo-Momente festlegen**, die sicher funktionieren: (a) Petras Seite entsteht live und ist unter `tsv-gievenbeck.dome.ms` erreichbar, (b) ein Bot wird im Dashboard sichtbar geblockt, (c) optional `/opendata/` liefert Termine als JSON. **Video-Backup aufnehmen.**
2. **Mentoren-Pitch heute:** gezielt fragen:
   - Vereine oder KMU in den Vordergrund?
   - Ist Open Data ein Wow oder verwässert es den Pitch?
   - **Kennt ihr jemanden bei Stadtwerken, LVM, Stadtsportbund oder einem Verein, der Pilot wäre?**
   - Was würde euch als Jury skeptisch machen?
3. **Eine Absichtserklärung** (per Mail reicht) von einem Verein, einer Firma oder einem Hosting-Partner bis morgen besorgen. Einen Live-Test nur mit schriftlichem Okay und an einer Kopie der Seite.
4. Nach dem Mentoren-Feedback: **Sprechtext für die 7 Folien final ausformulieren** und Folien bauen.
5. Folie „Konkrete Bitte an den Raum“ ergänzen: 1 Hosting-Partner, 10 Pilotvereine, Unterstützung für die Prototype-Fund-Bewerbung. Erster Schritt: „In 6 Monaten: 3 Partner, 10 Pilotseiten, eG vorbereitet.“
6. Nach dem Hackathon: Prototype-Fund-Bewerbung (ab 01.10.2026).
