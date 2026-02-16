from __future__ import annotations

import uuid

from fastapi import Request


def get_request_id(request: Request) -> str:
    state_value = getattr(request.state, "request_id", None)
    if isinstance(state_value, str) and state_value.strip():
        return state_value

    header_value = request.headers.get("x-request-id")
    if header_value and header_value.strip():
        return header_value.strip()

    return f"req_{uuid.uuid4().hex}"
