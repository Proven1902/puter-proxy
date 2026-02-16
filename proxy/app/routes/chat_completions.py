from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Request
from fastapi.concurrency import run_in_threadpool
from fastapi.responses import JSONResponse

from proxy.app.adapters.puter_client import PuterClientError
from proxy.app.request_context import get_request_id
from proxy.app.schemas.openai import chat_completion_response, error_body
from proxy.app.services.auth import build_puter_client

router = APIRouter(tags=["chat"])


@router.post("/v1/chat/completions")
async def create_chat_completion(request: Request) -> JSONResponse:
    request_id = get_request_id(request)
    try:
        payload = await request.json()
    except Exception:
        return JSONResponse(
            status_code=400,
            content=error_body(
                code="invalid_request",
                message="Request body must be valid JSON",
                request_id=request_id,
            ),
        )

    if not isinstance(payload, dict):
        return JSONResponse(
            status_code=400,
            content=error_body(
                code="invalid_request",
                message="Request body must be a JSON object",
                request_id=request_id,
            ),
        )

    stream_value = payload.get("stream", False)
    if not isinstance(stream_value, bool):
        return JSONResponse(
            status_code=400,
            content=error_body(
                code="invalid_request",
                message="Field 'stream' must be a boolean",
                request_id=request_id,
            ),
        )
    if stream_value:
        return JSONResponse(
            status_code=501,
            content=error_body(
                code="streaming_not_supported",
                message="Streaming is not supported in MVP",
                request_id=request_id,
                extra={"streaming_not_supported": True},
            ),
        )

    model = payload.get("model")
    messages = payload.get("messages")
    if not isinstance(model, str) or not model.strip():
        return JSONResponse(
            status_code=400,
            content=error_body(
                code="invalid_request",
                message="Field 'model' must be a non-empty string",
                request_id=request_id,
            ),
        )
    if not isinstance(messages, list) or not messages:
        return JSONResponse(
            status_code=400,
            content=error_body(
                code="invalid_request",
                message="Field 'messages' must be a non-empty array",
                request_id=request_id,
            ),
        )

    model_name = model.strip()
    request.state.model = model_name

    temperature_raw = payload.get("temperature")
    temperature: float | None = None
    if temperature_raw is not None:
        if not isinstance(temperature_raw, (int, float)) or isinstance(temperature_raw, bool):
            return JSONResponse(
                status_code=400,
                content=error_body(
                    code="invalid_request",
                    message="Field 'temperature' must be a number",
                    request_id=request_id,
                ),
            )
        temperature = float(temperature_raw)

    max_tokens_raw = payload.get("max_tokens")
    max_tokens: int | None = None
    if max_tokens_raw is not None:
        if not isinstance(max_tokens_raw, int) or isinstance(max_tokens_raw, bool) or max_tokens_raw < 1:
            return JSONResponse(
                status_code=400,
                content=error_body(
                    code="invalid_request",
                    message="Field 'max_tokens' must be a positive integer",
                    request_id=request_id,
                ),
            )
        max_tokens = max_tokens_raw

    tools_raw = payload.get("tools")
    tools: list[dict[str, Any]] | None = None
    if tools_raw is not None:
        if not isinstance(tools_raw, list) or not all(isinstance(item, dict) for item in tools_raw):
            return JSONResponse(
                status_code=400,
                content=error_body(
                    code="invalid_request",
                    message="Field 'tools' must be an array of objects",
                    request_id=request_id,
                ),
            )
        tools = tools_raw

    normalized_messages: list[dict[str, Any]] = []
    for index, item in enumerate(messages):
        if not isinstance(item, dict):
            return JSONResponse(
                status_code=400,
                content=error_body(
                    code="invalid_request",
                    message=f"messages[{index}] must be an object",
                    request_id=request_id,
                ),
            )

        role = item.get("role")
        content = item.get("content")

        if not isinstance(role, str) or role.strip() == "":
            return JSONResponse(
                status_code=400,
                content=error_body(
                    code="invalid_request",
                    message=f"messages[{index}].role must be a non-empty string",
                    request_id=request_id,
                ),
            )

        if not isinstance(content, str) or content.strip() == "":
            return JSONResponse(
                status_code=400,
                content=error_body(
                    code="invalid_request",
                    message=f"messages[{index}].content must be a non-empty string",
                    request_id=request_id,
                ),
            )

        normalized_messages.append({"role": role, "content": content})

    client = build_puter_client()

    try:
        result = await run_in_threadpool(
            client.chat_completion,
            model=model_name,
            messages=normalized_messages,
            temperature=temperature,
            max_tokens=max_tokens,
            tools=tools,
        )
    except PuterClientError as exc:
        if exc.code in {"unauthorized", "token_missing"}:
            status_code = 401
        elif exc.code == "model_not_found":
            status_code = 404
        elif exc.code == "upstream_timeout":
            status_code = 504
        else:
            status_code = 502
        return JSONResponse(
            status_code=status_code,
            content=error_body(
                code=exc.code,
                message=str(exc),
                request_id=request_id,
                details=exc.details,
            ),
        )

    return JSONResponse(
        status_code=200,
        content=chat_completion_response(
            completion_id=result["id"],
            model=result["model"],
            content=result["content"],
        ),
    )
