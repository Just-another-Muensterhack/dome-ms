"""Austauschbarer Modellzugang. Welcher Anbieter läuft, steht nur in der .env."""

import json
import logging
from typing import Protocol, TypeVar

import anthropic
import httpx
from pydantic import BaseModel, ValidationError

from app.config import Settings

log = logging.getLogger("site_generator.llm")
T = TypeVar("T", bound=BaseModel)


class LLMError(Exception):
    """Fehler, dessen Text an den Kunden gehen darf. Details landen nur im Log."""


class LLMClient(Protocol):
    def generate(self, system: str, user: str, schema: type[T]) -> T: ...


class AnthropicClient:
    def __init__(self, settings: Settings) -> None:
        if not settings.anthropic_api_key:
            raise RuntimeError("ANTHROPIC_API_KEY fehlt in der .env")
        self._client = anthropic.Anthropic(
            api_key=settings.anthropic_api_key.get_secret_value(),
            timeout=settings.llm_timeout_seconds,
            max_retries=2,
        )
        self._model = settings.anthropic_model
        self._effort = settings.anthropic_effort

    def generate(self, system: str, user: str, schema: type[T]) -> T:
        try:
            response = self._client.messages.parse(
                model=self._model,
                max_tokens=16000,
                system=system,
                messages=[{"role": "user", "content": user}],
                output_format=schema,
                output_config={"effort": self._effort},
            )
        except anthropic.RateLimitError as e:
            log.warning("anthropic rate limit: %s", e.status_code)
            raise LLMError("Der KI-Dienst ist gerade ausgelastet. Bitte gleich nochmal versuchen.")
        except anthropic.APIStatusError as e:
            log.error("anthropic status %s: %s", e.status_code, e.message)
            raise LLMError("Der KI-Dienst hat einen Fehler gemeldet.")
        except anthropic.APIConnectionError:
            log.exception("anthropic nicht erreichbar")
            raise LLMError("Der KI-Dienst ist nicht erreichbar.")

        log.info(
            "anthropic ok model=%s stop=%s in=%s out=%s",
            self._model,
            response.stop_reason,
            response.usage.input_tokens,
            response.usage.output_tokens,
        )
        if response.stop_reason == "refusal":
            raise LLMError("Die KI hat die Anfrage abgelehnt. Bitte Beschreibung prüfen.")
        if response.stop_reason == "max_tokens" or response.parsed_output is None:
            raise LLMError("Die KI-Antwort war unvollständig. Bitte nochmal versuchen.")
        return response.parsed_output


class OpenAICompatibleClient:
    """OpenAI, Azure OpenAI (v1-Endpunkt) und Ollama über dieselbe Chat-Completions-Schnittstelle."""

    def __init__(self, settings: Settings) -> None:
        headers = {}
        if settings.openai_api_key:
            key = settings.openai_api_key.get_secret_value()
            if "azure" in settings.openai_base_url:
                headers["api-key"] = key
            else:
                headers["Authorization"] = f"Bearer {key}"
        self._http = httpx.Client(
            base_url=settings.openai_base_url.rstrip("/"),
            headers=headers,
            timeout=settings.llm_timeout_seconds,
        )
        self._model = settings.openai_model

    def generate(self, system: str, user: str, schema: type[T]) -> T:
        schema_text = json.dumps(schema.model_json_schema(), ensure_ascii=False)
        messages = [
            {
                "role": "system",
                "content": f"{system}\n\nAntworte ausschließlich mit JSON nach diesem Schema:\n{schema_text}",
            },
            {"role": "user", "content": user},
        ]
        # Schwächere Modelle verfehlen das Schema manchmal; ein Versuch mit Fehlermeldung reicht meist.
        for versuch in range(2):
            raw = self._call(messages)
            try:
                return schema.model_validate_json(raw)
            except ValidationError as e:
                log.warning("schema verfehlt (versuch %s): %s", versuch + 1, e.error_count())
                messages += [
                    {"role": "assistant", "content": raw},
                    {
                        "role": "user",
                        "content": f"Das JSON ist ungültig: {e}. Bitte korrigiert komplett neu senden.",
                    },
                ]
        raise LLMError("Die KI hat keine gültige Seite geliefert. Bitte nochmal versuchen.")

    def _call(self, messages: list[dict]) -> str:
        try:
            r = self._http.post(
                "/chat/completions",
                json={
                    "model": self._model,
                    "messages": messages,
                    "response_format": {"type": "json_object"},
                },
            )
            r.raise_for_status()
            return r.json()["choices"][0]["message"]["content"]
        except httpx.HTTPStatusError as e:
            log.error("openai-kompatibel status %s", e.response.status_code)
            raise LLMError("Der KI-Dienst hat einen Fehler gemeldet.")
        except (httpx.HTTPError, KeyError, IndexError):
            log.exception("openai-kompatibel fehlgeschlagen")
            raise LLMError("Der KI-Dienst ist nicht erreichbar.")


def build_client(settings: Settings) -> LLMClient:
    if settings.llm_provider == "anthropic":
        return AnthropicClient(settings)
    if settings.llm_provider == "openai":
        return OpenAICompatibleClient(settings)
    from app.fake_llm import FakeClient

    return FakeClient()
