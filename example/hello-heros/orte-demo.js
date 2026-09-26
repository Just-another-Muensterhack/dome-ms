/* ORTSDATEN (Stand der Recherche: 26.09.2026)
   Die Angaben beruhen auf Eigenauskünften der Betriebe bzw. Museen (Websites, Hausordnung), nicht auf eigener
   Begehung. Nichts davon ist vor Ort geprüft. Nicht belegte Angaben bleiben offen ("unbekannt").
   Quellen stehen je Ort. Es bestehen keine Kooperationen oder Freigaben der Betriebe.
   Als klassisches Script (kein fetch/Modul), damit die Seite auch per Doppelklick (file://) läuft. */

window.HH_STAND = "2026-09-26";

window.HH_BEREICHE = ["Übernachten", "Gastronomie", "Kultur", "Freizeit"];

/* Merkmale, gruppiert für den Filter. "hilfe" erklärt Fachbegriffe in einfacher Sprache. */
window.HH_MERKMALE = [
  { key: "stufenlos", gruppe: "Zugang", label: "Stufenloser Eingang", hilfe: "Man kommt ohne Stufen hinein." },
  { key: "aufzug", gruppe: "Zugang", label: "Aufzug", hilfe: "Ein Lift zu anderen Etagen." },
  { key: "parkplatz", gruppe: "Zugang", label: "Behindertenparkplatz", hilfe: "Ein breiter, reservierter Parkplatz." },
  { key: "ausstellung", gruppe: "Zugang", label: "Ausstellung im Rollstuhl zugänglich", hilfe: "Man kann sich im Rollstuhl durch die Ausstellung bewegen." },
  { key: "rollstuhlplaetze", gruppe: "Zugang", label: "Rollstuhlplätze", hilfe: "Reservierte Plätze für Rollstuhlnutzende, zum Beispiel im Planetarium." },
  { key: "wc_ebenerdig", gruppe: "WC", label: "Ebenerdiges WC", hilfe: "Ein WC ohne Treppe. Es ist nicht automatisch rollstuhlgerecht." },
  { key: "wc_rollstuhl", gruppe: "WC", label: "Rollstuhlgerechtes WC", hilfe: "Ein WC mit viel Platz und Haltegriffen." },
  { key: "zimmer", gruppe: "Übernachten", label: "Barrierefreies Zimmer", hilfe: "Ein Zimmer ohne Treppen, mit angepasstem Bad." },
  { key: "zimmer_wc", gruppe: "Übernachten", label: "WC mit Stützgriffen im Zimmer", hilfe: "Griffe am WC, die man hochklappen kann." },
  { key: "leihrollstuhl", gruppe: "Ausleihe und Sinne", label: "Leihrollstühle", hilfe: "Rollstühle zum Ausleihen vor Ort." },
  { key: "taktil", gruppe: "Ausleihe und Sinne", label: "Taktile Orientierungspläne", hilfe: "Pläne zum Ertasten, zum Beispiel für blinde Menschen." },
  { key: "induktion", gruppe: "Ausleihe und Sinne", label: "Induktionsschleife oder Höranlage", hilfe: "Hilft Menschen mit Hörgerät, Ton klarer zu hören." },
  { key: "sehangebote", gruppe: "Ausleihe und Sinne", label: "Angebote für blinde oder sehbehinderte Menschen", hilfe: "Zum Beispiel Tastobjekte, Führungen oder Texte in Braille." }
];

/* Status je Merkmal, optionaler Hinweis als zweiter Wert:
   "ja"             vorhanden (laut Betrieb)
   "nein"           nicht vorhanden
   "eingeschraenkt" nur mit Einschränkungen (Hinweis erklärt sie)
   "unbekannt"      nicht erfasst oder nicht belegt. Das bedeutet NICHT "nein".
   Fehlt ein Merkmal bei einem Ort, gilt es als "unbekannt" und wird in der Detailtabelle nicht aufgeführt. */
