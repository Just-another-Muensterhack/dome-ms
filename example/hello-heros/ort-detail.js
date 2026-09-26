/* Detailseite eines Ortes (?id=...&zurueck=<Filterzustand der Liste>) */
(function () {
  "use strict";

  var H = window.HH;
  var target = document.getElementById("ort");
  if (!target) return;

  var params = new URLSearchParams(window.location.search);
  var id = params.get("id");
  var ort = (window.HH_ORTE || []).filter(function (o) { return o.id === id; })[0];

  // Filterzustand der Liste wiederherstellen. Nur bekannte Schlüssel übernehmen.
  function zurueckQuery() {
    var raw = params.get("zurueck");
    if (!raw) return "";
    var src = new URLSearchParams(raw);
    var out = new URLSearchParams();
    ["q", "bereich", "nicht_erfasst"].forEach(function (k) { if (src.get(k)) out.set(k, src.get(k)); });
    src.getAll("merkmal").forEach(function (v) { out.append("merkmal", v); });
    var s = out.toString();
    return s ? "?" + s : "";
  }
  var listeHref = H.esc("orte.html" + zurueckQuery());

  if (!ort) {
    document.title = "Ort nicht gefunden – Hello Heroes (Demo)";
    target.innerHTML =
      "<h1>Ort nicht gefunden</h1>" +
      "<p>Diesen Ort gibt es hier nicht. Der Link ist vielleicht veraltet.</p>" +
      '<p><a class="btn" href="orte.html">Zurück zu allen Orten</a></p>';
    return;
  }

  document.title = ort.name + " – Orte entdecken – Hello Heroes (Demo)";

  function liste(items) {
    return "<ul>" + items.map(function (t) { return "<li>" + H.esc(t) + "</li>"; }).join("") + "</ul>";
  }

  // Nur Merkmale zeigen, zu denen es eine Angabe gibt
  var rows = window.HH_MERKMALE.filter(function (m) { return ort.merkmale[m.key]; }).map(function (m) {
    var hint = H.hinweis(ort, m.key);
    return '<tr><th scope="row">' + H.esc(m.label) + "</th><td>" + H.badge(H.status(ort, m.key)) + "</td><td>" +
      (hint ? H.esc(hint) : '<span class="muted">Keine Angabe</span>') + "</td></tr>";
  }).join("");

  var kontakt = (ort.kontakt || []).map(function (k) {
    var ext = /^https?:/.test(k.href);
    return "<li><strong>" + H.esc(k.label) + ":</strong> <a href=\"" + H.esc(k.href) + "\"" +
      (ext ? ' rel="noopener noreferrer"' : "") + ">" + H.esc(k.text) + "</a></li>";
  }).join("");

  var quellen = (ort.quellen || []).map(function (q) {
    return "<li>" + H.extern(q.url, q.label) + " (extern)</li>";
  }).join("");

  target.innerHTML =
    '<nav aria-label="Brotkrumen" class="crumbs"><ol>' +
    '<li><a href="index.html">Start</a></li><li><a href="' + listeHref + '">Orte entdecken</a></li>' +
    '<li aria-current="page">' + H.esc(ort.name) + "</li></ol></nav>" +
    '<div class="ort__head"><div>' +
    '<p class="card__badges"><span class="badge">' + H.esc(ort.typ) + '</span><span class="badge badge--eigen">Angaben laut Betrieb</span></p>' +
    "<h1>" + H.esc(ort.name) + "</h1>" +
    '<p class="ort__adresse">' + H.esc(ort.adresse) + (ort.adresseHinweis ? " (" + H.esc(ort.adresseHinweis.replace(/\.$/, "")) + ")" : "") + "</p>" +
    "<p>" + H.eingangBadge(ort) + "</p>" +
    "<p>" + H.esc(ort.kurztext) + "</p>" +
    "<p>" + H.extern(ort.website, "Website des Betriebs (extern)") + "</p></div>" +
    H.platzhalter(ort) + "</div>" +

    '<div class="notice"><p><strong>Angaben laut Betrieb, nicht vor Ort geprüft.</strong> ' +
    "Sie stammen von den Websites und Unterlagen des Betriebs. Stand der Recherche: " + H.esc(H.formatDatum(window.HH_STAND)) + ". " +
    "Hello Heroes arbeitet nicht mit dem Betrieb zusammen und hat den Eintrag nicht mit ihm abgestimmt.</p></div>" +

    (ort.hindernisse.length
      ? '<section class="box box--warn" aria-labelledby="wichtig"><h2 id="wichtig">Wichtig vor dem Besuch</h2>' + liste(ort.hindernisse) + "</section>"
      : "") +

    '<h2 id="zugaenglichkeit">Zugänglichkeit im Überblick</h2>' +
    "<p>„Nicht erfasst“ heißt: Dazu haben wir keine belastbare Angabe. Es heißt nicht, dass etwas fehlt. " +
    "Merkmale ohne Angabe sind hier nicht aufgeführt.</p>" +
    '<div class="table-wrap" tabindex="0" role="region" aria-label="Tabelle der Zugänglichkeitsmerkmale"><table class="table"><caption class="visually-hidden">Zugänglichkeitsmerkmale von ' + H.esc(ort.name) + "</caption>" +
    '<thead><tr><th scope="col">Merkmal</th><th scope="col">Status</th><th scope="col">Hinweis</th></tr></thead><tbody>' + rows + "</tbody></table></div>" +

    (ort.hinweise.length ? "<h2>Weitere Angaben</h2>" + liste(ort.hinweise) : "") +

    '<h2 id="pruefen">Vor dem Besuch nachfragen</h2>' +
    "<p>Wenn dir eine Angabe fehlt oder du sicher sein willst: Frag vorher direkt beim Betrieb nach.</p>" +
    '<ul class="kontakt">' + kontakt + "</ul>" +

    "<h2>Quellen</h2><ul>" + quellen + "</ul>" +
    '<details class="melden"><summary>Angabe fehlt oder ist falsch? Melden</summary>' +
    '<form data-demo-form novalidate class="melden__form">' +
    '<div class="field"><label for="melden-text">Was stimmt nicht?</label>' +
    '<textarea class="input" id="melden-text" name="hinweis" rows="3"></textarea></div>' +
    '<div><button class="btn btn--dark" type="submit">Hinweis senden</button></div>' +
    '<p class="form-status" role="status" data-form-status></p></form></details>' +

    '<p><a class="btn btn--ghost" href="' + listeHref + '">Zurück zu den Orten</a></p>';
})();
