from __future__ import annotations

import uuid
from dataclasses import dataclass
from typing import Any

import httpx


class PuterClientError(Exception):
    def __init__(self, *, code: str, message: str, details: dict[str, Any] | None = None) -> None:
        super().__init__(message)
        self.code = code
        self.details = details or {}


@dataclass(frozen=True)
class PuterModel:
    id: str
    provider: str | None = None
    name: str | None = None
    context: int | None = None
    max_tokens: int | None = None


class PuterClient:
    def __init__(self, *, token: str, timeout_seconds: float = 30.0) -> None:
        self._token = token.strip()
        self._timeout = timeout_seconds

    @property
    def has_token(self) -> bool:
        return bool(self._token)

    def _headers(self) -> dict[str, str]:
        return {
            "Authorization": f"Bearer {self._token}",
            "Content-Type": "application/json",
            "Origin": "https://puter.com",
            "User-Agent": "puter-proxy-mvp/0.1",
        }

    def list_models(self) -> list[PuterModel]:
        if not self.has_token:
            raise PuterClientError(code="token_missing", message="Puter token is not configured")

        url = "https://api.puter.com/puterai/chat/models/details"
        try:
            with httpx.Client(timeout=self._timeout) as client:
                response = client.get(url, headers=self._headers())
        except httpx.TimeoutException as exc:
            raise PuterClientError(code="upstream_timeout", message="Puter models request timed out") from exc
        except httpx.HTTPError as exc:
            raise PuterClientError(code="upstream_error", message="Puter models request failed") from exc

        if response.status_code in {401, 403}:
            raise PuterClientError(code="unauthorized", message="Puter token is unauthorized")
        if response.status_code >= 400:
            raise PuterClientError(
                code="upstream_error",
                message=f"Puter models request returned HTTP {response.status_code}",
            )

        payload = response.json()
        raw_items = _extract_models_payload(payload)
        if not isinstance(raw_items, list):
            raise PuterClientError(code="upstream_error", message="Unexpected models payload from Puter")

        models: list[PuterModel] = []
        for item in raw_items:
            if not isinstance(item, dict):
                continue
            model_id = str(item.get("id") or "").strip()
            if not model_id:
                continue
            context = item.get("context")
            max_tokens = item.get("max_tokens")
            models.append(
                PuterModel(
                    id=model_id,
                    provider=_opt_str(item.get("provider")),
                    name=_opt_str(item.get("name")),
                    context=context if isinstance(context, int) else None,
                    max_tokens=max_tokens if isinstance(max_tokens, int) else None,
                )
            )

        return models

    def chat_completion(
        self,
        *,
        model: str,
        messages: list[dict[str, Any]],
        temperature: float | None = None,
        max_tokens: int | None = None,
        tools: list[dict[str, Any]] | None = None,
    ) -> dict[str, Any]:
        if not self.has_token:
            raise PuterClientError(code="token_missing", message="Puter token is not configured")

        url = "https://api.puter.com/drivers/call"
        args_payload: dict[str, Any] = {
            "model": model,
            "messages": messages,
            "stream": False,
        }
        if temperature is not None:
            args_payload["temperature"] = temperature
        if max_tokens is not None:
            args_payload["max_tokens"] = max_tokens
        if tools is not None:
            args_payload["tools"] = tools

        payload = {
            "interface": "puter-chat-completion",
            "method": "complete",
            "args": args_payload,
        }

        try:
            with httpx.Client(timeout=self._timeout) as client:
                response = client.post(url, headers=self._headers(), json=payload)
        except httpx.TimeoutException as exc:
            raise PuterClientError(code="upstream_timeout", message="Puter chat request timed out") from exc
        except httpx.HTTPError as exc:
            raise PuterClientError(code="upstream_error", message="Puter chat request failed") from exc

        if response.status_code in {401, 403}:
            raise PuterClientError(code="unauthorized", message="Puter token is unauthorized")
        if response.status_code == 404:
            raise PuterClientError(code="model_not_found", message="Requested model was not found")
        if response.status_code >= 400:
            raise PuterClientError(
                code="upstream_error",
                message=f"Puter chat request returned HTTP {response.status_code}",
            )

        data = response.json()
        if not isinstance(data, dict):
            raise PuterClientError(code="upstream_error", message="Unexpected chat payload from Puter")
        if data.get("success") is False:
            raise PuterClientError(
                code="upstream_error",
                message=str(data.get("error") or "Puter reported an error"),
            )

        result = data.get("result")
        content = _extract_content(result)
        if content is None or content.strip() == "":
            raise PuterClientError(
                code="upstream_error",
                message="Unable to extract assistant content from Puter response",
            )
        return {
            "id": str(data.get("id") or f"chatcmpl_{uuid.uuid4().hex}"),
            "model": model,
            "content": content,
        }


def _extract_content(result: Any) -> str | None:
    if isinstance(result, str):
        return result
    if isinstance(result, dict):
        text = result.get("text")
        if isinstance(text, str):
            return text
        choices = result.get("choices")
        if isinstance(choices, list) and choices:
            first = choices[0]
            if isinstance(first, dict):
                message = first.get("message")
                if isinstance(message, dict):
                    content = message.get("content")
                    if isinstance(content, str):
                        return content
        message = result.get("message")
        if isinstance(message, dict):
            content = message.get("content")
            if isinstance(content, str):
                return content
    return None


def _opt_str(value: Any) -> str | None:
    if isinstance(value, str):
        out = value.strip()
        return out or None
    return None


def _extract_models_payload(payload: Any) -> list[Any] | None:
    if isinstance(payload, list):
        return payload
    if not isinstance(payload, dict):
        return None

    direct = payload.get("models")
    if isinstance(direct, list):
        return direct

    data = payload.get("data")
    if isinstance(data, list):
        return data

    result = payload.get("result")
    if isinstance(result, list):
        return result
    if isinstance(result, dict):
        nested_models = result.get("models")
        if isinstance(nested_models, list):
            return nested_models
        nested_data = result.get("data")
        if isinstance(nested_data, list):
            return nested_data

    return None
