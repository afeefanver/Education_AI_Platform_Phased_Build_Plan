"""Tests for RAG Engine."""

import pytest
from httpx import ASGITransport, AsyncClient

from main import app
from core.llm import llm_service
from shared_models.schemas import NoteType, TutorMode


@pytest.mark.asyncio
async def test_rag_health():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.get("/health")
        assert resp.status_code == 200
        assert resp.json() == {"status": "ok", "service": "rag-engine"}


@pytest.mark.asyncio
async def test_llm_notes_generation():
    notes = await llm_service.generate_notes("Linear Algebra", NoteType.DETAILED, "Vectors and Matrices")
    assert "# Detailed Study Notes" in notes or "Linear Algebra" in notes


@pytest.mark.asyncio
async def test_llm_tutor_response():
    reply = await llm_service.generate_tutor_reply("Explain Eigenvalues", TutorMode.BEGINNER, ["Eigenvalues scale vectors"])
    assert "Eigenvalues" in reply or "simple terms" in reply or "Tutor" in reply
