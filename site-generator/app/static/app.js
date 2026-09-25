"use strict";

const KATEGORIEN = [
  {
    id: "verein",
    icon: "⚽",
    titel: "Verein",
    info: "Sport, Kultur, Ehrenamt",
    angebote: "Abteilungen und Angebote",
    beispiel: "z. B. Fußball Jugend",
    zeiten: "Trainingszeiten und Termine",
  },
  {
    id: "unternehmen",
    icon: "🏢",
    titel: "Unternehmen",
    info: "Dienstleistung, Beratung",
    angebote: "Leistungen",
    beispiel: "z. B. Steuerberatung für Gründer",
    zeiten: "Bürozeiten",
  },
  {
    id: "praxis",
    icon: "🩺",
    titel: "Praxis",
    info: "Arzt, Therapie, Coaching",
    angebote: "Leistungen",
    beispiel: "z. B. Physiotherapie",
    zeiten: "Sprechzeiten",
  },
  {
    id: "gastronomie",
    icon: "🍽️",
    titel: "Gastronomie",
    info: "Café, Restaurant, Catering",
    angebote: "Speisen und Angebote",
    beispiel: "z. B. Mittagstisch",
    zeiten: "Öffnungszeiten",
  },
  {
    id: "handwerk",
    icon: "🔨",
    titel: "Handwerk",
    info: "Betrieb, Werkstatt",
    angebote: "Leistungen",
    beispiel: "z. B. Badsanierung",
    zeiten: "Öffnungszeiten",
  },
  {
    id: "sonstiges",
    icon: "✨",
    titel: "Etwas anderes",
    info: "Projekt, Initiative",
    angebote: "Angebote",
    beispiel: "z. B. Workshops",
    zeiten: "Zeiten",
  },
];
const STILE = [
  { id: "klar", titel: "Klar", info: "Ruhig und hochwertig, dunkler Einstieg" },
  { id: "warm", titel: "Warm", info: "Freundlich, Serifen und Fotoabzüge" },
  { id: "modern", titel: "Modern", info: "Laut, große Schrift, volle Farbe" },
];
const FARBEN = [
  "#2f6f4f",
  "#1f4e8c",
  "#b3261e",
  "#c26a00",
  "#6b3fa0",
  "#0f766e",
  "#374151",
  "#be185d",
];
const VORSCHLAEGE = [
  "Kürzere Texte",
  "Lockerer formulieren",
  "Mehr zum Mitmachen",
  "Farbe dunkler",
  "Stil: warm",
];
const ABLAUF = ["start", "1", "2", "3", "4", "5"];
const LETZTER = "5";
const MAX_BILDER = 6;
const ENTWURF_KEY = "website-assistent-entwurf";

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const form = $("#fragebogen");
const zustand = {
  ansicht: "start",
  kategorie: "",
  stil: "klar",
  angebote: [],
  site: null,
  logo: null, // { upload_id, url, farbvorschlag }
  bilder: [], // { upload_id, url, beschreibung } oder { laeuft: true }
};

// --- Aufbau ---------------------------------------------------------------------------------

function kachel(gruppe, eintrag, inhalt) {
  const b = document.createElement("button");
  b.type = "button";
  b.className = "kachel";
  b.setAttribute("role", "radio");
  b.setAttribute("aria-checked", "false");
  b.dataset.wert = eintrag.id;
  b.append(...inhalt);
  b.addEventListener("click", () => waehlen(gruppe, eintrag.id));
  return b;
}

function el(tag, klasse, text) {
  const e = document.createElement(tag);
  if (klasse) e.className = klasse;
  if (text) e.textContent = text;
  return e;
}

