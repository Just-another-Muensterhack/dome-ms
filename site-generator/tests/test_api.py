from app.render import farbschema, html_bereinigen


def test_health(client):
    assert client.get("/health").json()["status"] == "ok"


def test_erstellen_und_ausliefern(client, anfrage):
    r = client.post("/api/sites", json=anfrage)
    assert r.status_code == 201, r.text
    site = r.json()
    seite = client.get(site["preview_url"])
    assert seite.status_code == 200
    assert "SC Kinderhaus e. V." in seite.text
    assert "info@sc-kinderhaus.de" in seite.text
    assert "Mo 17:00 Jugend" in seite.text
    assert "script-src" not in seite.headers["content-security-policy"]
    assert "default-src 'none'" in seite.headers["content-security-policy"]
    assert client.get(site["preview_url"] + "impressum.html").status_code == 200
    zip_ = client.get(site["download_url"])
    assert zip_.headers["content-type"] == "application/zip"


def test_ohne_zeiten_kein_zeitenabschnitt(client, anfrage):
    anfrage["zeiten"] = ""
    site = client.post("/api/sites", json=anfrage).json()
    assert 'id="zeiten"' not in client.get(site["preview_url"]).text


def test_nur_pflichtfelder_reichen(client):
    r = client.post(
        "/api/sites",
        json={
            "name": "Café Lotte",
            "kategorie": "gastronomie",
            "beschreibung": "Kleines Café am Hafen.",
        },
    )
    assert r.status_code == 201, r.text


def test_eingaben_werden_escaped(client, anfrage):
    anfrage["name"] = "<script>alert(1)</script> FC"
    site = client.post("/api/sites", json=anfrage).json()
    html = client.get(site["preview_url"]).text
    assert "<script>alert(1)</script>" not in html
    assert "&lt;script&gt;" in html


def test_validierung(client, anfrage):
    anfrage["kontakt"]["email"] = "kein-mail"
    assert client.post("/api/sites", json=anfrage).status_code == 422
    assert client.post("/api/sites", json={"name": "X"}).status_code == 422
    anfrage["kontakt"]["email"] = ""
    anfrage["unbekannt"] = 1
    assert client.post("/api/sites", json=anfrage).status_code == 422


def test_aendern(client, anfrage):
    site = client.post("/api/sites", json=anfrage).json()
    r = client.post(
        f"/api/sites/{site['site_id']}/revise", json={"anweisung": "Probetraining hervorheben"}
    )
    assert r.status_code == 200, r.text
    assert "Probetraining hervorheben" in client.get(site["preview_url"]).text


def test_pfad_tricks(client):
    assert client.get("/sites/..%2F..%2Fetc/").status_code == 404
    assert client.get("/sites/abc/").status_code == 404
    assert client.get("/api/sites/" + "0" * 32 + "/download").status_code == 404


def test_html_modus(client, anfrage):
    anfrage["modus"] = "html"
    site = client.post("/api/sites", json=anfrage).json()
    html = client.get(site["preview_url"]).text
    assert "info@sc-kinderhaus.de" in html
    assert "{{KONTAKT}}" not in html


def test_sanitizer_entfernt_gefaehrliches():
    dreckig = (
        '<h1 onclick="x()">Hi</h1><script>alert(1)</script><iframe src="//evil"></iframe>'
        '<a href="javascript:alert(1)">x</a><img src=x onerror=alert(1)><form action="//evil"><input></form>'
    )
    sauber = html_bereinigen(dreckig)
    for boese in (
        "onclick",
        "<script",
        "alert(1)</",
        "<iframe",
        "javascript:",
        "onerror",
        "<form",
        "<img",
    ):
        assert boese not in sauber


def test_farbschema_kontrast():
    hell = farbschema("#ffe066")
    assert hell["auf_akzent"] == "#111111"
    assert hell["akzent_text"] != "#ffe066"
