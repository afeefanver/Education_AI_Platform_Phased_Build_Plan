from datetime import datetime
from enum import Enum
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UserRole(str, Enum):
    STUDENT = "student"
    TEACHER = "teacher"
    ADMIN = "admin"


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)


class RefreshRequest(BaseModel):
    refresh_token: str


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    org_id: UUID
    email: EmailStr
    role: UserRole
    full_name: str
    created_at: datetime


class OrganizationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    plan_tier: str
    credits_balance: int
    created_at: datetime


class StudentProfile(BaseModel):
    class_level: str
    section: str
    roll_number: str


class TeacherProfile(BaseModel):
    subjects_taught: list[str]


class MeResponse(BaseModel):
    user: UserResponse
    organization: OrganizationResponse
    student: StudentProfile | None = None
    teacher: TeacherProfile | None = None


class ErrorResponse(BaseModel):
    detail: str