function aufbauen() {
  const kat = $("#kategorien");
  kat.setAttribute("role", "radiogroup");
  for (const k of KATEGORIEN) {
    kat.append(
      kachel("kategorie", k, [
        el("span", "icon", k.icon),
        document.createTextNode(k.titel),
        el("small", "", k.info),
      ]),
    );
  }
  const stile = $("#stile");
  stile.setAttribute("role", "radiogroup");
  for (const s of STILE) {
    // Mini-Vorschau des Stils, aufgebaut aus leeren Spans, gestaltet per CSS
    const muster = el("span", `stil-muster stil-muster--${s.id}`);
    muster.setAttribute("aria-hidden", "true");
    for (const teil of ["a", "b", "c", "d"]) muster.append(el("i", `m-${teil}`));
    stile.append(
      kachel("stil", s, [
        muster,
        document.createTextNode(s.titel),
        el("small", "", s.info),
      ]),
    );
  }
  const farben = $("#farben");
  farben.setAttribute("role", "radiogroup");
  for (const f of FARBEN) {
    const b = el("button", "farbe");
    b.type = "button";
    b.style.background = f;
    b.dataset.wert = f;
    b.setAttribute("role", "radio");
    b.setAttribute("aria-label", `Farbe ${f}`);
    b.addEventListener("click", () => farbeSetzen(f));
    farben.append(b);
  }
  const vorschlaege = $("#vorschlaege");
  for (const v of VORSCHLAEGE) {
    const b = el("button", "", v);
    b.type = "button";
    b.addEventListener("click", () => {
      const a = $("#anweisung");
      a.value = a.value ? `${a.value.replace(/\.?$/, ".")} ${v}.` : `${v}.`;
      a.focus();
    });
    vorschlaege.append(b);
  }
}

// --- Auswahl --------------------------------------------------------------------------------

function waehlen(gruppe, wert) {
  zustand[gruppe] = wert;
  const box = gruppe === "kategorie" ? $("#kategorien") : $("#stile");
  for (const b of $$(".kachel", box))
    b.setAttribute("aria-checked", String(b.dataset.wert === wert));
  if (gruppe === "kategorie") {
    fehlerFeldWeg(box);
    texteFuerKategorie();
  }
  farbeSetzen(form.farbe.value);
  speichern();
}

function farbeSetzen(f) {
  form.farbe.value = f;
  for (const b of $$(".farbe"))
    b.setAttribute("aria-checked", String(b.dataset.wert === f));
  for (const m of $$(".stil-muster")) m.style.setProperty("--muster", f);
  if (!zustand.logo?.url) logoVorschau();
  speichern();
}

function texteFuerKategorie() {
  const k = KATEGORIEN.find((x) => x.id === zustand.kategorie) || KATEGORIEN[0];
  $("#angebote-titel").textContent = `${k.angebote}`;
  $("#angebote-label").textContent =
    `${k.angebote} als Stichpunkte, mit Enter hinzufügen (bis zu 8)`;
  $("#tag-eingabe").placeholder = k.beispiel;
  $("#zeiten-label").firstChild.textContent = `${k.zeiten} `;
}

// --- Angebote als Tags ----------------------------------------------------------------------

function tagsZeichnen() {
  const box = $("#tags");
  const eingabe = $("#tag-eingabe");
  $$(".tag", box).forEach((t) => t.remove());
  zustand.angebote.forEach((a, i) => {
    const t = el("span", "tag", a);
    const x = el("button", "", "×");
    x.type = "button";
    x.setAttribute("aria-label", `${a} entfernen`);
    x.addEventListener("click", () => {
      zustand.angebote.splice(i, 1);
      tagsZeichnen();
      speichern();
    });
    t.append(x);
    box.insertBefore(t, eingabe);
  });
  eingabe.disabled = zustand.angebote.length >= 8;
}

function tagHinzufuegen() {
  const e = $("#tag-eingabe");
  const wert = e.value.trim().replace(/,$/, "");
  if (wert && zustand.angebote.length < 8 && !zustand.angebote.includes(wert)) {
    zustand.angebote.push(wert);
    tagsZeichnen();
    speichern();
  }
  e.value = "";
}

// --- Navigation -----------------------------------------------------------------------------

