# dome.ms — Digitale Souveränität für Münster

> **Groundfile** · Projekt für den Münsterhack 2026 · Stand: September 2026
> Ein gemeinschaftlich betriebenes, lokales Web-Netzwerk: Hosting, Schutz und Open Data für Unternehmen, Vereine und Bürger:innen in Münster.
> *„dome.ms" ist ein Arbeitstitel — der Name kann sich noch ändern (siehe Abschnitt 11).*

---

## 1. Ein Satz

**dome.ms ist das Cloudflare für Münster — nur dass es den Münsteranern gehört.**

Ein Verein bzw. eine Genossenschaft betreibt ein Netz aus Servern, die **vertrauenswürdige Hosting-Mitglieder** aus Münster bereitstellen — etwa die Stadtwerke, lokale Rechenzentren, IT-Unternehmen oder die Uni. Darauf laufen Reverse-Proxies, eine Web Application Firewall (WAF) und statisches Hosting. Alle anderen Mitglieder — der Bäcker, der Sportverein, die Bürgerinitiative — nutzen das Netz, ohne selbst Infrastruktur zu betreiben. Jede Website bekommt eine Adresse wie `test.dome.ms` oder nutzt ihre eigene Domain. Lokaler Traffic bleibt lokal.

---

## 2. Das Problem

| Wer | Schmerz heute |
|---|---|
| **Kleine Unternehmen** (Bäckerei, Handwerk, Praxis) | Website vom Neffen 2014 gebaut, WordPress ungepatcht, gehackt oder unerreichbar. Agentur zu teuer, Baukasten-Anbieter speichern alles in den USA. |
| **Vereine** | Kein Budget, kein Admin. Website liegt auf einem Privat-Hoster, Kontakt ist längst ausgetreten. |
| **Bürger:innen / Initiativen** | Wollen eine einfache Seite, landen bei Wix/Squarespace/Google Sites. Daten, Tracking und Abhängigkeit inklusive. |
| **Betreiber eigener Server** | Werden von Bots, Scannern und DDoS überflutet. Einziger bezahlbarer Schutz: Cloudflare — ein US-Konzern, der den gesamten Klartext-Traffic sieht. |
| **Stadtgesellschaft** | Informationen über Münster liegen verstreut, nicht maschinenlesbar, nicht durchsuchbar, nicht nachhaltig. |

Kurz: **Digitale Infrastruktur für Münster ist heute fast vollständig outgesourct — an Anbieter, die nicht hier sind, deren Regeln man nicht kennt und deren Server man nicht kontrolliert.**

---

## 3. Die Lösung

dome.ms bietet drei Dinge, die sich einzeln oder zusammen nutzen lassen:

### 3.1 Website erstellen (Hosting)
- Account anlegen → Website anlegen → Domain wählen (`meinverein.dome.ms` oder eigene Domain).
- Inhalte werden mit KI-Unterstützung erstellt: Man beschreibt, was man braucht (Öffnungszeiten, Angebote, Vorstand, Termine), das LLM erstellt daraus ein **Markdown-/Obsidian-Repository**.
- Der Nutzer wählt ein **Theme**, das Repo wird als **statische Website** exportiert und auf die Nodes verteilt.
- Kein CMS, keine Datenbank, keine Angriffsfläche: Statische Seiten lassen sich nicht "hacken" wie ein WordPress.
- Inhalte gehören dem Nutzer — als Markdown, jederzeit exportierbar, offline in Obsidian bearbeitbar.

### 3.2 Bestehenden Server schützen (Protect-Modus)
- Der Nutzer legt den DNS seiner Domain auf dome.ms.
- Ein Proxy auf einem **Trusted Node** terminiert TLS, öffnet eine neue TLS-Verbindung zum Ursprungsserver (Origin) und leitet **nur legitimen Traffic** weiter.
- WAF, Rate-Limiting, Bot-Erkennung, Priorisierung ("Münster zuerst" — kein Geo-Blocking), Caching.
- Der Origin-Server ist nach außen unsichtbar — Angriffe treffen die Trusted Nodes, nicht den Vereinsserver im Keller.
- Klartext-Traffic sehen ausschließlich die zertifizierten Hosting-Mitglieder, die dafür vertraglich (AV-Vertrag, TOMs, Audit) gebunden sind — nie ein beliebiges Mitglied.

