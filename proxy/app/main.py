import uuid

from fastapi import FastAPI
from fastapi import Request
from fastapi.responses import JSONResponse

from proxy.app.config import CONFIG
from proxy.app.routes.chat_completions import router as chat_router
from proxy.app.routes.healthz import router as health_router
from proxy.app.routes.models import router as models_router
from proxy.app.schemas.openai import error_body


app = FastAPI(title="puter-local-proxy", version="0.1.0")
app.include_router(health_router)
app.include_router(models_router)
app.include_router(chat_router)


@app.exception_handler(404)
async def handle_not_found(request: Request, _exc: Exception) -> JSONResponse:
    return JSONResponse(
        status_code=404,
        content=error_body(
            code="invalid_request",
            message=f"Route {request.url.path} is not supported in MVP",
            request_id=request.headers.get("x-request-id") or f"req_{uuid.uuid4().hex}",
        ),
    )


@app.post("/v1/embeddings")
def embeddings_not_supported(request: Request) -> JSONResponse:
    request_id = request.headers.get("x-request-id") or f"req_{uuid.uuid4().hex}"
    return JSONResponse(
        status_code=404,
        content=error_body(
            code="invalid_request",
            message="Route /v1/embeddings is not supported in MVP",
            request_id=request_id,
        ),
    )


@app.api_route("/v1/{remaining_path:path}", methods=["GET", "POST", "PUT", "PATCH", "DELETE"])
def unsupported_v1_route(remaining_path: str, request: Request) -> JSONResponse:
    request_id = request.headers.get("x-request-id") or f"req_{uuid.uuid4().hex}"
    return JSONResponse(
        status_code=404,
        content=error_body(
            code="invalid_request",
            message=f"Route /v1/{remaining_path} is not supported in MVP",
            request_id=request_id,
        ),
    )
