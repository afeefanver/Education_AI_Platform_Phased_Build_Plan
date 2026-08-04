"""Quiz Engine Microservice."""

import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routes.quiz import router as quiz_router

logger = logging.getLogger(__name__)

app = FastAPI(
    title="Education AI Platform — Quiz Engine",
    version="0.1.0",
    description="Quiz question generation, validation, and attempt scoring.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(quiz_router)


@app.get("/health")
async def health():
    return {"status": "ok", "service": "quiz-engine"}