### 3.3 Migration bestehender Websites
- Bestehende Seite wird gecrawlt, Inhalte per KI extrahiert und strukturiert und als Markdown-Repo mit Theme neu aufgebaut.
- Aus einer alten, unsicheren dynamischen Seite wird in Minuten eine statische, gepflegte Seite — ohne dass jemand den Inhalt neu abtippen muss.

### 3.4 Open Data Portal (Nebenprodukt, das keiner sonst hat)
- Alle gehosteten statischen Seiten liegen strukturiert als Markdown vor.
- Mit Zustimmung der Betreiber werden die Inhalte (Öffnungszeiten, Termine, Angebote, Ansprechpartner) analysiert und als **maschinenlesbarer Datensatz** über ein Open-Data-Portal veröffentlicht (JSON/CSV/API, ggf. schema.org-konform).
- Ergebnis: Ein lebendiger, aktueller Datenschatz über das Vereins- und Wirtschaftsleben in Münster — der jedem gehört.

---

## 4. Wie es funktioniert — Architektur

```
                    ┌──────────────────────────────────────────┐
                    │              dome.ms Control Plane        │
                    │  Accounts · Domains · Repos · Builds       │
                    │  Zertifikate (ACME) · Node-Registry · Open Data │
                    └────────────────────┬─────────────────────┘
                                         │ verteilt Konfiguration + Static-Builds
       ┌──────────────┬──────────────────┼──────────────────┬──────────────┐
       ▼              ▼                  ▼                  ▼              ▼
   ┌──────────┐   ┌──────────┐     ┌──────────┐     ┌──────────┐   ┌──────────┐
   │ Trusted  │   │ Trusted  │     │ Trusted  │     │ Trusted  │   │ Trusted  │
   │ Node A   │   │ Node B   │     │ Node C   │     │ Node D   │   │ Node …   │
   │Stadtwerke│   │Rechenzen-│     │ IT-Firma │     │ Uni /    │   │          │
   │          │   │trum MS   │     │ aus MS   │     │ Stadt    │   │          │
   │ Nginx    │   │ Nginx    │     │ Nginx    │     │ Nginx    │   │          │
   │ WAF      │   │ WAF      │     │ WAF      │     │ WAF      │   │          │
   │ Cache    │   │ Cache    │     │ Cache    │     │ Cache    │   │          │
   └────┬─────┘   └────┬─────┘     └────┬─────┘     └────┬─────┘   └──────────┘
        │              │                │                │
        │  statische Seiten lokal ausliefern  │  Protect-Modus: TLS neu zum Origin
        ▼              ▼                ▼                ▼
   Besucher:innen (Münster zuerst)                 Origin-Server eines Mitglieds
                                                   (z. B. Shop des Mittelständlers)
```

### Zwei Arten von Mitgliedern
| | Hosting-Mitglieder (Trusted Nodes) | Normale Mitglieder |
|---|---|---|
| **Wer** | Stadtwerke, Rechenzentren, IT-Unternehmen, Uni, Stadt — Organisationen mit professionellem Betrieb | Unternehmen, Vereine, Initiativen, Privatpersonen |
| **Stellen** | Server/VMs, Bandbreite, Betrieb nach Vereinsstandard | nichts — sie nutzen |
| **Sehen** | Traffic der gehosteten Seiten (vertraglich gebunden, auditiert) | nur ihre eigenen Daten |
| **Bekommen** | Mitgestaltung, reduzierte Beiträge/Vergütung, Sichtbarkeit als "Träger der digitalen Infrastruktur Münsters" | Website, Schutz, Open-Data-Sichtbarkeit |

Der Bäcker betreibt also keinen Server im Hinterzimmer. Das Netz ist Peer-to-Peer *zwischen den Hosting-Mitgliedern* — und für alle anderen einfach ein Dienst, dem sie vertrauen können, weil sie wissen, wer ihn betreibt.

