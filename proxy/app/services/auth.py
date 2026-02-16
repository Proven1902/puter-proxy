from __future__ import annotations

from proxy.app.adapters.puter_client import PuterClient
from proxy.app.config import CONFIG


def current_puter_token() -> str:
    return CONFIG.puter_token.strip()


def build_puter_client() -> PuterClient:
    return PuterClient(token=current_puter_token())