function zeigen(ansicht) {
  zustand.ansicht = ansicht;
  for (const s of $$(".ansicht"))
    s.classList.toggle("aktiv", s.dataset.ansicht === ansicht);
  const idx = ABLAUF.indexOf(ansicht);
  const imFragebogen = idx >= 1;
  $("#navigation").hidden = !imFragebogen;
  $("[data-ueberspringen]").hidden = !(idx >= 2);
  $("#navigation [data-weiter]").textContent =
    ansicht === LETZTER ? "Website erstellen" : "Weiter";
  const prozent = {
    start: 0,
    1: 10,
    2: 28,
    3: 46,
    4: 64,
    5: 82,
    laden: 95,
    ergebnis: 100,
  }[ansicht];
  $("#balken").style.width = `${prozent}%`;
  $("#schritt-info").textContent = imFragebogen
    ? `Schritt ${ansicht} von 5`
    : ansicht === "ergebnis"
      ? "Fertig"
      : "";
  window.scrollTo({ top: 0, behavior: "smooth" });
  const erstes = $(
    `.ansicht[data-ansicht="${ansicht}"] input, .ansicht[data-ansicht="${ansicht}"] textarea`,
  );
  if (imFragebogen && erstes && window.matchMedia("(min-width: 700px)").matches)
    erstes.focus({ preventScroll: true });
}

function weiter(pruefen = true) {
  const idx = ABLAUF.indexOf(zustand.ansicht);
  // Bildrechte lassen sich nicht überspringen, sobald etwas hochgeladen ist.
  const pflicht = pruefen || (zustand.ansicht === "3" && hatBilder());
  if (pflicht && !schrittGueltig(zustand.ansicht)) return;
  if (zustand.ansicht === LETZTER) return erstellen();
  zeigen(ABLAUF[idx + 1]);
}

function zurueck() {
  const idx = ABLAUF.indexOf(zustand.ansicht);
  if (idx > 0) zeigen(ABLAUF[idx - 1]);
}

// --- Prüfung, spiegelt die Regeln im Backend ------------------------------------------------

function fehlerFeld(feld, text) {
  feld.classList.add("ungueltig");
  const hinweis = el("p", "feld-fehler", text);
  hinweis.dataset.fuer = feld.name || feld.id;
  (feld.closest(".feld") || feld.parentElement).append(hinweis);
}

function fehlerFeldWeg(feld) {
  feld.classList.remove("ungueltig");
  $$(".feld-fehler", feld.closest(".feld") || feld.parentElement).forEach((h) => h.remove());
}

