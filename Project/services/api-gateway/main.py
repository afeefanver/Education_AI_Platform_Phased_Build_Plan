import logging
import time
from collections import defaultdict

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

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


@app.get("/health")
async def health():
    return {"status": "ok", "service": "api-gateway"}
