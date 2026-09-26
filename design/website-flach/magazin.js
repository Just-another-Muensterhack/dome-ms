/* Magazin: Themenfilter über ?thema=... Ohne JavaScript bleiben alle Beiträge sichtbar. */
(function () {
  "use strict";

  var ohneDemo = document.documentElement.classList.contains("no-demo");
  // Bei DEMO = false sind erfundene Beispielkarten (Klasse demo-only) ausgeblendet und zählen nicht mit.
  var cards = Array.prototype.slice.call(document.querySelectorAll("[data-thema]")).filter(function (c) {
    return !(ohneDemo && c.classList.contains("demo-only"));
  });
  var links = Array.prototype.slice.call(document.querySelectorAll("[data-thema-link]"));
  var status = document.getElementById("magazin-status");
  var empty = document.getElementById("magazin-leer");
  if (!cards.length) return;

  var thema = new URLSearchParams(window.location.search).get("thema") || "";
  var bekannt = links.some(function (l) { return l.getAttribute("data-thema-link") === thema; });
  if (!bekannt) thema = "";

  var sichtbar = 0;
  cards.forEach(function (c) {
    var show = !thema || c.getAttribute("data-thema") === thema;
    c.hidden = !show;
    if (show) sichtbar++;
  });

  links.forEach(function (l) {
    var aktiv = l.getAttribute("data-thema-link") === thema;
    if (aktiv) l.setAttribute("aria-current", "true"); else l.removeAttribute("aria-current");
  });

  if (empty) empty.hidden = sichtbar !== 0;
  if (status) {
    status.textContent = thema
      ? sichtbar + (sichtbar === 1 ? " Beitrag" : " Beiträge") + " zum Thema „" + thema + "“"
      : cards.length + " Beiträge";
  }
})();
