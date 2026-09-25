import pytest
from fastapi.testclient import TestClient

from app.config import Settings
from app.main import create_app


@pytest.fixture
def client(tmp_path):
    settings = Settings(
        llm_provider="fake", data_dir=tmp_path / "sites", rate_limit_per_minute=100, _env_file=None
    )
    with TestClient(create_app(settings)) as c:
        yield c


@pytest.fixture
def anfrage():
    return {
        "name": "SC Kinderhaus e. V.",
        "kategorie": "verein",
        "beschreibung": "Wir sind ein Breitensportverein im Norden von Münster mit Fußball und Turnen.",
        "ort": "Münster-Kinderhaus",
        "angebote": ["Fußball Jugend", "Turnen"],
        "zeiten": "Mo 17:00 Jugend\nMi 18:00 Turnen",
        "kontakt": {
            "email": "info@sc-kinderhaus.de",
            "telefon": "0251 123456",
            "adresse": "Sportweg 1, 48159 Münster",
        },
    }
