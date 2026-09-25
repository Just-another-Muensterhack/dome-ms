"""Der eigentliche Ablauf: Fragebogen, Modell, Nachbearbeitung, Rendern, Speichern."""

import logging
import time

from app.llm import LLMClient
from app.prompts import (
    PROMPT_VERSION,
    SYSTEM_HTML,
    SYSTEM_VORLAGE,
    nachricht_aendern,
    nachricht_neu,
)
from app.render import render_html, render_vorlage
from app.schemas import Abschnitt, Design, HtmlSite, SiteContent, SiteRequest
from app.storage import Storage
from app.structure import plan_fuer

log = logging.getLogger("site_generator")


def _an_gliederung_angleichen(req: SiteRequest, content: SiteContent) -> SiteContent:
    """Das Modell hält sich meist an die Gliederung. Falls nicht, gewinnt der Code."""
    vom_modell = {a.id: a for a in content.abschnitte}
    abschnitte = [
        vom_modell.get(sid) or Abschnitt(id=sid, titel=titel, text="", punkte=[])
        for sid, titel, _ in plan_fuer(req)
    ]
    return content.model_copy(update={"abschnitte": abschnitte})


class Generator:
    def __init__(self, llm: LLMClient, storage: Storage) -> None:
        self.llm = llm
        self.storage = storage

    def _erzeugen(
        self, req: SiteRequest, nachricht: str, neu: bool, assets: dict
    ) -> tuple[dict, dict[str, str]]:
        start = time.monotonic()
        if req.modus == "html":
            site = self.llm.generate(SYSTEM_HTML, nachricht, HtmlSite)
            dateien, inhalt = render_html(req, site, assets), site.model_dump()
        else:
            content = self.llm.generate(SYSTEM_VORLAGE, nachricht, SiteContent)
            if neu:
                content = content.model_copy(
                    update={"design": Design(farbe=req.farbe, stil=req.stil)}
                )
            content = _an_gliederung_angleichen(req, content)
            dateien, inhalt = render_vorlage(req, content, assets), content.model_dump()
        log.info("seite erzeugt modus=%s dauer=%.1fs", req.modus, time.monotonic() - start)
        return inhalt, dateien

    def erstellen(self, req: SiteRequest) -> tuple[str, str]:
        site_id = self.storage.neu()
        try:
            assets = self.storage.assets_uebernehmen(site_id, req)
            inhalt, dateien = self._erzeugen(req, nachricht_neu(req), neu=True, assets=assets)
        except Exception:
            # Keine halbfertigen Ordner liegen lassen, wenn Upload oder Modell scheitern.
            self.storage.loeschen(site_id)
            raise
        meta = {
            "request": req.model_dump(),
            "assets": assets,
            "inhalt": inhalt,
            "prompt_version": PROMPT_VERSION,
            "aenderungen": [],
        }
        self.storage.speichern(site_id, meta, dateien)
        return site_id, inhalt["seitentitel"]

    def aendern(self, site_id: str, anweisung: str) -> str:
        meta = self.storage.meta(site_id)
        req = SiteRequest.model_validate(meta["request"])
        nachricht = nachricht_aendern(req, meta["inhalt"], anweisung)
        inhalt, dateien = self._erzeugen(req, nachricht, neu=False, assets=meta["assets"])
        meta["inhalt"] = inhalt
        meta["aenderungen"].append(anweisung)
        self.storage.speichern(site_id, meta, dateien)
        return inhalt["seitentitel"]
