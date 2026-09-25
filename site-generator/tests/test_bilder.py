import io
import zipfile

from PIL import Image

from app.images import initialen


def _png(farbe=(200, 30, 30), groesse=(300, 120)) -> bytes:
    b = io.BytesIO()
    Image.new("RGB", groesse, farbe).save(b, "PNG")
    return b.getvalue()


def _jpeg_mit_gps() -> bytes:
    bild = Image.new("RGB", (800, 600), (40, 120, 200))
    exif = Image.Exif()
    exif[0x010F] = "Kamera-Hersteller"
    exif[0x8825] = {2: (51.0, 57.0, 0.0), 4: (7.0, 37.0, 0.0)}  # GPS
    b = io.BytesIO()
    bild.save(b, "JPEG", exif=exif)
    return b.getvalue()


def _hoch(client, daten, art, name="x.png"):
    return client.post("/api/uploads", files={"datei": (name, daten)}, data={"art": art})


def test_logo_upload_mit_farbvorschlag(client):
    r = _hoch(client, _png(), "logo")
    assert r.status_code == 201, r.text
    assert r.json()["farbvorschlag"].startswith("#")
    assert client.get(r.json()["url"]).headers["content-type"] == "image/png"


def test_exif_wird_entfernt(client):
    r = _hoch(client, _jpeg_mit_gps(), "bild", "foto.jpg")
    assert r.status_code == 201, r.text
    bild = Image.open(io.BytesIO(client.get(r.json()["url"]).content))
    assert bild.format == "WEBP"
    assert not bild.getexif()


def test_svg_und_muell_werden_abgelehnt(client):
    svg = b'<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'
    assert _hoch(client, svg, "logo", "logo.svg").status_code == 422
    assert _hoch(client, b"GIF89a" + b"\0" * 50, "bild").status_code == 422
    assert _hoch(client, b"nur text", "bild").status_code == 422


def test_bildrechte_pflicht(client, anfrage):
    bild_id = _hoch(client, _png(), "bild").json()["upload_id"]
    anfrage["bilder"] = [{"id": bild_id, "beschreibung": "Mannschaftsfoto"}]
    assert client.post("/api/sites", json=anfrage).status_code == 422
    anfrage["bildrechte_bestaetigt"] = True
    assert client.post("/api/sites", json=anfrage).status_code == 201


def test_seite_mit_logo_und_bildern(client, anfrage):
    logo = _hoch(client, _png(), "logo").json()["upload_id"]
    bilder = [
        _hoch(client, _png((20, 100 + i * 30, 60)), "bild").json()["upload_id"] for i in range(3)
    ]
    anfrage.update(
        logo_id=logo,
        bilder=[{"id": b, "beschreibung": f"Training {i}"} for i, b in enumerate(bilder)],
        bildrechte_bestaetigt=True,
    )
    site = client.post("/api/sites", json=anfrage).json()
    html = client.get(site["preview_url"]).text
    assert 'src="bilder/logo.png"' in html
    assert 'href="favicon.png"' in html
    assert "hero__bild" in html and 'src="bilder/bild-1.webp"' in html
    assert "bilder/bild-3.webp" in html and 'alt="Training 2"' in html
    assert client.get(site["preview_url"] + "bilder/bild-2.webp").status_code == 200
    assert client.get(site["preview_url"] + "favicon.png").status_code == 200
    namen = zipfile.ZipFile(io.BytesIO(client.get(site["download_url"]).content)).namelist()
    assert {"index.html", "favicon.png", "bilder/logo.png", "bilder/bild-3.webp"} <= set(namen)
    assert "meta.json" not in namen


def test_ohne_logo_standardzeichen(client, anfrage):
    site = client.post("/api/sites", json=anfrage).json()
    html = client.get(site["preview_url"]).text
    assert 'class="logo monogramm"' in html and ">SK</text>" in html
    fav = client.get(site["preview_url"] + "favicon.svg")
    assert fav.status_code == 200 and fav.headers["content-type"].startswith("image/svg+xml")


def test_unbekannter_upload(client, anfrage):
    anfrage.update(logo_id="0" * 32, bildrechte_bestaetigt=True)
    assert client.post("/api/sites", json=anfrage).status_code == 422
    assert client.get("/sites/" + "0" * 32 + "/bilder/../meta.json").status_code == 404


def test_html_modus_bilder(client, anfrage):
    bild = _hoch(client, _png(), "bild").json()["upload_id"]
    anfrage.update(
        modus="html", bilder=[{"id": bild, "beschreibung": ""}], bildrechte_bestaetigt=True
    )
    site = client.post("/api/sites", json=anfrage).json()
    assert "{{" not in client.get(site["preview_url"]).text


def test_initialen():
    assert initialen("SC Kinderhaus 1921 e. V.") == "SK"
    assert initialen("Café Lotte") == "CL"
    assert initialen("Müller GmbH") == "Mü"
    assert initialen("123") == "1"


def test_alle_stile_rendern_mit_schriften(client, anfrage):
    for stil in ("klar", "warm", "modern"):
        anfrage["stil"] = stil
        site = client.post("/api/sites", json=anfrage).json()
        html = client.get(site["preview_url"]).text
        assert f'class="stil-{stil}"' in html
        assert client.get(site["preview_url"] + "fonts/schibsted-latin.woff2").status_code == 200
        assert (
            "font-src 'self'" in client.get(site["preview_url"]).headers["content-security-policy"]
        )
