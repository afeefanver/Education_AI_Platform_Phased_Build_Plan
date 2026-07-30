from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from core.database import get_db
from core.deps import CurrentUser, get_current_user
from core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    verify_password,
)
from shared_models.models import Organization, Student, Teacher, User
from shared_models.schemas import (
    LoginRequest,
    MeResponse,
    OrganizationResponse,
    RefreshRequest,
    StudentProfile,
    TeacherProfile,
    TokenResponse,
    UserResponse,
    UserRole,
)

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest, db: AsyncSession = Depends(get_db)) -> TokenResponse:
    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()
    if user is None or not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    return TokenResponse(
        access_token=create_access_token(user.id, user.org_id, user.role),
        refresh_token=create_refresh_token(user.id),
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh(body: RefreshRequest, db: AsyncSession = Depends(get_db)) -> TokenResponse:
    try:
        payload = decode_token(body.refresh_token)
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")
        user_id = UUID(payload["sub"])
    except (KeyError, ValueError):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

    return TokenResponse(
        access_token=create_access_token(user.id, user.org_id, user.role),
        refresh_token=create_refresh_token(user.id),
    )


me_router = APIRouter(tags=["users"])


@me_router.get("/me", response_model=MeResponse)
async def me(current: CurrentUser = Depends(get_current_user), db: AsyncSession = Depends(get_db)) -> MeResponse:
    user = current.user
    org = user.organization

    student_profile = None
    teacher_profile = None

    if current.role == UserRole.STUDENT:
        result = await db.execute(select(Student).where(Student.user_id == user.id))
        student = result.scalar_one_or_none()
        if student:
            student_profile = StudentProfile(
                class_level=student.class_level,
                section=student.section,
                roll_number=student.roll_number,
            )

    if current.role == UserRole.TEACHER:
        result = await db.execute(select(Teacher).where(Teacher.user_id == user.id))
        teacher = result.scalar_one_or_none()
        if teacher:
            teacher_profile = TeacherProfile(subjects_taught=list(teacher.subjects_taught or []))

    return MeResponse(
        user=UserResponse.model_validate(user),
        organization=OrganizationResponse.model_validate(org),
        student=student_profile,
        teacher=teacher_profile,
    )
