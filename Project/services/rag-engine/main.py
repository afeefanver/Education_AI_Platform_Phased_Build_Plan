"""RAG Engine Microservice."""

import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routes.notes import router as notes_router
from routes.syllabus import router as syllabus_router
from routes.tutor import router as tutor_router

logger = logging.getLogger(__name__)

app = FastAPI(
    title="Education AI Platform — RAG Engine",
    version="0.1.0",
    description="Syllabus indexing, AI note generation, and persona RAG tutor.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(syllabus_router)
app.include_router(notes_router)
app.include_router(tutor_router)


@app.get("/health")
async def health():
    return {"status": "ok", "service": "rag-engine"}
