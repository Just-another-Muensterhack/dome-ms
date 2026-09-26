/* Gemeinsame Funktionen: Demo-Schalter, Menü-Button, Demo-Formulare und Hilfsfunktionen
   für die Orte-Seiten. Klassisches Script (kein Modul), damit die Seite auch per file:// läuft. */
(function () {
  "use strict";

  // ---------- Demo-Schalter ----------
  // Auf false setzen, sobald echte, geprüfte Inhalte veröffentlicht werden.
  // Blendet dann alle Demo-Hinweise aus (Banner, "Demo-Daten"-Badges, Demo-Kästen).
  var DEMO = true;
  if (!DEMO) document.documentElement.classList.add("no-demo");

  // ---------- Mobiles Menü ----------
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("hauptnavigation");

  if (toggle && nav) {
    var wide = window.matchMedia("(min-width: 62rem)");

    var setOpen = function (open) {
      toggle.setAttribute("aria-expanded", String(open));
      nav.classList.toggle("is-open", open);
    };

    toggle.addEventListener("click", function () {
      setOpen(toggle.getAttribute("aria-expanded") !== "true");
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
        setOpen(false);
        toggle.focus();
      }
    });

    // Beim Wechsel auf breite Ansicht den Zustand zurücksetzen
    var reset = function () { if (wide.matches) setOpen(false); };
    if (wide.addEventListener) wide.addEventListener("change", reset);
  }

  // ---------- Demo-Formulare (kein Versand) ----------
  // Ereignis-Delegation, damit auch später eingefügte Formulare (Detailseite) funktionieren.
  document.addEventListener("submit", function (event) {
    var form = event.target;
    if (!form.matches || !form.matches("form[data-demo-form]")) return;
    event.preventDefault();
    var out = form.querySelector("[data-form-status]");
    if (out) out.textContent = "Demo: Es wurde nichts gesendet.";
  });

  // ---------- Hilfsfunktionen ----------
  // Status je Merkmal. Immer Symbol UND Text, nie nur Farbe.
  var STATUS = {
    ja: { icon: "✓", text: "Ja", cls: "badge--ok" },
    nein: { icon: "✕", text: "Nein", cls: "badge--no" },
    eingeschraenkt: { icon: "!", text: "Mit Einschränkungen", cls: "badge--lim" },
    unbekannt: { icon: "?", text: "Nicht erfasst", cls: "badge--unk" }
  };

  var H = {
    demo: DEMO,

    esc: function (value) {
      return String(value).replace(/[&<>"']/g, function (c) {
        return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
      });
    },

    // Für Suche, Variante 2: deutsche Umschrift (ü = ue, ö = oe, ä = ae, ß = ss), damit "Muenster" auch "Münster" findet
    normDe: function (value) {
      return String(value).toLowerCase().replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss")
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    },

    // Für Suche, Variante 1: Kleinbuchstaben, ohne Umlaut-/Akzentunterschiede ("Munster" findet "Münster")
    norm: function (value) {
      return String(value).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/ß/g, "ss");
    },

    badge: function (status, label) {
      var s = STATUS[status] || STATUS.unbekannt;
      return '<span class="badge ' + s.cls + '"><span aria-hidden="true">' + s.icon + "</span> " +
        H.esc(label || s.text) + "</span>";
    },

    // Fehlt ein Merkmal bei einem Ort, gilt es als "unbekannt" (nie als "nein").
    status: function (ort, key) {
      var m = ort.merkmale[key];
      return m ? m[0] : "unbekannt";
    },

    hinweis: function (ort, key) {
      var m = ort.merkmale[key];
      return m && m[1] ? m[1] : "";
    },

    // Ein Filter zeigt nur bestätigte Merkmale ("ja").
    erfuellt: function (ort, key) {
      return H.status(ort, key) === "ja";
    },

    // Mit der Option "auch eingeschränkt oder nicht erfasst": nie "nein".
    moeglich: function (ort, key) {
      var s = H.status(ort, key);
      return s === "ja" || s === "eingeschraenkt" || s === "unbekannt";
    },

    // Eingangsstatus ist die wichtigste Information (Briefing: Stufen am Eingang)
    eingangBadge: function (ort) {
      var s = H.status(ort, "stufenlos");
      var label = { ja: "Stufenloser Eingang", nein: "Stufe am Eingang", eingeschraenkt: "Eingang mit Einschränkungen" }[s] || "Eingang nicht erfasst";
      return H.badge(s, label);
    },

    // Braucht der Ort den Hinweis "Vor dem Besuch nachfragen"? Gibt den Grund zurück oder "".
    nachfragen: function (ort) {
      if (ort.nachfragen) return ort.nachfragen;
      var offen = Object.keys(ort.merkmale).some(function (k) {
        var s = ort.merkmale[k][0];
        return s === "unbekannt" || s === "eingeschraenkt";
      });
      return offen || !ort.merkmale.stufenlos ? "Angaben fehlen oder sind eingeschränkt." : "";
    },

    formatDatum: function (iso) {
      var d = new Date(iso + "T00:00:00");
      return isNaN(d) ? iso : d.toLocaleDateString("de-DE", { day: "numeric", month: "long", year: "numeric" });
    },

    // Externe Links: neuer Kontext bleibt aus, aber ohne Referrer und mit Hinweis im Text
    extern: function (url, text) {
      return '<a href="' + H.esc(url) + '" rel="noopener noreferrer">' + H.esc(text) + "</a>";
    },

    // Kontaktlink für die Karte: erster Eintrag der Kontaktliste
    kontaktLink: function (ort) {
      var k = ort.kontakt && ort.kontakt[0];
      if (!k) return "";
      var ext = /^https?:/.test(k.href);
      return '<a href="' + H.esc(k.href) + '"' + (ext ? ' rel="noopener noreferrer"' : "") + ">Kontakt aufnehmen</a>";
    },

    // Neutraler Platzhalter, solange keine freigegebenen Ortsfotos vorliegen
    platzhalter: function (ort) {
      return '<div class="ph ph--4x3 ph--' + H.esc(ort.bild || "sky") + '" role="img" aria-label="Bildplatzhalter, Foto von ' +
        H.esc(ort.name) + ' folgt"><p class="ph__label"><strong>Bildplatzhalter</strong>Ortsfoto folgt</p></div>';
    },

    // Orte-Karte. base = Ordnerpfad vor ort.html (leer, wenn die Seite im selben Ordner liegt),
    // zurueck = Filterzustand der Liste, damit "Zurück" ihn wiederherstellen kann.
    karte: function (ort, base, zurueck) {
      var href = (base || "") + "ort.html?id=" + encodeURIComponent(ort.id) +
        (zurueck ? "&zurueck=" + encodeURIComponent(zurueck) : "");
      var frage = H.nachfragen(ort);
      return '<li><article class="card">' +
        '<div class="card__media">' + H.platzhalter(ort) + "</div>" +
        '<div class="card__body">' +
        '<div class="card__badges"><span class="badge">' + H.esc(ort.typ) + '</span><span class="badge badge--eigen">Angaben laut Betrieb</span></div>' +
        '<h3 class="card__title"><a href="' + H.esc(href) + '">' + H.esc(ort.name) + "</a></h3>" +
        '<p class="card__meta">' + H.esc(ort.adresse) + "</p>" +
        "<p>" + H.esc(ort.kurztext) + "</p>" +
        "<p>" + H.eingangBadge(ort) + "</p>" +
        (frage ? '<p class="card__ask"><strong>Vor dem Besuch nachfragen.</strong> ' + H.esc(frage) + "</p>" : "") +
        '<p class="card__links">' + H.extern(ort.website, "Website des Betriebs (extern)") +
        (H.kontaktLink(ort) ? " · " + H.kontaktLink(ort) : "") + "</p>" +
        "</div></article></li>";
    }
  };

  window.HH = H;
})();
