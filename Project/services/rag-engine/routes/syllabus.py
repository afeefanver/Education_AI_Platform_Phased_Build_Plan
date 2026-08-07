"""Syllabus management routes."""

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Form, UploadFile, File, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from core.deps import CurrentUser, get_current_user
from core.vectorstore import vector_store
from shared_models.models import Subject, SyllabusDoc, SyllabusUnit
from shared_models.schemas import SubjectCreate, SubjectResponse, SyllabusUnitResponse

router = APIRouter(prefix="/syllabus", tags=["syllabus"])


@router.post("/subjects", response_model=SubjectResponse)
async def create_subject(
    body: SubjectCreate,
    current: Annotated[CurrentUser, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> SubjectResponse:
    subject = Subject(
        id=uuid.uuid4(),
        org_id=current.org_id,
        name=body.name,
        class_level=body.class_level,
    )
    db.add(subject)
    await db.commit()
    await db.refresh(subject)
    return SubjectResponse.model_validate(subject)


@router.get("/subjects", response_model=list[SubjectResponse])
async def list_subjects(
    current: Annotated[CurrentUser, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> list[SubjectResponse]:
    result = await db.execute(select(Subject).where(Subject.org_id == current.org_id))
    subjects = result.scalars().all()
    return [SubjectResponse.model_validate(s) for s in subjects]


import io
import pypdf


@router.post("/upload")
async def upload_syllabus(
    subject_id: uuid.UUID = Form(...),
    units_raw: str | None = Form(None, description="Comma or newline separated list of units (if no PDF file)"),
    file: UploadFile | None = File(None, description="Syllabus PDF file"),
    current: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Verify subject exists in org
    res = await db.execute(select(Subject).where(Subject.id == subject_id, Subject.org_id == current.org_id))
    subject = res.scalar_one_or_none()
    if not subject:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subject not found")

    extracted_text = ""
    file_name = "raw_text_input"

    if file and file.filename:
        file_name = file.filename
        content_bytes = await file.read()
        try:
            reader = pypdf.PdfReader(io.BytesIO(content_bytes))
            text_pages = [page.extract_text() for page in reader.pages if page.extract_text()]
            extracted_text = "\n".join(text_pages)
        except Exception as e:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Failed to parse PDF file: {e}")

    if not extracted_text and units_raw:
        extracted_text = units_raw

    if not extracted_text:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Please upload a PDF file or enter units text")

    # Extract unit names from text
    lines = [line.strip() for line in extracted_text.replace("\r", "").split("\n") if line.strip()]
    unit_names = []
    for line in lines:
        if "," in line and not line.lower().startswith("unit"):
            unit_names.extend([u.strip() for u in line.split(",") if u.strip()])
        else:
            unit_names.append(line)

    if not unit_names:
        unit_names = ["Unit 1: Overview"]

    created_units = []
    vector_texts = []
    vector_metas = []
    vector_ids = []

    for idx, name in enumerate(unit_names):
        unit = SyllabusUnit(
            id=uuid.uuid4(),
            subject_id=subject_id,
            unit_name=name,
            order_index=idx + 1,
        )
        db.add(unit)
        created_units.append(unit)

        vector_texts.append(f"Syllabus Unit: {name} for Subject: {subject.name}")
        vector_metas.append({"unit_name": name, "subject_id": str(subject_id), "org_id": str(current.org_id)})
        vector_ids.append(str(unit.id))

    doc = SyllabusDoc(
        id=uuid.uuid4(),
        subject_id=subject_id,
        file_path="raw_text_input",
        uploaded_by=current.id,
    )
    db.add(doc)

    await db.commit()

    # Index in vector store
    vector_store.add_documents(
        org_id=str(current.org_id),
        subject_id=str(subject_id),
        texts=vector_texts,
        metadatas=vector_metas,
        ids=vector_ids,
    )

    return {
        "status": "success",
        "doc_id": doc.id,
        "units_created": len(created_units),
        "units": [SyllabusUnitResponse.model_validate(u) for u in created_units],
    }


@router.get("/{subject_id}/units", response_model=list[SyllabusUnitResponse])
async def list_units(
    subject_id: uuid.UUID,
    current: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[SyllabusUnitResponse]:
    result = await db.execute(
        select(SyllabusUnit)
        .join(Subject)
        .where(SyllabusUnit.subject_id == subject_id, Subject.org_id == current.org_id)
        .order_by(SyllabusUnit.order_index)
    )
    units = result.scalars().all()
    return [SyllabusUnitResponse.model_validate(u) for u in units]