### Bausteine
| Komponente | Aufgabe | Vorschlag Technologie |
|---|---|---|
| **Trusted Nodes** | Reverse-Proxy, TLS-Terminierung, WAF, Caching, statische Auslieferung | Nginx / OpenResty oder Caddy, ModSecurity + OWASP CRS oder Coraza, CrowdSec für Bot-/IP-Reputation |
| **Node-Agent** | Holt Konfiguration und Builds, meldet Health, rotiert Zertifikate | Kleiner Go-/Rust-Daemon, Verbindung zur Control Plane über WireGuard |
| **DNS** | Verteilt Anfragen auf Nodes, Failover | Authoritative DNS mit Health-Checks (z. B. PowerDNS), GeoDNS: Münster-Nutzer → Münster-Nodes |
| **Control Plane** | Accounts, Websites, Domains, Zertifikate, Builds, Node-Registry | Web-App + API; Git-Repos pro Website |
| **Builder** | Markdown → statische Seite mit Theme | Static-Site-Generator (Hugo/Astro/Quartz für Obsidian-Vaults) |
| **KI-Assistent** | Inhalte erstellen, Migration (Crawl → Struktur → Markdown) | LLM-Pipeline, idealerweise mit EU-gehostetem oder lokalem Modell |
| **Open Data** | Extraktion strukturierter Daten aus Markdown, Portal + API | Schema.org-Mapping, JSON/CSV-Export, öffentliche API |
| **Storage** | Builds, Repos, Backups, verteilt auf Nodes | Objekt-Storage mit Replikation (z. B. MinIO / Garage) |

### Grundprinzip: Keep Local Traffic Local — "Münster zuerst"
- Anfragen aus Münster werden von Nodes in Münster beantwortet — kurze Wege, schnelle Antwort, keine Umleitung über Frankfurt oder Dublin.
- Daten verlassen die Stadt nicht, wenn sie es nicht müssen.
- **Kein Geo-Blocking.** Der Tourist aus Hamburg, die Studentin im Auslandssemester, der Lieferant aus den Niederlanden — alle kommen durch. "Münster zuerst" heißt Priorisierung, nicht Ausschluss: Bei Lastspitzen oder Angriffen bekommen erkennbar lokale Anfragen Vorrang, Bots und Scanner werden gedrosselt oder geblockt.
- Lokalität wird über Netz-Nähe (Stadtnetz, Glasfaser, lokale Provider, Peering) bestimmt, nicht nur über GeoIP — das ist genauer und braucht keine Nutzerdaten.

---

## 5. Organisation: Verein oder Genossenschaft

| | Verein (e. V.) | Genossenschaft (eG) |
|---|---|---|
| **Gründung** | Schnell, 7 Personen, geringe Kosten | Aufwändiger, Prüfverband, Satzung, Geschäftsplan |
| **Passt zu** | Ehrenamt, Community, Fördermittel | Infrastruktur mit Beteiligung: Wer Kapital/Server einbringt, ist Anteilseigner |
| **Haftung** | Vereinsvermögen | Genossenschaftsvermögen, Mitglieder mit Anteil |
| **Wirtschaftlicher Betrieb** | Eingeschränkt (Nebenzweck) | Ausdrücklich vorgesehen |

**Entscheidung:** Start als eingetragener Verein für den Hackathon und die ersten Nodes; Überführung in eine Genossenschaft, sobald echte Mitgliedsbeiträge, Vergütung der Hosting-Mitglieder und Verträge mit Unternehmen ins Spiel kommen. Vorbilder: Freifunk (Verein), Stadtwerke- und Energiegenossenschaften, Hostsharing eG.