function schrittGueltig(schritt) {
  $$(`.ansicht[data-ansicht="${schritt}"] .feld-fehler`).forEach((h) =>
    h.remove(),
  );
  $$(`.ansicht[data-ansicht="${schritt}"] .ungueltig`).forEach((h) =>
    h.classList.remove("ungueltig"),
  );
  const fehler = [];
  if (schritt === "1") {
    if (form.name.value.trim().length < 2)
      fehler.push([form.name, "Bitte gebt euren Namen an."]);
    if (!zustand.kategorie)
      fehler.push([$("#kategorien"), "Bitte wählt aus, was am besten passt."]);
    if (form.beschreibung.value.trim().length < 10)
      fehler.push([
        form.beschreibung,
        "Ein, zwei Sätze reichen schon, aber ohne Beschreibung kann die KI nichts schreiben.",
      ]);
  }
  if (schritt === "3") {
    if (zustand.bilder.some((b) => b.laeuft) || zustand.logo?.laeuft)
      fehler.push([$("#ablage"), "Einen Moment, die Bilder werden noch hochgeladen."]);
    if (hatBilder() && !form.bildrechte.checked)
      fehler.push([$("#rechte"), "Bitte bestätigt die Bildrechte."]);
  }
  if (schritt === "5") {
    const mail = form.email.value.trim();
    if (mail && !/^[^@\s<>"']+@[^@\s<>"']+\.[a-zA-Z]{2,}$/.test(mail))
      fehler.push([
        form.email,
        "Diese E-Mail-Adresse sieht nicht vollständig aus.",
      ]);
    if (!/^[0-9 +()/\-]*$/.test(form.telefon.value.trim()))
      fehler.push([
        form.telefon,
        "Bitte nur Ziffern, Leerzeichen und + ( ) / -",
      ]);
  }
  fehler.forEach(([f, t]) => fehlerFeld(f, t));
  if (fehler.length)
    fehler[0][0].scrollIntoView({ behavior: "smooth", block: "center" });
  return fehler.length === 0;
}

// --- Logo und Bilder -----------------------------------------------------------------------

const FUELLWOERTER = new Set(["e", "v", "ev", "gmbh", "ug", "kg", "ag", "gbr", "mbh", "und", "der", "die", "das", "the"]);

// Gleiche Regel wie app/images.py, damit die Vorschau dem Ergebnis entspricht.
function initialen(name) {
  const woerter = (name.match(/[A-Za-zÄÖÜäöüß]+/g) || []).filter(
    (w) => !FUELLWOERTER.has(w.toLowerCase()),
  );
  if (!woerter.length) return (name.replace(/\W/g, "")[0] || "W").toUpperCase();
  if (woerter.length === 1) return woerter[0][0].toUpperCase() + woerter[0].slice(1, 2).toLowerCase();
  return (woerter[0][0] + woerter[1][0]).toUpperCase();
}

function textfarbe(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const lin = (c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b) > 0.179 ? "#111111" : "#ffffff";
}

function logoVorschau() {
  const box = $("#logo-vorschau");
  box.classList.toggle("laeuft", !!zustand.logo?.laeuft);
  box.replaceChildren();
  $("#logo-weg").hidden = !zustand.logo?.url;
  $("#logo-text").textContent = zustand.logo?.url
    ? "Euer Logo erscheint oben links auf der Seite und als Favicon im Browser-Tab."
    : "Kein Logo? Dann nutzen wir dieses Zeichen aus euren Initialen, auch als Favicon im Browser-Tab.";
  if (zustand.logo?.laeuft) return;
  if (zustand.logo?.url) {
    const img = el("img");
    img.src = zustand.logo.url;
    img.alt = "Euer Logo";
    box.append(img);
    return;
  }
  const farbe = form.farbe.value;
  const ns = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(ns, "svg");
  svg.setAttribute("viewBox", "0 0 64 64");
  svg.setAttribute("aria-label", "Standard-Zeichen");
  const kreis = document.createElementNS(ns, "circle");
  Object.entries({ cx: 32, cy: 32, r: 32, fill: farbe }).forEach(([k, v]) => kreis.setAttribute(k, v));
  const text = document.createElementNS(ns, "text");
  const kuerzel = initialen(form.name.value || "Website");
  Object.entries({
    x: 32, y: 33, "text-anchor": "middle", "dominant-baseline": "central",
    "font-family": "system-ui, sans-serif", "font-weight": 700,
    "font-size": kuerzel.length > 1 ? 30 : 36, fill: textfarbe(farbe),
  }).forEach(([k, v]) => text.setAttribute(k, v));
  text.textContent = kuerzel;
  svg.append(kreis, text);
  box.append(svg);
}

function hatBilder() {
  return !!zustand.logo?.url || zustand.bilder.some((b) => b.upload_id);
}

function rechteAnzeigen() {
  $("#rechte").hidden = !hatBilder();
  const vorschlag = zustand.logo?.farbvorschlag;
  $("#logo-farbe").hidden = !vorschlag;
  if (vorschlag) $("#logo-farbe-muster").style.background = vorschlag;
}

async function hochladen(datei, art) {
  const daten = new FormData();
  daten.append("datei", datei);
  daten.append("art", art);
  const r = await fetch("/api/uploads", { method: "POST", body: daten });
  const json = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(typeof json.detail === "string" ? json.detail : "Upload fehlgeschlagen.");
  return json;
}

function dateiOk(datei) {
  if (!["image/png", "image/jpeg", "image/webp"].includes(datei.type)) {
    fehlerZeigen(`${datei.name}: bitte PNG, JPG oder WebP.`);
    return false;
  }
  if (datei.size > 8 * 1024 * 1024) {
    fehlerZeigen(`${datei.name} ist größer als 8 MB.`);
    return false;
  }
  return true;
}

async function logoWaehlen(datei) {
  if (!datei || !dateiOk(datei)) return;
  zustand.logo = { laeuft: true };
  logoVorschau();
  try {
    zustand.logo = await hochladen(datei, "logo");
    // Die Logofarbe ist fast immer die richtige Seitenfarbe, also direkt übernehmen.
    if (zustand.logo.farbvorschlag) farbeSetzen(zustand.logo.farbvorschlag);
  } catch (e) {
    zustand.logo = null;
    fehlerZeigen(e.message);
  }
  logoVorschau();
  rechteAnzeigen();
}

function bilderZeichnen() {
  const liste = $("#bildliste");
  liste.replaceChildren();
  zustand.bilder.forEach((b, i) => {
    const karte = el("div", "bild");
    if (b.laeuft) {
      karte.classList.add("laeuft");
      liste.append(karte);
      return;
    }
    const img = el("img");
    img.src = b.url;
    img.alt = b.beschreibung || `Bild ${i + 1}`;
    const weg = el("button", "weg", "×");
    weg.type = "button";
    weg.setAttribute("aria-label", `Bild ${i + 1} entfernen`);
    weg.addEventListener("click", () => {
      zustand.bilder.splice(i, 1);
      bilderZeichnen();
      rechteAnzeigen();
    });
    const text = el("input");
    text.maxLength = 150;
    text.placeholder = "Was ist zu sehen?";
    text.value = b.beschreibung;
    text.setAttribute("aria-label", `Beschreibung für Bild ${i + 1}`);
    text.addEventListener("input", () => (b.beschreibung = text.value));
    karte.append(img, weg, text);
    if (i === 0) karte.append(el("span", "etikett", "Groß oben"));
    liste.append(karte);
  });
  $("#ablage").classList.toggle("voll", zustand.bilder.length >= MAX_BILDER);
}

async function bilderWaehlen(dateien) {
  const frei = MAX_BILDER - zustand.bilder.length;
  const auswahl = [...dateien].filter(dateiOk);
  if (auswahl.length > frei) fehlerZeigen(`Es passen noch ${frei} Bilder, der Rest wurde ausgelassen.`);
  await Promise.all(
    auswahl.slice(0, frei).map(async (datei) => {
      const platz = { laeuft: true };
      zustand.bilder.push(platz);
      bilderZeichnen();
      try {
        const r = await hochladen(datei, "bild");
        Object.assign(platz, r, { laeuft: false, beschreibung: "" });
      } catch (e) {
        zustand.bilder.splice(zustand.bilder.indexOf(platz), 1);
        fehlerZeigen(`${datei.name}: ${e.message}`);
      }
      bilderZeichnen();
      rechteAnzeigen();
    }),
  );
}

// --- Daten ----------------------------------------------------------------------------------

function daten() {
  const f = new FormData(form);
  return {
    name: f.get("name").trim(),
    kategorie: zustand.kategorie,
    beschreibung: f.get("beschreibung").trim(),
    ort: f.get("ort").trim(),
    angebote: zustand.angebote,
    zeiten: f.get("zeiten").trim(),
    farbe: f.get("farbe"),
    stil: zustand.stil,
    anrede: f.get("anrede"),
    kontakt: {
      email: f.get("email").trim(),
      telefon: f.get("telefon").trim(),
      adresse: f.get("adresse").trim(),
    },
    wuensche: f.get("wuensche").trim(),
    modus: f.get("modus"),
    logo_id: zustand.logo?.upload_id || null,
    bilder: zustand.bilder
      .filter((b) => b.upload_id)
      .map((b) => ({ id: b.upload_id, beschreibung: b.beschreibung.trim() })),
    bildrechte_bestaetigt: hatBilder() && form.bildrechte.checked,
  };
}

// Entwurf nur im eigenen Browser, damit ein Neuladen nicht alles löscht.
let entwurfGeladen = false;
function speichern() {
  // Vor dem Laden würde der leere Aufbau-Zustand den Entwurf überschreiben.
  if (!entwurfGeladen) return;
  try {
    localStorage.setItem(ENTWURF_KEY, JSON.stringify(daten()));
  } catch {
    /* privat oder blockiert */
  }
}

function laden() {
  let d;
  try {
    d = JSON.parse(localStorage.getItem(ENTWURF_KEY) || "null");
  } catch {
    d = null;
  }
  entwurfGeladen = true;
  if (!d) return;
  for (const n of ["name", "beschreibung", "ort", "zeiten", "wuensche"])
    if (d[n]) form[n].value = d[n];
  for (const n of ["email", "telefon", "adresse"])
    if (d.kontakt?.[n]) form[n].value = d.kontakt[n];
  if (d.anrede) form.querySelector(`[name=anrede][value=${d.anrede}]`)?.click();
  if (d.modus) form.querySelector(`[name=modus][value=${d.modus}]`)?.click();
  zustand.angebote = Array.isArray(d.angebote) ? d.angebote.slice(0, 8) : [];
  if (d.kategorie) waehlen("kategorie", d.kategorie);
  if (d.stil) waehlen("stil", d.stil);
  if (/^#[0-9a-fA-F]{6}$/.test(d.farbe || "")) farbeSetzen(d.farbe);
}

// --- Backend --------------------------------------------------------------------------------

async function api(pfad, body) {
  const r = await fetch(pfad, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await r.json().catch(() => ({}));
  if (!r.ok) {
    const err = new Error(
      typeof json.detail === "string"
        ? json.detail
        : "Da ist etwas schiefgelaufen. Bitte nochmal versuchen.",
    );
    err.details = Array.isArray(json.detail) ? json.detail : null;
    throw err;
  }
  return json;
}

function fehlerZeigen(text) {
  const box = $("#fehler");
  box.textContent = text;
  box.hidden = false;
  clearTimeout(fehlerZeigen.t);
  fehlerZeigen.t = setTimeout(() => (box.hidden = true), 6000);
}

function ladeAnimation() {
  const schritte = $$("#ladeschritte li");
  schritte.forEach((s) => s.classList.remove("laeuft", "fertig"));
  let i = 0;
  schritte[0].classList.add("laeuft");
  const takt = setInterval(() => {
    if (i < schritte.length - 1) {
      schritte[i].classList.replace("laeuft", "fertig");
      schritte[++i].classList.add("laeuft");
    }
  }, 7000);
  return () => {
    clearInterval(takt);
    schritte.forEach((s) => {
      s.classList.remove("laeuft");
      s.classList.add("fertig");
    });
  };
}

async function erstellen() {
  zeigen("laden");
  const stopp = ladeAnimation();
  try {
    zustand.site = await api("/api/sites", daten());
    stopp();
    ergebnisZeigen();
  } catch (e) {
    stopp();
    zeigen(e.details ? serverFehlerZuordnen(e.details) : LETZTER);
    fehlerZeigen(
      e.details ? "Bitte die markierten Angaben prüfen." : e.message,
    );
  }
}

function serverFehlerZuordnen(details) {
  const schrittVon = {
    name: "1",
    kategorie: "1",
    beschreibung: "1",
    ort: "1",
    angebote: "2",
    zeiten: "2",
    logo_id: "3",
    bilder: "3",
    bildrechte_bestaetigt: "3",
    email: "5",
    telefon: "5",
    adresse: "5",
    wuensche: "5",
  };
  let ziel = LETZTER;
  for (const d of details) {
    const feldName = d.loc?.[d.loc.length - 1];
    const feld = form.elements[feldName];
    if (feld && feld.classList) fehlerFeld(feld, "Bitte prüfen.");
    if (schrittVon[feldName] && schrittVon[feldName] < ziel)
      ziel = schrittVon[feldName];
  }
  return ziel;
}

function vorschauLaden() {
  const url = `${zustand.site.preview_url}?v=${Date.now()}`;
  $("#vorschau").src = url;
  $("#oeffnen").href = zustand.site.preview_url;
  $("#download").href = zustand.site.download_url;
  $("#ergebnis-titel").textContent = zustand.site.seitentitel;
}

function ergebnisZeigen() {
  vorschauLaden();
  zeigen("ergebnis");
}

async function aendern(ev) {
  ev.preventDefault();
  const anweisung = $("#anweisung").value.trim();
  if (anweisung.length < 3)
    return fehlerZeigen("Beschreibt kurz, was anders sein soll.");
  const knopf = $("#aendern-knopf");
  knopf.disabled = true;
  knopf.textContent = "Wird umgesetzt …";
  $("#vorschau-lader").hidden = false;
  try {
    zustand.site = await api(`/api/sites/${zustand.site.site_id}/revise`, {
      anweisung,
    });
    $("#anweisung").value = "";
    vorschauLaden();
  } catch (e) {
    fehlerZeigen(e.message);
  } finally {
    knopf.disabled = false;
    knopf.textContent = "Änderung umsetzen";
    $("#vorschau-lader").hidden = true;
  }
}

// --- Start ----------------------------------------------------------------------------------

document.addEventListener("DOMContentLoaded", () => {
  aufbauen();
  waehlen("stil", "klar");
  laden();
  tagsZeichnen();
  texteFuerKategorie();

  $$("[data-weiter]").forEach((b) =>
    b.addEventListener("click", () => weiter()),
  );
  $("[data-zurueck]").addEventListener("click", zurueck);
  $("[data-ueberspringen]").addEventListener("click", () => weiter(false));
  form.addEventListener("input", (e) => {
    if (e.target.classList.contains("ungueltig")) fehlerFeldWeg(e.target);
    speichern();
    zaehler();
  });
  form.addEventListener("submit", (e) => e.preventDefault());
  form.farbe.addEventListener("input", () => farbeSetzen(form.farbe.value));
  form.addEventListener("keydown", (e) => {
    if (
      e.key === "Enter" &&
      e.target.tagName === "INPUT" &&
      e.target.id !== "tag-eingabe"
    ) {
      e.preventDefault();
      weiter();
    }
  });
  const tagEingabe = $("#tag-eingabe");
  tagEingabe.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      tagHinzufuegen();
    }
    if (e.key === "Backspace" && !tagEingabe.value && zustand.angebote.length) {
      zustand.angebote.pop();
      tagsZeichnen();
      speichern();
    }
  });
  tagEingabe.addEventListener("blur", tagHinzufuegen);
  $("#aendern").addEventListener("submit", aendern);
  $$("[data-geraet]").forEach((b) =>
    b.addEventListener("click", () => {
      $$("[data-geraet]").forEach((x) =>
        x.setAttribute("aria-pressed", String(x === b)),
      );
      $("#rahmen").classList.toggle("mobil", b.dataset.geraet === "mobil");
    }),
  );
  $("#neu").addEventListener("click", () => {
    try {
      localStorage.removeItem(ENTWURF_KEY);
    } catch {
      /* egal */
    }
    location.reload();
  });
  $("#logo-datei").addEventListener("change", (e) => {
    logoWaehlen(e.target.files[0]);
    e.target.value = "";
  });
  $("#logo-weg").addEventListener("click", () => {
    zustand.logo = null;
    logoVorschau();
    rechteAnzeigen();
  });
  $("#logo-farbe").addEventListener("click", () => farbeSetzen(zustand.logo.farbvorschlag));
  $("#bild-dateien").addEventListener("change", (e) => {
    bilderWaehlen(e.target.files);
    e.target.value = "";
  });
  const ablage = $("#ablage");
  ["dragenter", "dragover"].forEach((t) =>
    ablage.addEventListener(t, (e) => {
      e.preventDefault();
      ablage.classList.add("drueber");
    }),
  );
  ["dragleave", "drop"].forEach((t) => ablage.addEventListener(t, () => ablage.classList.remove("drueber")));
  ablage.addEventListener("drop", (e) => {
    e.preventDefault();
    bilderWaehlen(e.dataTransfer.files);
  });
  form.name.addEventListener("input", () => { if (!zustand.logo?.url) logoVorschau(); });
  form.bildrechte.addEventListener("change", () => fehlerFeldWeg($("#rechte")));
  logoVorschau();
  zaehler();
  zeigen("start");
});

function zaehler() {
  const z = $("[data-zaehler=beschreibung]");
  const n = form.beschreibung.value.trim().length;
  z.textContent = n < 10 ? `noch ${10 - n} Zeichen` : `${n} / 1500`;
}
