from __future__ import annotations

import importlib
import os
import sys

from fastapi.testclient import TestClient


def _fresh_client(env: dict[str, str]) -> tuple[TestClient, dict[str, str | None]]:
    previous: dict[str, str | None] = {}
    for key, value in env.items():
        previous[key] = os.environ.get(key)
        os.environ[key] = value

    for module_name in list(sys.modules):
        if module_name.startswith("proxy.app"):
            sys.modules.pop(module_name, None)

    mod = importlib.import_module("proxy.app.main")
    return TestClient(mod.app), previous


def _restore_env(previous: dict[str, str | None]) -> None:
    for key, value in previous.items():
        if value is None:
            os.environ.pop(key, None)
        else:
            os.environ[key] = value


def test_healthz_ok() -> None:
    client, previous = _fresh_client(
        {
            "PUTER_TOKEN": "pt_task7_proxy",
            "HOST": "127.0.0.1",
            "PORT": "11435",
            "LOG_LEVEL": "INFO",
            "PROXY_FEATURE_ENABLED": "1",
        }
    )

    try:
        response = client.get("/healthz")

        assert response.status_code == 200
        assert response.json() == {"status": "ok"}
    finally:
        _restore_env(previous)


def test_models_without_token_returns_structured_error() -> None:
    client, previous = _fresh_client(
        {
            "PUTER_TOKEN": "",
            "HOST": "127.0.0.1",
            "PORT": "11435",
            "LOG_LEVEL": "INFO",
            "PROXY_FEATURE_ENABLED": "1",
        }
    )

    try:
        response = client.get("/v1/models")

        assert response.status_code == 401
        payload = response.json()["error"]
        assert payload["code"] in {"token_missing", "unauthorized"}
        assert payload["request_id"]
    finally:
        _restore_env(previous)


def test_chat_stream_true_rejected() -> None:
    client, previous = _fresh_client(
        {
            "PUTER_TOKEN": "pt_task7_proxy",
            "HOST": "127.0.0.1",
            "PORT": "11435",
            "LOG_LEVEL": "INFO",
            "PROXY_FEATURE_ENABLED": "1",
        }
    )

    try:
        response = client.post(
            "/v1/chat/completions",
            json={
                "model": "gpt-5-nano",
                "messages": [{"role": "user", "content": "ping"}],
                "stream": True,
            },
        )

        assert response.status_code == 501
        payload = response.json()["error"]
        assert payload["code"] == "streaming_not_supported"
        assert payload["request_id"]
    finally:
        _restore_env(previous)


def test_embeddings_contract_rejected() -> None:
    client, previous = _fresh_client(
        {
            "PUTER_TOKEN": "pt_task7_proxy",
            "HOST": "127.0.0.1",
            "PORT": "11435",
            "LOG_LEVEL": "INFO",
            "PROXY_FEATURE_ENABLED": "1",
        }
    )

    try:
        response = client.post("/v1/embeddings", json={"model": "text-embedding-3-small", "input": "ping"})

        assert response.status_code == 404
        payload = response.json()["error"]
        assert payload["code"] == "invalid_request"
        assert payload["request_id"]
    finally:
        _restore_env(previous)