window.HH_ORTE = [
  {
    id: "atlantic-hotel-muenster", name: "ATLANTIC Hotel Münster", typ: "Hotel (auch Restaurant)",
    bereiche: ["Übernachten", "Gastronomie"], region: "Münster",
    adresse: "Engelstraße 39, 48143 Münster",
    kurztext: "Hotel mit stufenlosen Zugängen und einem eigens ausgestatteten barrierefreien Zimmer. Details und Verfügbarkeit direkt beim Hotel erfragen.",
    website: "https://www.atlantic-hotels.de/hotel-muenster/",
    quellen: [{ label: "Barrierefreies Zimmer (Website des Hotels)", url: "https://www.atlantic-hotels.de/hotel-muenster/zimmer-suiten/zimmer-barrierefrei0/" }],
    kontakt: [
      { label: "Telefon", text: "+49 251 20800-0", href: "tel:+49251208000" },
      { label: "Zimmerreservierung", text: "+49 251 20800-555", href: "tel:+492512080555" },
      { label: "E-Mail Reservierung", text: "reservierung.ahm@atlantic-hotels.de", href: "mailto:reservierung.ahm@atlantic-hotels.de" }
    ],
    bild: "sea",
    nachfragen: "Verfügbarkeit des barrierefreien Zimmers direkt anfragen.",
    merkmale: {
      stufenlos: ["ja", "Stufenlose Eingänge und breite Zugänge, laut Hotel."],
      aufzug: ["ja", "Aufzüge, laut Hotel."],
      zimmer: ["ja", "Ein 28 m² großes Zimmer, ohne Treppen erreichbar, mit Duschhocker und Notrufknopf."],
      zimmer_wc: ["ja", "Hochklappbare Stützgriffe."]
    },
    hindernisse: [],
    hinweise: [
      "Restaurant und Lobby sind laut Hotel barrierefrei erreichbar.",
      "Das barrierefreie Zimmer ist ein einzelnes Zimmer. Verfügbarkeit bitte direkt anfragen. Für die anderen Zimmer gibt es keine Aussage."
    ]
  },
  {
    id: "pension-schmidt", name: "Pension Schmidt", typ: "Café, Bar und Kultur",
    bereiche: ["Gastronomie", "Kultur"], region: "Münster",
    adresse: "Alter Steinweg 37, 48143 Münster",
    kurztext: "Café, Bar und Kulturort. Am Eingang liegt eine etwa 6 cm hohe Stufe; das ebenerdige WC hat einen engen, verwinkelten Zugang. Bitte Anforderungen vor dem Besuch abgleichen.",
    website: "https://www.pensionschmidt.se/",
    quellen: [
      { label: "Barrierefreiheit (Website des Betriebs)", url: "https://www.pensionschmidt.se/barrierefreiheit" },
      { label: "Kontakt (klärt, dass es kein Hotel ist)", url: "https://www.pensionschmidt.se/kontakt" }
    ],
    kontakt: [
      { label: "E-Mail", text: "hallo@pensionschmidt.se", href: "mailto:hallo@pensionschmidt.se" },
      { label: "Tischreservierung", text: "über die Website des Betriebs", href: "https://www.pensionschmidt.se/" }
    ],
    bild: "rose",
    merkmale: {
      stufenlos: ["nein", "Etwa 6 cm hohe Stufe am Eingang. Außen- und Eingangsbereich sind glatt und eben gepflastert. Die Tür ist etwa 1 m breit und auf 1,9 m zu öffnen."],
      wc_ebenerdig: ["eingeschraenkt", "Türrahmen unter 90 cm breit und verwinkelter Zugang. Laut Betrieb nur mit kleinem Rollstuhl oder Gehhilfen erreichbar."],
      wc_rollstuhl: ["unbekannt", "Vom Betrieb nicht bestätigt."]
    },
    hindernisse: [
      "Etwa 6 cm hohe Stufe am Eingang.",
      "Die Toiletten im Keller sind nur über eine Treppe erreichbar.",
      "Das ebenerdige WC ist wegen eines Türrahmens unter 90 cm und eines verwinkelten Zugangs laut Betrieb nur mit kleinem Rollstuhl oder Gehhilfen erreichbar.",
      "Der Alte Steinweg hat Kopfsteinpflaster."
    ],
    hinweise: [
      "Kein Hotel: „Pension“ ist nur ein Teil des Namens.",
      "Der Gastraum hat sonst keine Stufen, die Gänge sind etwa 1,2 m breit.",
      "Bei Veranstaltungen kann eine Begleitperson bei Behinderung kostenlos mitkommen."
    ]
  },
  {
    id: "spatzl-wirtshaus-muenster", name: "Spatzl Wirtshaus Münster", typ: "Restaurant und Biergarten",
    bereiche: ["Gastronomie"], region: "Münster",
    adresse: "Am Stadtgraben 52, 48143 Münster",
    kurztext: "Bayerisches Wirtshaus mit Biergarten am Aasee. Informationen zu Eingang, erreichbaren Bereichen und WC werden noch abgeklärt.",
    website: "https://www.spatzl-wirtshaus.de/",
    quellen: [{ label: "Website des Betriebs", url: "https://www.spatzl-wirtshaus.de/" }],
    kontakt: [
      { label: "Telefon", text: "+49 251 46387", href: "tel:+4925146387" },
      { label: "E-Mail", text: "info@spatzl-wirtshaus.de", href: "mailto:info@spatzl-wirtshaus.de" }
    ],
    bild: "sun",
    merkmale: {
      stufenlos: ["unbekannt", "Auf der Website nicht angegeben."],
      aufzug: ["unbekannt", "Die Gasträume liegen auf zwei Etagen. Ob und wie sie erreichbar sind, ist nicht angegeben."],
      wc_rollstuhl: ["unbekannt", "Auf der Website nicht angegeben."]
    },
    hindernisse: [],
    hinweise: [
      "Bayerische Küche, Gasträume auf zwei Etagen und Biergarten mit Blick auf den Aasee.",
      "Die Website macht keine belastbare Angabe zu Zugang, erreichbarem Geschoss oder WC. Zwei Etagen belegen für sich weder Zugänglichkeit noch Unzugänglichkeit."
    ]
  },
  {
    id: "heaven-beach-muenster", name: "Heaven Beach Münster", typ: "Freizeit und Open-Air-Events",
    bereiche: ["Freizeit"], region: "Münster",
    adresse: "Am Hawerkamp 29a, 48155 Münster",
    adresseHinweis: "Adresse laut Veranstaltungsseite des Betreibers.",
    kurztext: "Open-Air-Events am Heaven Beach. Angaben zu Zugang und Sanitäranlagen des Beach werden noch geprüft; bitte vor dem Besuch direkt anfragen.",
    website: "https://heaven-muenster.de/beach/",
    quellen: [
      { label: "Veranstaltungsseite des Betreibers (Adresse)", url: "https://heaven-muenster.de/event/aperol-sunday-vibes-2/" },
      { label: "AGB und Hausordnung (Clubbetrieb)", url: "https://heaven-muenster.de/agb/" }
    ],
    kontakt: [{ label: "Kontaktseite des Betreibers", text: "heaven-muenster.de/kontakt", href: "https://heaven-muenster.de/kontakt/" }],
    bild: "leaf",
    merkmale: {
      stufenlos: ["unbekannt", "Für den Beach nicht gesichert."],
      wc_rollstuhl: ["unbekannt", "Für den Beach nicht gesichert."]
    },
    hindernisse: [
      "Für den Clubbetrieb nennt die Hausordnung die Sanitäreinrichtungen als nicht barrierefrei. Das gilt nicht automatisch für den Beach und wird hier nicht auf ihn übertragen."
    ],
    hinweise: [
      "Open-Air-Events mit Musik am Wasser. Die Termine variieren.",
      "Beach und Club sind getrennt zu betrachten. Bitte beim Betreiber für den jeweiligen Bereich einzeln nachfragen."
    ]
  },
  {
    id: "lwl-museum-kunst-kultur", name: "LWL-Museum für Kunst und Kultur", typ: "Museum",
    bereiche: ["Kultur"], region: "Münster",
    adresse: "Domplatz 10, 48143 Münster",
    kurztext: "Museum am Domplatz. Laut Museum sind beide Eingänge barrierefrei zu erreichen und es gibt rollstuhlgerechte Toiletten auf allen Etagen. Kostenlose Leihrollstühle, taktile Orientierungspläne und Angebote für Menschen mit Hör- oder Sehbehinderung ergänzen den Besuch.",
    website: "https://www.lwl-museum-kunst-kultur.de/",
    quellen: [{ label: "Barrierefreiheit und Inklusion (Website des Museums)", url: "https://www.lwl-museum-kunst-kultur.de/de/besuch/inklusiverbesuch/" }],
    kontakt: [
      { label: "E-Mail Besucherbüro", text: "besucherbuero@lwl.org", href: "mailto:besucherbuero@lwl.org" },
      { label: "Telefon", text: "0251-5907 201", href: "tel:+492515907201" }
    ],
    bild: "sky",
    merkmale: {
      stufenlos: ["ja", "Laut Museum sind beide Eingänge barrierefrei zu erreichen."],
      parkplatz: ["ja", "Öffentliche Behindertenparkplätze am Domplatz und im Parkhaus Aegidiimarkt."],
      wc_rollstuhl: ["ja", "Auf allen Etagen."],
      leihrollstuhl: ["ja", "Kostenlos an der Kasse."],
      taktil: ["ja", "In allen Etagen."],
      induktion: ["ja", "Induktionsschleifen und eine induktive Höranlage."],
      sehangebote: ["ja", "Kurzführer in Braille und Lesetasthörbuch, an der Kasse zum Ausleihen."]
    },
    hindernisse: [],
    hinweise: ["Mediaguides mit Videos in Gebärdensprache gibt es an der Kasse zum Ausleihen."]
  },
  {
    id: "lwl-museum-naturkunde", name: "LWL-Museum für Naturkunde mit Planetarium", typ: "Museum mit Planetarium",
    bereiche: ["Kultur", "Freizeit"], region: "Münster",
    adresse: "Sentruper Straße 285, 48161 Münster",
    kurztext: "Naturkundemuseum mit Planetarium. Laut Museum ist die Ausstellungsfläche für Rollstuhlnutzende zugänglich. Es gibt Leihrollstühle, rollstuhlgerechte Toiletten (über eine Rampe erreichbar) sowie Rollstuhlplätze und eine Induktionsschleife im Planetarium. Wegen Bauarbeiten wurde der Eingang verlegt.",
    website: "https://www.lwl-naturkundemuseum-muenster.de/",
    quellen: [
      { label: "Barrierefreiheit (Website des Museums)", url: "https://www.lwl-naturkundemuseum-muenster.de/de/mein-besuch/menschen-mit-behinderungen/" },
      { label: "Aktuelle Besuchsinformationen (Website des Museums)", url: "https://www.lwl-naturkundemuseum-muenster.de/de/besucherservice/uebersicht-besuch/" }
    ],
    kontakt: [
      { label: "E-Mail Servicebüro", text: "servicebuero.naturkundemuseum@lwl.org", href: "mailto:servicebuero.naturkundemuseum@lwl.org" },
      { label: "Telefon", text: "0251 591-6050", href: "tel:+492515916050" }
    ],
    bild: "leaf",
    nachfragen: "Wegen Bauarbeiten wurde der Eingang verlegt. Aktuelle Besuchsinformationen prüfen.",
    merkmale: {
      stufenlos: ["eingeschraenkt", "Der Eingang ist ebenerdig, hat laut Museum aber eine kleine Schwelle. Wegen Bauarbeiten wurde der Eingang verlegt."],
      parkplatz: ["ja", "Behindertenparkplätze auf dem Zoo-Parkplatz vor dem Museum."],
      ausstellung: ["ja", "Laut Museum ist die gesamte Ausstellungsfläche für Rollstuhlfahrende barrierefrei gestaltet."],
      rollstuhlplaetze: ["ja", "Im Planetarium."],
      wc_rollstuhl: ["ja", "Über eine Rampe erreichbar. Laut Besuchsübersicht im Außenbereich."],
      leihrollstuhl: ["ja", "Kostenlos an der Kasse."],
      taktil: ["ja", "Taktiler Orientierungsplan zur Ausstellung „Gene“ und Tastobjekte in den Ausstellungen."],
      induktion: ["ja", "Im Planetarium, auf allen Plätzen nutzbar."],
      sehangebote: ["ja", "Führung „Tastend durch die Genetik“ für blinde und sehbehinderte Menschen, individuell buchbar."]
    },
    hindernisse: [
      "Wegen Bauarbeiten wurde der Museumseingang verlegt. Der neue Eingang liegt laut Museum etwa 200 Meter vom Behindertenparkplatz entfernt. Die Seite in Leichter Sprache nennt „mehrere hundert Meter“.",
      "Am ebenerdigen Eingang gibt es eine kleine Schwelle."
    ],
    hinweise: ["Die Baustellenlage kann sich ändern. Bitte aktuelle Besuchsinformationen beim Museum prüfen."]
  }
];
