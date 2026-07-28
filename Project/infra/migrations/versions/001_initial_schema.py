"""Initial schema: organizations, users, students, teachers."""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "001_initial"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "organizations",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("plan_tier", sa.String(50), nullable=False, server_default="free"),
        sa.Column("credits_balance", sa.Integer(), nullable=False, server_default="1000"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("org_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False),
        sa.Column("email", sa.String(255), nullable=False, unique=True),
        sa.Column("password_hash", sa.String(255), nullable=False),
        sa.Column("role", sa.String(20), nullable=False),
        sa.Column("full_name", sa.String(255), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_users_org_id", "users", ["org_id"])
    op.create_index("ix_users_email", "users", ["email"])

    op.create_table(
        "students",
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("org_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False),
        sa.Column("class", sa.String(50), nullable=False),
        sa.Column("section", sa.String(10), nullable=False),
        sa.Column("roll_number", sa.String(50), nullable=False),
    )
    op.create_index("ix_students_org_id", "students", ["org_id"])

    op.create_table(
        "teachers",
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("org_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False),
        sa.Column("subjects_taught", postgresql.ARRAY(sa.String()), nullable=False, server_default="{}"),
    )
    op.create_index("ix_teachers_org_id", "teachers", ["org_id"])


def downgrade() -> None:
    op.drop_table("teachers")
    op.drop_table("students")
    op.drop_table("users")
    op.drop_table("organizations")