### Rollen im Netz
- **Hosting-Mitglieder (Trusted Nodes)** — Stadtwerke, Rechenzentren, IT-Firmen, Uni, Stadt. Stellen Server/VM, Bandbreite, Betrieb. Werden vom Verein zertifiziert und auditiert. Bekommen dafür Mitgestaltung, reduzierte Beiträge oder Vergütung.
- **Normale Mitglieder** — Unternehmen, Vereine, Initiativen, Personen mit Website. Betreiben nichts, nutzen alles.
- **Kernteam / Vorstand** — betreibt Control Plane, DNS, Zertifikate, Sicherheitsregeln, zertifiziert Hosting-Mitglieder.
- **Open-Data-Community** — nutzt den Datensatz (Code for Münster, Stadt, Uni, Presse).

---

## 6. Moat — Warum kann das nicht einfach jemand anderes kopieren?

### Der Münster-Cluster
Der eigentliche Moat ist kein Stück Software, sondern ein **Cluster aus Institutionen, die es nur in Münster gibt und die sich nur hier gegenseitig vertrauen**:

```
   Stadtwerke Münster ──┐
   Rechenzentren in MS ─┤  Trusted Nodes
   IT-Unternehmen MS ───┤  (Infrastruktur)
   Uni / FH Münster ────┘
              │
         ┌────┴────┐
         │ dome.ms │
         └────┬────┘
              │
   Stadt Münster / Citeq ─┐
   IHK / Handwerkskammer ─┤  Multiplikatoren
   Code for Münster ──────┤  (Reichweite, Open Data)
   Vereinsverbände / SSB ─┘
              │
   Bäckerei · Sportverein · Praxis · Initiative · Bürger:innen
                        (Nutzende)
```

Wer das kopieren will, braucht nicht unseren Code — der ist Open Source. Er braucht die Stadtwerke, die Uni, die IHK und 50 Vereine am selben Tisch. Das dauert Jahre, und wer es einmal geschafft hat, hat es für diese Stadt. Ein Konzern aus Kalifornien oder ein Startup aus Berlin bekommt diesen Tisch nicht.

### Weitere Gräben
1. **Vertrauen durch Nähe.** Man weiß, wer den Server betreibt: die Stadtwerke, nicht "die Cloud". Vereinsabend statt Support-Ticket. Ein Konzern kann das nicht nachbauen; ein Startup auch nicht.
2. **Das Netz gehört den Mitgliedern.** Hosting-Mitglieder sind Miteigentümer, normale Mitglieder haben Stimme. Der Anreiz zu wechseln ist gering, der Anreiz mitzubauen hoch. Netzwerkeffekt: Mehr Mitglieder → mehr Nodes → mehr Resilienz → attraktiver für neue Mitglieder.
3. **Lokalität als Feature, nicht als Einschränkung.** Nodes stehen physisch in Münster. Latenz, Datenschutz, Störfestigkeit ("wenn Frankfurt brennt, läuft Münster weiter") — das kann kein globaler Anbieter bieten, weil es seinem Geschäftsmodell widerspricht.
4. **Der Datenschatz.** Die Open-Data-Pipeline entsteht als Nebenprodukt des Hostings. Je mehr Seiten, desto wertvoller der Datensatz — und desto mehr Gründe, mitzumachen (Sichtbarkeit in Stadt-Apps, Kalendern, Karten).
5. **Digitale Souveränität ist politisch gewollt.** DSGVO, NIS2, EU-Cloud-Diskussion, kommunale Digitalstrategien: Der Rückenwind ist da. Ein Anbieter aus Münster für Münster hat bei Stadt, IHK, Handwerkskammer und Fördermitteln einen strukturellen Vorteil.
6. **Einfacher als jeder Baukasten.** Kein WYSIWYG, kein Drag-and-Drop, keine 40 Einstellungsmenüs. Man sagt, was man braucht, und bekommt eine Seite. Wer Inhalte pflegen will, schreibt Text — in Markdown oder direkt im Browser. Jimdo, Wix und Co. sind für Menschen, die Websites *bauen* wollen; dome.ms ist für Menschen, die eine Website *haben* wollen.
7. **Statisch + Markdown = kein Lock-in, aber auch kein Grund zu gehen.** Nutzer können jederzeit mit ihren Daten weg. Genau das schafft das Vertrauen, das sie bleiben lässt.
8. **Blaupause für andere Städte.** `dome.ms` ist der Prototyp; das Modell lässt sich als Föderation ausrollen — jede Stadt mit eigenem Cluster, gemeinsamer Software. Wer zuerst da ist, definiert den Standard.

