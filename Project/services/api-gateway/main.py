import logging
import time
from collections import defaultdict

from fastapi import FastAPI, Request, Response, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse


import httpx
from core.config import settings
from routes.auth import me_router, router as auth_router

logger = logging.getLogger(__name__)

app = FastAPI(
    title="Education AI Platform — API Gateway",
    version="0.1.0",
    description="Auth, routing, credits, and rate limiting entry point.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Simple in-memory rate limiter (Redis-backed in production)
_request_counts: dict[str, list[float]] = defaultdict(list)


@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    if request.url.path in ("/health", "/docs", "/openapi.json", "/redoc"):
        return await call_next(request)

    client_ip = request.client.host if request.client else "unknown"
    now = time.time()
    window_start = now - 60

    timestamps = _request_counts[client_ip]
    _request_counts[client_ip] = [t for t in timestamps if t > window_start]

    if len(_request_counts[client_ip]) >= settings.rate_limit_per_minute:
        return JSONResponse(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            content={"detail": "Rate limit exceeded"},
        )

    _request_counts[client_ip].append(now)
    return await call_next(request)


app.include_router(auth_router)
app.include_router(me_router)


async def _proxy_request(request: Request, target_base_url: str, target_path: str):
    url = f"{target_base_url}/{target_path.lstrip('/')}"
    headers = {k: v for k, v in request.headers.items() if k.lower() != "host"}
    body = await request.body()

    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            resp = await client.request(
                method=request.method,
                url=url,
                headers=headers,
                params=dict(request.query_params),
                content=body,
            )
            return Response(
                content=resp.content,
                status_code=resp.status_code,
                headers=dict(resp.headers),
            )
    except Exception as e:
        logger.error(f"Proxy request failed to {url}: {e}")
        return JSONResponse(
            status_code=status.HTTP_502_BAD_GATEWAY,
            content={"detail": f"Upstream service unavailable: {e}"},
        )


@app.api_route("/syllabus/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH"])
@app.api_route("/notes/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH"])
@app.api_route("/tutor/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH"])
@app.api_route("/rag/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH"])
async def proxy_to_rag(request: Request, path: str = ""):
    prefix = request.url.path.split("/")[1]
    full_target_path = f"{prefix}/{path}" if path else prefix
    return await _proxy_request(request, settings.rag_engine_url, full_target_path)


@app.api_route("/quiz/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH"])
async def proxy_to_quiz(request: Request, path: str = ""):
    full_target_path = f"quiz/{path}" if path else "quiz"
    return await _proxy_request(request, settings.quiz_engine_url, full_target_path)


@app.get("/health")
async def health():
    return {"status": "ok", "service": "api-gateway"}

