/* Startseite: Orte-Teaser aus den Demo-Daten rendern (keine zweite, von Hand kopierte Datenquelle). */
(function () {
  "use strict";

  var target = document.getElementById("start-orte");
  if (!target) return;

  var ids = (target.getAttribute("data-orte") || "").split(",");
  var orte = window.HH_ORTE || [];

  target.innerHTML = ids.map(function (id) {
    var ort = orte.filter(function (o) { return o.id === id; })[0];
    return ort ? window.HH.karte(ort) : "";
  }).join("");
})();
