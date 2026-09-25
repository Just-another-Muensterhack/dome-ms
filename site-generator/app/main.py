import logging
import threading
import time
from collections import defaultdict, deque
from contextlib import asynccontextmanager
from pathlib import Path

from typing import Literal

from fastapi import Depends, FastAPI, File, Form, HTTPException, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, HTMLResponse, JSONResponse, RedirectResponse, Response
from fastapi.staticfiles import StaticFiles

from app.config import Settings, get_settings
from app.generator import Generator
from app.images import MAX_BYTES, BildFehler, bild_verarbeiten, logo_verarbeiten
from app.llm import LLMError, build_client
from app.schemas import ReviseRequest, SiteRequest, SiteResponse, UploadResponse
from app.storage import SiteNotFound, Storage, UploadFehlt

logging.basicConfig(
    level=logging.INFO,
    format='{"t":"%(asctime)s","lvl":"%(levelname)s","log":"%(name)s","msg":"%(message)s"}',
)
log = logging.getLogger("site_generator.api")
STATIC = Path(__file__).parent / "static"


class RateLimiter:
    """Einfaches Fenster pro IP im Speicher. Reicht für einen Prozess, bei mehreren Instanzen Redis."""

    def __init__(self, pro_minute: int) -> None:
        self.pro_minute = pro_minute
        self._treffer: dict[str, deque[float]] = defaultdict(deque)
        self._lock = threading.Lock()

    def __call__(self, request: Request) -> None:
        ip = request.client.host if request.client else "unbekannt"
        jetzt = time.monotonic()
        with self._lock:
            q = self._treffer[ip]
            while q and jetzt - q[0] > 60:
                q.popleft()
            if len(q) >= self.pro_minute:
                raise HTTPException(429, "Zu viele Anfragen. Bitte eine Minute warten.")
            q.append(jetzt)


