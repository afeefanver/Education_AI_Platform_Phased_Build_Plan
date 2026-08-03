"""Seed demo organization and users for local development."""

import asyncio
import os
import sys
import uuid

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../packages/shared-models/src")))

from dotenv import load_dotenv
from passlib.context import CryptContext  # noqa: E402

from shared_models.models import Organization, Student, Teacher, User  # noqa: E402

load_dotenv(os.path.abspath(os.path.join(os.path.dirname(__file__), "../.env")))

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

DATABASE_URL = os.getenv(
    "DATABASE_URL", "postgresql+asyncpg://edu:edu_secret@localhost:5432/edu_platform"
)


async def seed() -> None:
    engine = create_async_engine(DATABASE_URL)
    session_factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    org_id = uuid.UUID("11111111-1111-1111-1111-111111111111")
    admin_id = uuid.UUID("22222222-2222-2222-2222-222222222222")
    teacher_id = uuid.UUID("33333333-3333-3333-3333-333333333333")
    student_id = uuid.UUID("44444444-4444-4444-4444-444444444444")

    password_hash = pwd_context.hash("demo1234")

    async with session_factory() as session:
        org = Organization(id=org_id, name="Demo School", plan_tier="trial", credits_balance=1000)
        session.add(org)

        admin = User(
            id=admin_id,
            org_id=org_id,
            email="admin@demo.school",
            password_hash=password_hash,
            role="admin",
            full_name="Demo Admin",
        )
        teacher_user = User(
            id=teacher_id,
            org_id=org_id,
            email="teacher@demo.school",
            password_hash=password_hash,
            role="teacher",
            full_name="Demo Teacher",
        )
        student_user = User(
            id=student_id,
            org_id=org_id,
            email="student@demo.school",
            password_hash=password_hash,
            role="student",
            full_name="Demo Student",
        )
        session.add_all([admin, teacher_user, student_user])

        session.add(
            Teacher(
                user_id=teacher_id,
                org_id=org_id,
                subjects_taught=["Mathematics", "Physics"],
            )
        )
        session.add(
            Student(
                user_id=student_id,
                org_id=org_id,
                class_level="10",
                section="A",
                roll_number="10A001",
            )
        )

        await session.commit()
        print("Seed complete: admin@demo.school / teacher@demo.school / student@demo.school (password: demo1234)")

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(seed())
