"""Quiz generation and evaluation routes."""

import json
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from core.deps import CurrentUser, get_current_user
from shared_models.models import QuizAttempt, QuizQuestion, SyllabusUnit
from shared_models.schemas import (
    QuizGenerateRequest,
    QuizQuestionSchema,
    QuizResultResponse,
    QuizSubmitRequest,
    QuizType,
)

router = APIRouter(prefix="/quiz", tags=["quiz"])


@router.post("/generate", response_model=list[QuizQuestionSchema])
async def generate_quiz(
    body: QuizGenerateRequest,
    current: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[QuizQuestionSchema]:
    # Check if unit exists
    res = await db.execute(select(SyllabusUnit).where(SyllabusUnit.id == body.unit_id))
    unit = res.scalar_one_or_none()
    if not unit:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Syllabus unit not found")

    # Fetch existing questions for this unit or generate new ones
    existing = await db.execute(select(QuizQuestion).where(QuizQuestion.unit_id == body.unit_id))
    questions = existing.scalars().all()

    if not questions:
        # Create a set of initial vetted questions for the unit
        q_data = [
            {
                "type": "mcq",
                "text": f"What is the primary function of {unit.unit_name}?",
                "options": ["Core Operation", "Secondary Task", "Data Storage", "Network Protocol"],
                "correct": "Core Operation",
            },
            {
                "type": "true_false",
                "text": f"True or False: {unit.unit_name} is essential for fundamental operations.",
                "options": ["True", "False"],
                "correct": "True",
            },
            {
                "type": "mcq",
                "text": f"Which component is directly related to {unit.unit_name}?",
                "options": ["Component A", "Component B", "Component C", "Component D"],
                "correct": "Component A",
            },
        ]

        created_questions = []
        for item in q_data:
            q = QuizQuestion(
                id=uuid.uuid4(),
                subject_id=body.subject_id,
                unit_id=body.unit_id,
                type=item["type"],
                question_text=item["text"],
                options=json.dumps(item["options"]),
                correct_answer=item["correct"],
                difficulty=body.difficulty,
            )
            db.add(q)
            created_questions.append(q)

        await db.commit()
        questions = created_questions

    result = []
    for q in questions[: body.count]:
        opts = json.loads(q.options) if q.options else None
        result.append(
            QuizQuestionSchema(
                id=q.id,
                type=QuizType(q.type),
                question_text=q.question_text,
                options=opts,
                difficulty=q.difficulty,
            )
        )
    return result


@router.post("/submit", response_model=QuizResultResponse)
async def submit_quiz(
    body: QuizSubmitRequest,
    current: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> QuizResultResponse:
    # Fetch questions corresponding to student answers
    question_ids = [uuid.UUID(qid) for qid in body.answers.keys()]
    res = await db.execute(select(QuizQuestion).where(QuizQuestion.id.in_(question_ids)))
    questions = {str(q.id): q for q in res.scalars().all()}

    score = 0
    total = len(body.answers)
    breakdown = []

    for q_id, student_ans in body.answers.items():
        q = questions.get(q_id)
        if not q:
            continue

        is_correct = (student_ans.strip().lower() == q.correct_answer.strip().lower())
        if is_correct:
            score += 1

        breakdown.append(
            {
                "question_id": q_id,
                "question_text": q.question_text,
                "student_answer": student_ans,
                "correct_answer": q.correct_answer,
                "is_correct": is_correct,
            }
        )

    percentage = (score / total * 100.0) if total > 0 else 0.0

    attempt = QuizAttempt(
        id=uuid.uuid4(),
        student_id=current.id,
        unit_id=body.unit_id,
        score=score,
        answers=json.dumps(body.answers),
    )
    db.add(attempt)
    await db.commit()

    return QuizResultResponse(
        score=score,
        total=total,
        percentage=round(percentage, 2),
        breakdown=breakdown,
    )


@router.get("/history/{student_id}")
async def quiz_history(
    student_id: uuid.UUID,
    current: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    res = await db.execute(select(QuizAttempt).where(QuizAttempt.student_id == student_id).order_by(QuizAttempt.completed_at.desc()))
    attempts = res.scalars().all()
    return [
        {
            "id": str(a.id),
            "unit_id": str(a.unit_id),
            "score": a.score,
            "completed_at": a.completed_at.isoformat(),
        }
        for a in attempts
    ]
