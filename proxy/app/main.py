from fastapi import FastAPI

from proxy.app.config import CONFIG, validate_startup_guardrails


validate_startup_guardrails(CONFIG)

app = FastAPI(title="puter-local-proxy", version="0.1.0")


@app.get("/healthz")
def healthz() -> dict[str, str]:
    return {"status": "ok"}
