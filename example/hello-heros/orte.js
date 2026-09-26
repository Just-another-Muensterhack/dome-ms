/* Orte entdecken: Suche und Filter.
   Zustand steht in der URL (?q=&bereich=&merkmal=&nicht_erfasst=1), damit Ergebnisse verlinkbar sind. */
(function () {
  "use strict";

  var H = window.HH;
  var orte = (window.HH_ORTE || []).slice().sort(function (a, b) { return a.name.localeCompare(b.name, "de"); });
  var merkmale = window.HH_MERKMALE || [];
  var form = document.getElementById("orte-form");
  var list = document.getElementById("orte-liste");
  if (!form || !list) return;

  var status = document.getElementById("orte-status");
  var ansage = document.getElementById("orte-ansage");
  var empty = document.getElementById("orte-leer");
  var aktiv = document.getElementById("orte-aktiv");
  var box = document.getElementById("filterbox");
  var boxCount = document.getElementById("filter-anzahl");

  var qInput = form.elements.q;
  var bereichSelect = form.elements.bereich;
  var unbekanntBox = form.elements.nicht_erfasst;

  // ---------- Formularfelder aus den Daten erzeugen (eine Quelle der Wahrheit) ----------
  (window.HH_BEREICHE || []).forEach(function (b) {
    var o = document.createElement("option");
    o.textContent = b;
    bereichSelect.appendChild(o);
  });

  var gruppen = [];
  merkmale.forEach(function (m) { if (gruppen.indexOf(m.gruppe) === -1) gruppen.push(m.gruppe); });

  document.getElementById("merkmal-liste").innerHTML = gruppen.map(function (g) {
    return '<fieldset class="merkmal-gruppe"><legend>' + H.esc(g) + "</legend>" +
      merkmale.filter(function (m) { return m.gruppe === g; }).map(function (m) {
        return '<div class="check"><input type="checkbox" id="m-' + m.key + '" name="merkmal" value="' + m.key +
          '" aria-describedby="h-' + m.key + '"><div><label for="m-' + m.key + '">' + H.esc(m.label) +
          '</label><span class="check__hint" id="h-' + m.key + '">' + H.esc(m.hilfe) + "</span></div></div>";
      }).join("") + "</fieldset>";
  }).join("");

  var merkmalBoxes = Array.prototype.slice.call(form.querySelectorAll('input[name="merkmal"]'));

  // ---------- Zustand ----------
  function readUrl() {
    var p = new URLSearchParams(window.location.search);
    qInput.value = p.get("q") || "";
    bereichSelect.value = p.get("bereich") || "";
    unbekanntBox.checked = p.get("nicht_erfasst") === "1";
    var wanted = p.getAll("merkmal");
    merkmalBoxes.forEach(function (b) { b.checked = wanted.indexOf(b.value) !== -1; });
  }

  function query() {
    var p = new URLSearchParams();
    if (qInput.value.trim()) p.set("q", qInput.value.trim());
    if (bereichSelect.value) p.set("bereich", bereichSelect.value);
    if (unbekanntBox.checked) p.set("nicht_erfasst", "1");
    merkmalBoxes.forEach(function (b) { if (b.checked) p.append("merkmal", b.value); });
    return p.toString();
  }

  function writeUrl(qs) {
    try {
      history.replaceState(null, "", window.location.pathname + (qs ? "?" + qs : ""));
    } catch (e) { /* file:// in manchen Browsern: URL bleibt unverändert */ }
  }

  // ---------- Filtern ----------
  // Ein Filter zeigt nur bestätigte Merkmale ("ja"). Mit der Option "auch eingeschränkt oder nicht erfasst"
  // kommen "eingeschraenkt" und "unbekannt" dazu, aber nie "nein".
  // Die Freitext-Suche durchsucht nur Name, Typ, Bereich und Adresse, nie die Hinweistexte.
  function passt(ort, terms, bereich, gewaehlt, weit) {
    if (bereich && ort.bereiche.indexOf(bereich) === -1) return false;
    for (var i = 0; i < gewaehlt.length; i++) {
      if (weit ? H.moeglich(ort, gewaehlt[i]) : H.erfuellt(ort, gewaehlt[i])) continue;
      return false;
    }
    if (terms.length) {
      var text = [ort.name, ort.typ, ort.bereiche.join(" "), ort.adresse].join(" ");
      var hay1 = H.norm(text), hay2 = H.normDe(text);
      for (var j = 0; j < terms.length; j++) {
        // jedes Suchwort muss in einer der beiden Schreibweisen vorkommen
        if (hay1.indexOf(H.norm(terms[j])) === -1 && hay2.indexOf(H.normDe(terms[j])) === -1) return false;
      }
    }
    return true;
  }

  function gewaehlteMerkmale() {
    return merkmalBoxes.filter(function (b) { return b.checked; }).map(function (b) { return b.value; });
  }

  function label(key) {
    return merkmale.filter(function (m) { return m.key === key; })[0].label;
  }

  // ---------- Aktive Filter als entfernbare Chips ----------
  function chips(gewaehlt) {
    var out = [];
    if (qInput.value.trim()) out.push({ id: "q", text: "Suche: „" + qInput.value.trim() + "“" });
    if (bereichSelect.value) out.push({ id: "bereich", text: bereichSelect.value });
    gewaehlt.forEach(function (k) { out.push({ id: "merkmal:" + k, text: label(k) }); });
    if (gewaehlt.length && unbekanntBox.checked) out.push({ id: "nicht_erfasst", text: "Auch eingeschränkt oder nicht erfasst" });
    return out;
  }

  function renderChips(gewaehlt) {
    var c = chips(gewaehlt);
    aktiv.hidden = c.length === 0;
    aktiv.innerHTML = c.length
      ? '<p class="aktiv__titel" id="aktiv-titel">Aktive Filter:</p><ul class="aktiv__liste" aria-labelledby="aktiv-titel">' +
        c.map(function (x) {
          return '<li><button class="chip-remove" type="button" data-entfernen="' + H.esc(x.id) + '">' + H.esc(x.text) +
            ' <span aria-hidden="true">×</span><span class="visually-hidden">, Filter entfernen</span></button></li>';
        }).join("") + "</ul>"
      : "";
    boxCount.textContent = c.length ? " (" + c.length + " aktiv)" : "";
  }

  // ---------- Rendern ----------
  var ansageTimer;
  function render() {
    var terms = qInput.value.toLowerCase().split(/\s+/).filter(Boolean);
    var gewaehlt = gewaehlteMerkmale();
    var qs = query();

    var result = orte.filter(function (o) {
      return passt(o, terms, bereichSelect.value, gewaehlt, unbekanntBox.checked);
    });

    list.innerHTML = result.map(function (o) { return H.karte(o, "", qs); }).join("");
    empty.hidden = result.length !== 0;
    list.hidden = result.length === 0;
    document.getElementById("orte-unbekannt-btn").hidden = !(gewaehlt.length && !unbekanntBox.checked);

    renderChips(gewaehlt);

    var text = result.length === 1 ? "1 Ort gefunden" : result.length + " Orte gefunden";
    if (result.length !== orte.length) text += " (von " + orte.length + ")";
    status.textContent = text;

    // Ansage für Screenreader erst nach einer Eingabepause, nicht bei jedem Tastendruck
    clearTimeout(ansageTimer);
    ansageTimer = setTimeout(function () { ansage.textContent = text; }, 700);
  }

  function update() { writeUrl(query()); render(); }

  // ---------- Ereignisse ----------
  form.addEventListener("submit", function (e) { e.preventDefault(); update(); });
  form.addEventListener("change", update);
  var timer;
  qInput.addEventListener("input", function () { clearTimeout(timer); timer = setTimeout(update, 250); });

  function reset() {
    qInput.value = "";
    bereichSelect.value = "";
    unbekanntBox.checked = false;
    merkmalBoxes.forEach(function (b) { b.checked = false; });
    update();
    qInput.focus();
  }
  Array.prototype.forEach.call(document.querySelectorAll("[data-orte-reset]"), function (btn) {
    btn.addEventListener("click", reset);
  });

  document.getElementById("orte-unbekannt-btn").addEventListener("click", function () {
    unbekanntBox.checked = true;
    update();
  });

  aktiv.addEventListener("click", function (e) {
    var btn = e.target.closest("[data-entfernen]");
    if (!btn) return;
    var id = btn.getAttribute("data-entfernen");
    if (id === "q") qInput.value = "";
    else if (id === "bereich") bereichSelect.value = "";
    else if (id === "nicht_erfasst") unbekanntBox.checked = false;
    else if (id.indexOf("merkmal:") === 0) form.querySelector("#m-" + id.slice(8)).checked = false;
    update();
    // Fokus nicht verlieren: zur Ergebniszeile springen
    status.setAttribute("tabindex", "-1");
    status.focus();
  });

  // ---------- Filterbereich: mobil eingeklappt, ab Desktop immer offen ----------
  var wide = window.matchMedia("(min-width: 62rem)");
  function syncBox() { if (wide.matches) box.open = true; }
  if (!wide.matches) box.open = false;
  if (wide.addEventListener) wide.addEventListener("change", syncBox);
  syncBox();

  readUrl();
  render();
})();
