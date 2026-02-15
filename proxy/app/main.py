from importlib import import_module


FastAPI = import_module("fastapi").FastAPI
config_module = import_module("proxy.app.config")
CONFIG = config_module.CONFIG
validate_startup_guardrails = config_module.validate_startup_guardrails


validate_startup_guardrails(CONFIG)

app = FastAPI(title="puter-local-proxy", version="0.1.0")


@app.get("/healthz")
def healthz() -> dict[str, str]:
    return {"status": "ok"}
