"""Notes generation routes."""

import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from core.deps import CurrentUser, get_current_user
from core.llm import llm_service
from core.vectorstore import vector_store
from shared_models.models import Note, SyllabusUnit
from shared_models.schemas import NoteGenerateRequest, NoteResponse

router = APIRouter(prefix="/notes", tags=["notes"])


@router.post("/generate", response_model=NoteResponse)
async def generate_notes(
    body: NoteGenerateRequest,
    current: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> NoteResponse:
    # Check if unit exists
    res = await db.execute(select(SyllabusUnit).where(SyllabusUnit.id == body.unit_id))
    unit = res.scalar_one_or_none()
    if not unit:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Syllabus unit not found")

    # Check cache for existing generated note of same type
    existing = await db.execute(
        select(Note).where(
            Note.unit_id == body.unit_id,
            Note.type == body.type.value,
        )
    )
    cached_note = existing.scalar_one_or_none()
    if cached_note:
        return NoteResponse.model_validate(cached_note)

    # Retrieve vector context
    retrieved = vector_store.query(
        org_id=str(current.org_id),
        subject_id=str(body.subject_id),
        query_text=unit.unit_name,
        top_k=2,
    )
    context_str = "\n".join([item["text"] for item in retrieved])

    # Generate via LLM
    content = await llm_service.generate_notes(
        unit_name=unit.unit_name,
        note_type=body.type,
        context=context_str,
    )

    note = Note(
        id=uuid.uuid4(),
        subject_id=body.subject_id,
        unit_id=body.unit_id,
        type=body.type.value,
        content=content,
    )
    db.add(note)
    await db.commit()
    await db.refresh(note)

    # Also index generated note into ChromaDB for future RAG tutor retrieval
    vector_store.add_documents(
        org_id=str(current.org_id),
        subject_id=str(body.subject_id),
        texts=[f"Notes for {unit.unit_name} ({body.type.value}):\n{content}"],
        metadatas=[{"unit_id": str(body.unit_id), "type": body.type.value}],
        ids=[str(note.id)],
    )

    return NoteResponse.model_validate(note)


@router.get("/{unit_id}", response_model=list[NoteResponse])
async def get_notes_by_unit(
    unit_id: uuid.UUID,
    current: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[NoteResponse]:
    result = await db.execute(select(Note).where(Note.unit_id == unit_id))
    notes = result.scalars().all()
    return [NoteResponse.model_validate(n) for n in notes]
