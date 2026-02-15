from __future__ import annotations

from dataclasses import dataclass
from typing import Any


@dataclass(frozen=True)
class OpenAIError:
    code: str
    message: str
    request_id: str
    details: dict[str, Any] | None = None

    def to_dict(self) -> dict[str, Any]:
        payload: dict[str, Any] = {
            "code": self.code,
            "message": self.message,
            "request_id": self.request_id,
        }
        if self.details:
            payload["details"] = self.details
        return payload


def error_body(
    *,
    code: str,
    message: str,
    request_id: str,
    details: dict[str, Any] | None = None,
    extra: dict[str, Any] | None = None,
) -> dict[str, Any]:
    payload: dict[str, Any] = {
        "error": OpenAIError(
            code=code,
            message=message,
            request_id=request_id,
            details=details,
        ).to_dict()
    }
    if extra:
        payload.update(extra)
    return payload


def models_response(items: list[dict[str, Any]]) -> dict[str, Any]:
    return {
        "object": "list",
        "data": items,
    }


def chat_completion_response(
    *,
    completion_id: str,
    model: str,
    content: str,
) -> dict[str, Any]:
    return {
        "id": completion_id,
        "object": "chat.completion",
        "created": 0,
        "model": model,
        "choices": [
            {
                "index": 0,
                "finish_reason": "stop",
                "message": {
                    "role": "assistant",
                    "content": content,
                },
            }
        ],
    }
