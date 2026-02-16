from __future__ import annotations

import json
import logging
import time
from typing import Any


LOGGER = logging.getLogger("proxy.app")

RESERVED_FIELDS = {"ts", "route", "status", "latency_ms", "request_id", "model"}


def configure_proxy_logging(level: str) -> None:
    numeric = getattr(logging, level.upper(), logging.INFO)
    LOGGER.handlers.clear()
    handler = logging.StreamHandler()
    formatter = logging.Formatter("%(message)s")
    handler.setFormatter(formatter)
    LOGGER.addHandler(handler)
    LOGGER.setLevel(numeric)


def emit_request_log(
    *,
    route: str,
    status: int,
    latency_ms: int,
    model: str | None,
    request_id: str,
    extra: dict[str, Any] | None = None,
) -> None:
    payload: dict[str, Any] = {
        "ts": int(time.time() * 1000),
        "route": route,
        "status": status,
        "latency_ms": latency_ms,
        "request_id": request_id,
    }

    if model:
        payload["model"] = model

    if extra:
        for key, value in extra.items():
            if key in RESERVED_FIELDS:
                continue
            payload[key] = value

    LOGGER.info(json.dumps(payload, ensure_ascii=False, sort_keys=True))
