from __future__ import annotations

import time
import uuid
from typing import Any

from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse

from proxy.app.adapters.puter_client import PuterClient, PuterClientError
from proxy.app.config import CONFIG
from proxy.app.schemas.openai import error_body, models_response

router = APIRouter(tags=["models"])


@router.get("/v1/models")
def get_models(request: Request) -> JSONResponse:
    request_id = request.headers.get("x-request-id") or f"req_{uuid.uuid4().hex}"
    client = PuterClient(token=CONFIG.puter_token)

    try:
        models = client.list_models()
    except PuterClientError as exc:
        status_code = 401 if exc.code in {"unauthorized", "token_missing"} else 502
        return JSONResponse(
            status_code=status_code,
            content=error_body(
                code=exc.code,
                message=str(exc),
                request_id=request_id,
                details=exc.details,
            ),
        )

    payload_items: list[dict[str, Any]] = []
    for model in models:
        row: dict[str, Any] = {
            "id": model.id,
            "object": "model",
            "created": int(time.time()),
            "owned_by": model.provider or "puter",
        }
        if model.name:
            row["name"] = model.name
        if model.context is not None:
            row["context"] = model.context
        if model.max_tokens is not None:
            row["max_tokens"] = model.max_tokens
        payload_items.append(row)

    return JSONResponse(status_code=200, content=models_response(payload_items))
