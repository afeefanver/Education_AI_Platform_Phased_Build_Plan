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


# Phase 2: Core Learning Loop Schemas

class NoteType(str, Enum):
    DETAILED = "detailed"
    EXAM = "exam"
    REVISION = "revision"
    LAST_MINUTE = "last_minute"
    CHEAT_SHEET = "cheat_sheet"


class TutorMode(str, Enum):
    BEGINNER = "beginner"
    STANDARD = "standard"
    INTERVIEW = "interview"


class QuizType(str, Enum):
    MCQ = "mcq"
    TRUE_FALSE = "true_false"
    FILL_BLANK = "fill_blank"


class SubjectCreate(BaseModel):
    name: str
    class_level: str


class SubjectResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    org_id: UUID
    name: str
    class_level: str


class SyllabusUnitResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    subject_id: UUID
    unit_name: str
    order_index: int


class NoteGenerateRequest(BaseModel):
    subject_id: UUID
    unit_id: UUID
    type: NoteType = NoteType.DETAILED


class NoteResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    subject_id: UUID
    unit_id: UUID
    type: NoteType
    content: str
    generated_at: datetime


class TutorSessionCreate(BaseModel):
    subject_id: UUID
    mode: TutorMode = TutorMode.STANDARD


class TutorSessionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    student_id: UUID
    subject_id: UUID
    mode: TutorMode
    created_at: datetime


class TutorMessageRequest(BaseModel):
    session_id: UUID
    message: str


class TutorResponse(BaseModel):
    reply: str
    sources: list[str] = Field(default_factory=list)


class QuizGenerateRequest(BaseModel):
    subject_id: UUID
    unit_id: UUID
    count: int = Field(default=5, ge=1, le=20)
    difficulty: str = "medium"


class QuizQuestionSchema(BaseModel):
    id: UUID
    type: QuizType
    question_text: str
    options: list[str] | None = None
    difficulty: str


class QuizSubmitRequest(BaseModel):
    unit_id: UUID
    answers: dict[str, str]  # question_id -> student answer


class QuizResultResponse(BaseModel):
    score: int
    total: int
    percentage: float
    breakdown: list[dict]

