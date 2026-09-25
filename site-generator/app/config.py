from functools import lru_cache
from pathlib import Path
from typing import Literal

from pydantic import SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # "fake" liefert Beispielinhalte ohne API-Key, damit das Frontend ohne Modell integrieren kann.
    llm_provider: Literal["anthropic", "openai", "fake"] = "fake"

    anthropic_api_key: SecretStr | None = None
    anthropic_model: str = "claude-opus-5"
    # Werbetexte brauchen keine tiefe Denkarbeit; niedriger Effort hält die Wartezeit in der Demo kurz.
    anthropic_effort: Literal["low", "medium", "high", "xhigh", "max"] = "low"

    # Alles, was OpenAI-kompatibel spricht: OpenAI, Azure OpenAI (v1-Endpunkt), Ollama.
    openai_api_key: SecretStr | None = None
    openai_base_url: str = "https://api.openai.com/v1"
    openai_model: str = "gpt-4.1"

    llm_timeout_seconds: float = 120.0

    data_dir: Path = Path("data/sites")
    allowed_origins: str = "http://localhost:3000,http://localhost:5173"
    rate_limit_per_minute: int = 10

    @property
    def origins(self) -> list[str]:
        return [o.strip() for o in self.allowed_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