---

## 7. Abgrenzung

| | Cloudflare | Wix / Jimdo / IONOS | Freifunk | **dome.ms** |
|---|---|---|---|---|
| Eigentum | US-Konzern | Konzern | Verein | Verein / Genossenschaft, lokal |
| Sieht Klartext-Traffic | Ja, weltweit | Ja | Nein (Transport) | Nur zertifizierte Hosting-Mitglieder in Münster (z. B. Stadtwerke), vertraglich gebunden |
| Schutz eigener Server | Ja | Nein | Nein | Ja |
| Website-Erstellung | Nein (Pages: für Devs) | Ja, WYSIWYG-Baukasten, proprietär | Nein | Ja, KI + Markdown, kein Baukasten |
| Bedienung | für Admins | viele Menüs, Drag-and-Drop | — | "Sag, was du brauchst" |
| Datenexport | teilweise | schwierig | — | Vollständig (Markdown/Git) |
| Open Data | Nein | Nein | Nein | Ja, Kernfeature |
| Lokaler Traffic bleibt lokal | Nein | Nein | Ja (WLAN) | Ja (Web) |
| Aus Münster | Nein | Nein | Ja | Ja |

---

## 8. Zielgruppen und Beispiele

- **Der Sportverein** — 300 Mitglieder, Website seit 2016 nicht aktualisiert. Migration per Crawl, Vorstand pflegt Termine künftig in Obsidian oder direkt im Web-Editor. Termine landen automatisch im Open-Data-Kalender der Stadt.
- **Die Bäckerei** — will nur Öffnungszeiten, Filialen, Angebote. KI erstellt die Seite in 10 Minuten. Die Öffnungszeiten sind als strukturierte Daten für Karten-Apps abrufbar.
- **Der Mittelständler mit eigenem Shop** — hat einen Server, wird von Bots geflutet. Protect-Modus: DNS umstellen, fertig. Der Origin ist unsichtbar.
- **Die Bürgerinitiative** — braucht schnell eine Seite für die Unterschriftensammlung, ohne Tracking, ohne Werbung.
- **Die Stadt / Citeq / Uni** — als Node-Betreiber und Open-Data-Konsument.

---

## 9. Hackathon-Scope (MVP für den Münsterhack 2026)

Ziel: **Eine funktionierende End-to-End-Demo mit mindestens zwei echten Nodes.**