def create_app(settings: Settings | None = None) -> FastAPI:
    settings = settings or get_settings()
    limiter = RateLimiter(settings.rate_limit_per_minute)
    upload_limiter = RateLimiter(settings.rate_limit_per_minute * 4)

    @asynccontextmanager
    async def lifespan(app: FastAPI):
        storage = Storage(settings.data_dir)
        app.state.generator = Generator(build_client(settings), storage)
        # Datensparsamkeit: Uploads, aus denen nie eine Seite wurde, bleiben nicht liegen.
        geloescht = storage.alte_uploads_loeschen(stunden=24)
        log.info(
            "gestartet provider=%s alte_uploads_geloescht=%s", settings.llm_provider, geloescht
        )
        yield

    app = FastAPI(title="KI-Website-Generator", version="0.1.0", lifespan=lifespan)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.origins,
        allow_methods=["GET", "POST"],
        allow_headers=["Content-Type"],
    )

    # Generierte Seiten dürfen nichts ausführen und nichts nachladen, auch wenn das Modell es versucht.
    einbetten = " ".join(["'self'", *settings.origins])
    site_csp = (
        "default-src 'none'; style-src 'unsafe-inline'; img-src 'self' data:; font-src 'self'; "
        "base-uri 'none'; "
        f"form-action 'none'; frame-ancestors {einbetten}"
    )
    app_csp = (
        "default-src 'self'; img-src 'self' data:; frame-src 'self'; object-src 'none'; "
        "base-uri 'none'; frame-ancestors 'none'"
    )

    @app.middleware("http")
    async def sicherheits_header(request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["Referrer-Policy"] = "no-referrer"
        if request.url.path.startswith("/sites/"):
            response.headers["Content-Security-Policy"] = site_csp
        elif "Content-Security-Policy" not in response.headers:
            response.headers["Content-Security-Policy"] = app_csp
            response.headers["X-Frame-Options"] = "DENY"
        return response

    @app.exception_handler(LLMError)
    async def llm_fehler(_: Request, exc: LLMError):
        return JSONResponse({"detail": str(exc)}, status_code=502)

    @app.exception_handler(UploadFehlt)
    async def upload_fehlt(_: Request, __: UploadFehlt):
        return JSONResponse(
            {"detail": "Ein Bild ist abgelaufen. Bitte Logo und Bilder neu hochladen."},
            status_code=422,
        )

    @app.exception_handler(BildFehler)
    async def bild_fehler(_: Request, exc: BildFehler):
        return JSONResponse({"detail": str(exc)}, status_code=422)

    @app.exception_handler(SiteNotFound)
    async def nicht_gefunden(_: Request, __: SiteNotFound):
        return JSONResponse({"detail": "Seite nicht gefunden."}, status_code=404)

    def generator(request: Request) -> Generator:
        return request.app.state.generator

    def antwort(site_id: str, modus: str, titel: str) -> SiteResponse:
        return SiteResponse(
            site_id=site_id,
            modus=modus,
            preview_url=f"/sites/{site_id}/",
            download_url=f"/api/sites/{site_id}/download",
            seitentitel=titel,
        )

    @app.get("/health")
    def health():
        return {"status": "ok", "provider": settings.llm_provider}

    @app.post(
        "/api/sites", response_model=SiteResponse, status_code=201, dependencies=[Depends(limiter)]
    )
    def seite_erstellen(req: SiteRequest, gen: Generator = Depends(generator)):
        site_id, titel = gen.erstellen(req)
        return antwort(site_id, req.modus, titel)

    @app.post(
        "/api/sites/{site_id}/revise", response_model=SiteResponse, dependencies=[Depends(limiter)]
    )
    def seite_aendern(site_id: str, body: ReviseRequest, gen: Generator = Depends(generator)):
        titel = gen.aendern(site_id, body.anweisung)
        modus = gen.storage.meta(site_id)["request"]["modus"]
        return antwort(site_id, modus, titel)

    @app.post(
        "/api/uploads",
        response_model=UploadResponse,
        status_code=201,
        dependencies=[Depends(upload_limiter)],
    )
    def hochladen(
        datei: UploadFile = File(...),
        art: Literal["logo", "bild"] = Form(...),
        gen: Generator = Depends(generator),
    ):
        daten = datei.file.read(MAX_BYTES + 1)
        if art == "logo":
            png, farbe = logo_verarbeiten(daten)
            upload_id = gen.storage.upload_speichern(png, "png")
            return UploadResponse(
                upload_id=upload_id, url=f"/api/uploads/{upload_id}", farbvorschlag=farbe
            )
        upload_id = gen.storage.upload_speichern(bild_verarbeiten(daten), "webp")
        return UploadResponse(upload_id=upload_id, url=f"/api/uploads/{upload_id}")

    @app.get("/api/uploads/{upload_id}", include_in_schema=False)
    def upload_ansehen(upload_id: str, gen: Generator = Depends(generator)):
        try:
            pfad = gen.storage.upload_pfad(upload_id)
        except UploadFehlt:
            raise SiteNotFound(upload_id)
        return FileResponse(pfad, media_type="image/png" if pfad.suffix == ".png" else "image/webp")

    @app.get("/api/sites/{site_id}/download")
    def seite_download(site_id: str, gen: Generator = Depends(generator)):
        return Response(
            gen.storage.zip(site_id),
            media_type="application/zip",
            headers={"Content-Disposition": f'attachment; filename="website-{site_id[:8]}.zip"'},
        )

    @app.get("/sites/{site_id}", include_in_schema=False)
    def ohne_slash(site_id: str):
        return RedirectResponse(f"/sites/{site_id}/", status_code=308)

    @app.get("/sites/{site_id}/bilder/{name}", include_in_schema=False)
    def bild_ausliefern(site_id: str, name: str, gen: Generator = Depends(generator)):
        daten, typ = gen.storage.asset(site_id, f"bilder/{name}")
        return Response(daten, media_type=typ, headers={"Cache-Control": "public, max-age=300"})

    @app.get("/sites/{site_id}/fonts/{name}", include_in_schema=False)
    def schrift_ausliefern(site_id: str, name: str, gen: Generator = Depends(generator)):
        daten, typ = gen.storage.asset(site_id, f"fonts/{name}")
        return Response(daten, media_type=typ, headers={"Cache-Control": "public, max-age=86400"})

    @app.get("/sites/{site_id}/favicon.{endung}", include_in_schema=False)
    def favicon_ausliefern(site_id: str, endung: str, gen: Generator = Depends(generator)):
        daten, typ = gen.storage.asset(site_id, f"favicon.{endung}")
        return Response(daten, media_type=typ)

    @app.get("/sites/{site_id}/", response_class=HTMLResponse, include_in_schema=False)
    @app.get("/sites/{site_id}/{datei}", response_class=HTMLResponse, include_in_schema=False)
    def seite_ausliefern(
        site_id: str, datei: str = "index.html", gen: Generator = Depends(generator)
    ):
        return HTMLResponse(gen.storage.datei(site_id, datei))

    @app.get("/", include_in_schema=False)
    def startseite():
        # Ohne no-cache sehen Nutzer nach einem Update die alte Seite mit alten CSS-Verweisen.
        return FileResponse(STATIC / "index.html", headers={"Cache-Control": "no-cache"})

    app.mount("/static", StaticFiles(directory=STATIC), name="static")
    return app


app = create_app()
