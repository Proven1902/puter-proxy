import time

from fastapi import FastAPI
from fastapi import Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from proxy.app.config import CONFIG
from proxy.app.logging_utils import configure_proxy_logging, emit_request_log
from proxy.app.request_context import get_request_id
from proxy.app.routes.chat_completions import router as chat_router
from proxy.app.routes.healthz import router as health_router
from proxy.app.routes.models import router as models_router
from proxy.app.schemas.openai import error_body

configure_proxy_logging(CONFIG.log_level)


app = FastAPI(title="puter-local-proxy", version="0.1.0")
app.include_router(health_router)
app.include_router(models_router)
app.include_router(chat_router)


@app.middleware("http")
async def request_context_and_logging(request: Request, call_next):
    request.state.request_id = get_request_id(request)
    started = time.perf_counter()

    response = await call_next(request)

    latency_ms = int((time.perf_counter() - started) * 1000)
    request_id = get_request_id(request)
    response.headers["x-request-id"] = request_id

    model = getattr(request.state, "model", None)
    emit_request_log(
        route=request.url.path,
        status=response.status_code,
        latency_ms=latency_ms,
        model=model if isinstance(model, str) else None,
        request_id=request_id,
    )

    return response


@app.exception_handler(StarletteHTTPException)
async def handle_http_exception(request: Request, exc: StarletteHTTPException) -> JSONResponse:
    request_id = get_request_id(request)
    message = str(exc.detail) if exc.detail else "Request failed"
    if exc.status_code == 404:
        message = f"Route {request.url.path} is not supported in MVP"

    return JSONResponse(
        status_code=exc.status_code,
        content=error_body(
            code="invalid_request",
            message=message,
            request_id=request_id,
        ),
    )


@app.exception_handler(RequestValidationError)
async def handle_validation_error(request: Request, exc: RequestValidationError) -> JSONResponse:
    request_id = get_request_id(request)
    return JSONResponse(
        status_code=400,
        content=error_body(
            code="invalid_request",
            message="Request validation failed",
            request_id=request_id,
            details={"issues": exc.errors()},
        ),
    )


@app.exception_handler(Exception)
async def handle_internal_error(request: Request, _exc: Exception) -> JSONResponse:
    request_id = get_request_id(request)
    return JSONResponse(
        status_code=500,
        content=error_body(
            code="internal_error",
            message="Unexpected server error",
            request_id=request_id,
        ),
    )


@app.post("/v1/embeddings")
def embeddings_not_supported(request: Request) -> JSONResponse:
    request_id = get_request_id(request)
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
    request_id = get_request_id(request)
    return JSONResponse(
        status_code=404,
        content=error_body(
            code="invalid_request",
            message=f"Route /v1/{remaining_path} is not supported in MVP",
            request_id=request_id,
        ),
    )