- [ ] Control Plane: Account, Website anlegen, Subdomain `xyz.dome.ms` vergeben
- [ ] KI-Assistent: Eingabe "Ich bin ein Kleingartenverein…" → Markdown-Repo mit 4–5 Seiten
- [ ] Theme-Auswahl + statischer Build
- [ ] Verteilung auf zwei Trusted Nodes (z. B. eine VM eines Teammitglieds + eine Cloud-VM in Deutschland; im Pitch als "Stadtwerke-Node" und "Uni-Node" erzählt)
- [ ] TLS automatisch via ACME (Let's Encrypt)
- [ ] Protect-Modus: Eine Demo-Domain zeigt auf den Proxy, WAF blockt einen simulierten Angriff sichtbar
- [ ] Migration: Eine bestehende öffentliche Seite (Demo-Beispiel, ggf. eigene alte Seite eines Teammitglieds) crawlen und als Static Site nachbauen
- [ ] Open-Data-Endpoint: `/opendata/` liefert Öffnungszeiten und Termine aller Demo-Seiten als JSON
- [ ] Dashboard: Welche Nodes sind online, wie viel Traffic wurde lokal beantwortet

**Es ist eine reine Demo.** Noch keine echten Kunden, keine echten Hosting-Partner — aber der Pitch nennt die Wunschpartner beim Namen und zeigt, wie ihr Node aussehen würde.

**Nicht im Hackathon-Scope:** Abrechnung, Vereinsgründung, GeoDNS-Feinheiten, DDoS-Absorption im großen Stil, eigene LLM-Infrastruktur, echte Partnerverträge.

---

## 10. Roadmap (Vorschlag)

| Phase | Zeitraum | Ziel |
|---|---|---|
| **0 — Hackathon** | Herbst 2026 | Demo, Team, erste Interessenten |
| **1 — Pilot** | bis Frühjahr 2027 | 5–10 Nodes, 20–50 Seiten von Vereinen und Kleinunternehmen, Vereinsgründung |
| **2 — Betrieb** | 2027 | Protect-Modus produktiv, Open-Data-Portal öffentlich, Kooperation mit Stadt / Code for Münster |
| **3 — Genossenschaft** | 2028 | Umwandlung, Node-Vergütung, Anbindung Stadtnetz/Glasfaser |
| **4 — Föderation** | ab 2028 | Modell für andere Städte, gemeinsame Software, getrennte Netze |

---

## 11. Offene Fragen und Risiken

### Bereits entschieden
- **TLS-Terminierung:** Nur zertifizierte Hosting-Mitglieder (Trusted Nodes) terminieren TLS und sehen Klartext. Normale Mitglieder betreiben keine Nodes. Offen bleibt: Wollen wir zusätzlich Keyless-TLS (privater Schlüssel bleibt beim Verein, Node signiert nur), um selbst Hosting-Mitglieder nicht mit Schlüsselmaterial auszustatten?
- **"Münster zuerst", kein Geo-Blocking:** Lokale Anfragen werden priorisiert, niemand wird ausgesperrt. Erkennung über Netz-Nähe und Bot-Erkennung, nicht über reines GeoIP.
- **Rechtsform:** Erst e. V., später eG.

### Technisch offen
- **DDoS-Absorption:** Auch Stadtwerke-Anschlüsse absorbieren keine 100 Gbit/s. Realistisch: Schutz gegen Bots, Scanner, Layer-7-Angriffe, kleine Floods. Für große Angriffe braucht es Upstream-Partner (Stadtnetz, Rechenzentrum, Peering).
- **Zertifizierung von Hosting-Mitgliedern:** Welche Mindestanforderungen (Verfügbarkeit, Standort, Patch-Stand, Zugangskontrolle)? Wer prüft, wie oft?
- **Node-Ausfälle:** DNS-Health-Checks + Redundanz über mindestens drei Hosting-Mitglieder.
- **Konsistenz:** Statische Builds sind einfach zu replizieren — das ist der große Vorteil gegenüber dynamischem Hosting.
- **Name und Domain:** `.ms` ist die Länderdomain von Montserrat — Verfügbarkeit, Preis und Registrierungsregeln vor dem Hackathon klären. Der Name ist ein Arbeitstitel und kann sich ändern; Kriterien: kurz, tippbar, erkennbar münsterisch, Domain sicher besitzbar.

### Rechtlich / organisatorisch
- **Haftung für Inhalte:** Wer haftet, wenn ein Mitglied rechtswidrige Inhalte hostet? Nutzungsbedingungen, Notice-and-Takedown, Impressumspflicht durchsetzen.
- **Auftragsverarbeitung:** Im Protect-Modus fließen personenbezogene Daten durch Mitglieder-Nodes → AV-Verträge, TOMs, Node-Betreiber-Vereinbarung.
- **Open Data:** Opt-in, nicht Opt-out. Was genau wird veröffentlicht? Lizenz (CC0 / CC-BY / DL-DE)?
- **Finanzierung:** Mitgliedsbeiträge, gestaffelt (Privat / Verein / Unternehmen), Fördermittel (Stadt, Land NRW, prototype fund), Sponsoring durch lokale IT-Firmen.

### Wettbewerb / Adoption
- Warum sollte ein Verein von einem funktionierenden Jimdo wechseln? → Migration muss **schmerzfrei** und der Mehrwert (Sichtbarkeit via Open Data, Sicherheit, "gehört uns") **sichtbar** sein.
- Wer betreut die Nutzer? → Community-Support, Sprechstunden, ggf. Partner-Agenturen als "zertifizierte Helfer".

---

## 12. Werte

- **Souverän:** Unsere Server, unsere Regeln, unsere Daten.
- **Offen:** Open Source, Open Data, offene Formate (Markdown, Git).
- **Lokal:** Für Münster, in Münster, von Münsteranern.
- **Einfach:** Eine Website in 10 Minuten — für Menschen, nicht für Admins.
- **Gemeinschaftlich:** Kein Kunde, sondern Mitglied.

---

## 13. Glossar

- **Trusted Node** — Ein Server oder eine VM eines zertifizierten Hosting-Mitglieds (z. B. Stadtwerke), der Teil des dome.ms-Netzes ist.
- **Hosting-Mitglied** — Organisation, die Trusted Nodes betreibt und dafür vom Verein zertifiziert wird.
- **Normales Mitglied** — Nutzer:in des Netzes ohne eigene Infrastruktur.
- **Origin** — Der eigene Server eines Mitglieds, der im Protect-Modus hinter dome.ms versteckt wird.
- **Reverse-Proxy** — Ein Server, der Anfragen entgegennimmt und an den eigentlichen Zielserver weiterleitet.
- **WAF** — Web Application Firewall; filtert bösartige HTTP-Anfragen.
- **Static Site** — Website aus fertigen HTML-Dateien ohne Datenbank oder serverseitige Logik.
- **Control Plane** — Zentrale Steuerung: Konfiguration, Zertifikate, Verteilung.
- **Keep Local Traffic Local** — Anfragen aus Münster werden in Münster beantwortet.

---

## 14. User Story: Der TSV Gievenbeck 1926 bekommt eine neue Website

> Erzählt aus Sicht von Petra, 58, Kassenwartin eines (fiktiven) Sportvereins mit 340 Mitgliedern. Sie hat keine IT-Kenntnisse, aber sie hat ein Problem.

### Montag — das Problem
Die Vereinswebsite ist seit Freitag nicht mehr erreichbar. Der Hoster hat den Vertrag gekündigt, weil die alte WordPress-Installation Spam verschickt hat. Der Mann, der die Seite 2017 gebaut hat, ist vor drei Jahren nach Stuttgart gezogen. Petra hat die Zugangsdaten nie gehabt. Auf der Vorstandssitzung heißt es: "Dann nehmen wir halt Jimdo." Petra probiert es abends aus, gibt nach 40 Minuten auf — zu viele Menüs, und wo kommt der Trainingsplan hin?

### Dienstag — der Tipp
Beim Stadtsportbund erzählt ihr jemand von dome.ms: "Das ist von den Stadtwerken und der Uni, das ist hier aus Münster. Du musst da nichts bauen, du musst nur sagen, was du brauchst."

### Dienstagabend — 20 Minuten
1. Petra legt einen Account an. Sie wählt `tsv-gievenbeck.dome.ms` — die alte Domain `tsv-gievenbeck.de` kann sie später umziehen, wenn sie den Zugang zum Domain-Anbieter wiedergefunden hat.
2. Sie klickt "Website erstellen" und tippt: *„Wir sind der TSV Gievenbeck 1926, Sportverein mit Fußball, Handball, Turnen und Seniorengymnastik. Wir brauchen eine Seite mit Trainingszeiten, Ansprechpartnern der Abteilungen, Beitrittsformular als PDF, Termine und einen Bereich für Vereinsnachrichten."*
3. Der Assistent fragt zwei Dinge nach: Adresse der Sporthalle und ob es ein Logo gibt. Petra lädt das Logo hoch.
4. Nach 30 Sekunden steht ein Entwurf: Startseite, Abteilungen, Trainingszeiten (als Tabelle, noch mit Platzhaltern), Kontakt, Termine, Aktuelles. Petra wählt das Theme "Klar" mit den Vereinsfarben.
5. Sie öffnet die Seite "Trainingszeiten" im Browser-Editor. Es ist einfach Text — eine Tabelle, die sie ausfüllt wie in Word. Sie speichert. Die Seite ist live.
6. Unten auf jeder Seite steht "Betrieben von dome.ms — gehostet in Münster." Petra findet das gut.

### Mittwoch — die alte Seite
Ein Vorstandskollege hat eine Kopie der alten Seite im Browser-Cache. Petra gibt die alte URL in "Website migrieren" ein. dome.ms crawlt, was das Web-Archiv noch hat, und baut daraus Vorschläge: die Vereinschronik, 14 alte Nachrichtenartikel, die Satzung als PDF. Petra übernimmt die Chronik und die Satzung, den Rest verwirft sie.

### Donnerstag — der Nebeneffekt
Beim Anlegen der Termine hat dome.ms gefragt: *"Sollen deine öffentlichen Termine und Trainingszeiten im Open-Data-Portal Münster erscheinen? Dann tauchen sie z. B. im Veranstaltungskalender der Stadt und in Sport-Apps auf."* Petra hat "Ja" gesagt. Am Donnerstag ruft eine Mutter an: Sie hat die Seniorengymnastik im Stadtkalender gefunden — für ihre Schwiegermutter.

### Ein Jahr später
- Die Domain `tsv-gievenbeck.de` zeigt jetzt auf dome.ms.
- Petras Nachfolgerin bekommt den Zugang per Übergabe im Vereinskonto — keine Zugangsdaten in irgendjemandes Kopf.
- Der Verein ist Mitglied im dome.ms e. V. und zahlt 5 € im Monat. Dafür haben sie eine Website, die nicht gehackt wird, nicht verschwindet und niemandem gehört außer dem Verein.
- Als jemand fragt, ob man nicht doch zu Jimdo sollte, sagt Petra: "Warum? Unsere Seite läuft bei den Stadtwerken."

---

### Weitere Stories (Kurzform)

**Der Mittelständler — Protect-Modus**
*Als* Betreiber eines Online-Shops mit eigenem Server in Münster
*möchte ich* meinen Server hinter dome.ms verstecken,
*damit* Bots und Scanner meinen Shop nicht mehr lahmlegen und meine Kunden nicht durch ein US-Rechenzentrum geleitet werden.
→ Er ändert zwei DNS-Einträge. Zehn Minuten später ist der Origin unsichtbar, im Dashboard sieht er: 83 % der Anfragen kamen aus Münster und wurden von Münsteraner Nodes beantwortet; 4.200 Bot-Requests wurden geblockt.

**Die Bäckerei — Website in 10 Minuten**
*Als* Inhaberin einer Bäckerei mit drei Filialen
*möchte ich* eine Seite mit Öffnungszeiten, Filialen und Wochenangeboten,
*damit* Kunden mich finden, ohne dass ich eine Agentur bezahle.
→ Sie diktiert die Öffnungszeiten ins Handy. Die Öffnungszeiten liegen als strukturierte Daten vor und erscheinen in Karten-Apps korrekt — auch an Feiertagen, weil sie die Ausnahmen einmal eingetragen hat.

**Die Stadtwerke — Hosting-Mitglied**
*Als* kommunales Unternehmen mit eigenem Rechenzentrum
*möchte ich* zwei VMs als Trusted Nodes bereitstellen,
*damit* wir sichtbar Träger der digitalen Infrastruktur Münsters sind und Vereine wie Unternehmen der Stadt einen Grund haben, ihre Daten hier zu lassen.
→ Der Node-Agent wird installiert, die Control Plane verteilt Konfiguration und Builds. Das Rechenzentrums-Team sieht im Dashboard, welche Seiten auf ihren Nodes liegen und wie viel Traffic sie beantworten.

**Code for Münster — Open Data**
*Als* Entwicklerin bei Code for Münster
*möchte ich* alle öffentlichen Termine und Öffnungszeiten der Stadt als eine JSON-API abrufen,
*damit* wir einen Stadtkalender bauen können, der nicht nach drei Monaten veraltet ist.
→ `GET https://opendata.dome.ms/events?district=gievenbeck` liefert die Termine aller Vereine, die zugestimmt haben — aktuell, weil sie direkt aus den gepflegten Websites kommen.
