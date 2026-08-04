"""Tutor chat routes."""

import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from core.database import get_db
from core.deps import CurrentUser, get_current_user
from core.llm import llm_service
from core.vectorstore import vector_store
from shared_models.models import TutorMessage, TutorSession
from shared_models.schemas import (
    TutorMessageRequest,
    TutorMode,
    TutorResponse,
    TutorSessionCreate,
    TutorSessionResponse,
)

router = APIRouter(prefix="/tutor", tags=["tutor"])


@router.post("/session", response_model=TutorSessionResponse)
async def create_session(
    body: TutorSessionCreate,
    current: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> TutorSessionResponse:
    session = TutorSession(
        id=uuid.uuid4(),
        student_id=current.id,
        subject_id=body.subject_id,
        mode=body.mode.value,
    )
    db.add(session)
    await db.commit()
    await db.refresh(session)
    return TutorSessionResponse.model_validate(session)


@router.post("/message", response_model=TutorResponse)
async def send_message(
    body: TutorMessageRequest,
    current: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> TutorResponse:
    # Verify session exists
    res = await db.execute(select(TutorSession).where(TutorSession.id == body.session_id))
    session = res.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tutor session not found")

    # Record student message
    user_msg = TutorMessage(
        id=uuid.uuid4(),
        session_id=body.session_id,
        role="user",
        content=body.message,
    )
    db.add(user_msg)

    # Perform RAG vector search over student's organization & subject
    retrieved = vector_store.query(
        org_id=str(current.org_id),
        subject_id=str(session.subject_id),
        query_text=body.message,
        top_k=3,
    )
    context_sources = [item["text"] for item in retrieved]

    # Generate LLM response according to session persona mode
    mode_enum = TutorMode(session.mode)
    reply_text = await llm_service.generate_tutor_reply(
        message=body.message,
        mode=mode_enum,
        context=context_sources,
    )

    # Record assistant message
    assistant_msg = TutorMessage(
        id=uuid.uuid4(),
        session_id=body.session_id,
        role="assistant",
        content=reply_text,
    )
    db.add(assistant_msg)
    await db.commit()

    return TutorResponse(reply=reply_text, sources=context_sources)


@router.get("/sessions/{student_id}", response_model=list[TutorSessionResponse])
async def list_sessions(
    student_id: uuid.UUID,
    current: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[TutorSessionResponse]:
    result = await db.execute(select(TutorSession).where(TutorSession.student_id == student_id))
    sessions = result.scalars().all()
    return [TutorSessionResponse.model_validate(s) for s in sessions]
