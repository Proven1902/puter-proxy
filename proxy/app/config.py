from __future__ import annotations

import os
from dataclasses import dataclass


ALLOWED_LOG_LEVELS = {"DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"}
LOCALHOST_ALLOWED = {"127.0.0.1"}


def _parse_bool(raw: str | None, *, default: bool) -> bool:
    if raw is None or raw.strip() == "":
        return default
    return raw.strip().lower() in {"1", "true", "yes", "on"}


def _parse_port(raw: str | None) -> int:
    value = (raw or "11435").strip()
    try:
        port = int(value)
    except ValueError as exc:
        raise ValueError(f"Invalid PORT value: {value}") from exc

    if port < 1 or port > 65535:
        raise ValueError(f"Invalid PORT value: {value}")

    return port


def _parse_host(raw: str | None) -> str:
    host = (raw or "127.0.0.1").strip()
    if host not in LOCALHOST_ALLOWED:
        raise ValueError(
            f"Invalid HOST value for localhost-only MVP: {host}. "
            "Allowed: 127.0.0.1"
        )
    return host


def _parse_log_level(raw: str | None) -> str:
    level = (raw or "INFO").strip().upper()
    if level not in ALLOWED_LOG_LEVELS:
        raise ValueError(
            f"Invalid LOG_LEVEL value: {raw!r}. "
            f"Allowed: {', '.join(sorted(ALLOWED_LOG_LEVELS))}"
        )
    return level


@dataclass(frozen=True)
class ProxyConfig:
    host: str
    port: int
    puter_token: str
    log_level: str
    proxy_feature_enabled: bool


def load_config(env: dict[str, str] | None = None) -> ProxyConfig:
    source = env if env is not None else os.environ

    host = _parse_host(source.get("HOST"))
    port = _parse_port(source.get("PORT"))
    token = (source.get("PUTER_TOKEN") or "").strip()
    log_level = _parse_log_level(source.get("LOG_LEVEL"))
    proxy_feature_enabled = _parse_bool(source.get("PROXY_FEATURE_ENABLED"), default=True)

    return ProxyConfig(
        host=host,
        port=port,
        puter_token=token,
        log_level=log_level,
        proxy_feature_enabled=proxy_feature_enabled,
    )


def validate_startup_guardrails(config: ProxyConfig) -> None:
    if config.host != "127.0.0.1":
        raise RuntimeError(
            f"MVP startup blocked: HOST must be localhost-only, got {config.host!r}"
        )


CONFIG = load_config()
validate_startup_guardrails(CONFIG)
