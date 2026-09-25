"""Ablage als Dateien: ein Ordner je Seite, dazu ein Ordner für frische Uploads.

Für das MVP reicht das, später Datenbank plus Bucket.
"""

import io
import json
import re
import shutil
import time
import uuid
import zipfile
from datetime import UTC, datetime
from pathlib import Path

from app.images import favicon_aus_logo
from app.schemas import SiteRequest

_ID = re.compile(r"^[0-9a-f]{32}$")
_TEXTDATEI = re.compile(r"^([a-z]+\.html|favicon\.svg)$")
_ASSET = re.compile(r"^(bilder/(logo\.png|bild-[1-6]\.webp)|favicon\.png|fonts/[a-z-]+\.woff2)$")
_MEDIENTYP = {
    ".png": "image/png",
    ".webp": "image/webp",
    ".svg": "image/svg+xml",
    ".woff2": "font/woff2",
}
SCHRIFTEN = Path(__file__).parent / "assets" / "fonts"


class SiteNotFound(Exception):
    pass


class UploadFehlt(Exception):
    """Ein Upload ist abgelaufen oder gehört nicht zu dieser Anfrage."""


class Storage:
    def __init__(self, root: Path) -> None:
        self.root = root
        self.uploads = root.parent / "uploads"
        self.root.mkdir(parents=True, exist_ok=True)
        self.uploads.mkdir(parents=True, exist_ok=True)

    def _ordner(self, site_id: str) -> Path:
        # Die Prüfung verhindert Pfad-Tricks wie "../" über die URL.
        if not _ID.match(site_id):
            raise SiteNotFound(site_id)
        pfad = self.root / site_id
        if not pfad.is_dir():
            raise SiteNotFound(site_id)
        return pfad

    # --- Uploads ------------------------------------------------------------------------------

    def upload_speichern(self, daten: bytes, endung: str) -> str:
        upload_id = uuid.uuid4().hex
        (self.uploads / f"{upload_id}.{endung}").write_bytes(daten)
        return upload_id

    def upload_pfad(self, upload_id: str) -> Path:
        if not _ID.match(upload_id):
            raise UploadFehlt(upload_id)
        for endung in ("png", "webp"):
            pfad = self.uploads / f"{upload_id}.{endung}"
            if pfad.is_file():
                return pfad
        raise UploadFehlt(upload_id)

    def alte_uploads_loeschen(self, stunden: int = 24) -> int:
        grenze = time.time() - stunden * 3600
        alt = [p for p in self.uploads.iterdir() if p.is_file() and p.stat().st_mtime < grenze]
        for p in alt:
            p.unlink(missing_ok=True)
        return len(alt)

    # --- Seiten -------------------------------------------------------------------------------

    def neu(self) -> str:
        site_id = uuid.uuid4().hex
        (self.root / site_id / "bilder").mkdir(parents=True)
        return site_id

    def loeschen(self, site_id: str) -> None:
        if _ID.match(site_id):
            shutil.rmtree(self.root / site_id, ignore_errors=True)

    def assets_uebernehmen(self, site_id: str, req: SiteRequest) -> dict:
        """Kopiert Logo und Bilder aus den Uploads in den Seitenordner."""
        ordner = self.root / site_id
        assets: dict = {"logo": None, "bilder": []}
        # Schriften liegen bei jeder Seite selbst, damit der Download ohne fremde Server läuft.
        shutil.copytree(SCHRIFTEN, ordner / "fonts", dirs_exist_ok=True)
        if req.logo_id:
            logo = self.upload_pfad(req.logo_id)
            if logo.suffix != ".png":
                raise UploadFehlt(req.logo_id)
            daten = logo.read_bytes()
            (ordner / "bilder" / "logo.png").write_bytes(daten)
            (ordner / "favicon.png").write_bytes(favicon_aus_logo(daten))
            assets["logo"] = "bilder/logo.png"
        for i, ref in enumerate(req.bilder, start=1):
            quelle = self.upload_pfad(ref.id)
            if quelle.suffix != ".webp":
                raise UploadFehlt(ref.id)
            shutil.copyfile(quelle, ordner / "bilder" / f"bild-{i}.webp")
            alt = ref.beschreibung or f"Bild {i} von {req.name}"
            assets["bilder"].append({"src": f"bilder/bild-{i}.webp", "alt": alt})
        return assets

    def speichern(self, site_id: str, meta: dict, dateien: dict[str, str]) -> None:
        ordner = self.root / site_id
        meta = {**meta, "aktualisiert": datetime.now(UTC).isoformat()}
        (ordner / "meta.json").write_text(json.dumps(meta, ensure_ascii=False, indent=1), "utf-8")
        for name, inhalt in dateien.items():
            assert _TEXTDATEI.match(name), name
            (ordner / name).write_text(inhalt, "utf-8")

    def meta(self, site_id: str) -> dict:
        return json.loads((self._ordner(site_id) / "meta.json").read_text("utf-8"))

    def datei(self, site_id: str, name: str) -> str:
        if not _TEXTDATEI.match(name) or name.endswith(".svg"):
            raise SiteNotFound(name)
        pfad = self._ordner(site_id) / name
        if not pfad.is_file():
            raise SiteNotFound(name)
        return pfad.read_text("utf-8")

    def asset(self, site_id: str, name: str) -> tuple[bytes, str]:
        if not (_ASSET.match(name) or name == "favicon.svg"):
            raise SiteNotFound(name)
        pfad = self._ordner(site_id) / name
        if not pfad.is_file():
            raise SiteNotFound(name)
        return pfad.read_bytes(), _MEDIENTYP[pfad.suffix]

    def zip(self, site_id: str) -> bytes:
        ordner = self._ordner(site_id)
        puffer = io.BytesIO()
        with zipfile.ZipFile(puffer, "w", zipfile.ZIP_DEFLATED) as z:
            for datei in sorted(ordner.rglob("*")):
                if datei.is_file() and datei.name != "meta.json":
                    z.write(datei, datei.relative_to(ordner).as_posix())
        return puffer.getvalue()
