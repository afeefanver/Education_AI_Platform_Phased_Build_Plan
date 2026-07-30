import logging
from uuid import UUID

from fastapi import Request
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from core.config import settings
from shared_models.models import Organization

logger = logging.getLogger(__name__)


async def check_and_deduct_credits(
    db: AsyncSession,
    org_id: UUID,
    cost: int = 1,
) -> bool:
    """
    Fail-open credits check: if anything errors, allow the request and log it.
    Returns True if credits were available (or billing disabled), False if insufficient.
    """
    if not settings.credits_enabled:
        return True

    try:
        result = await db.execute(select(Organization).where(Organization.id == org_id))
        org = result.scalar_one_or_none()
        if org is None:
            logger.warning("Credits check: org %s not found — fail-open", org_id)
            return True

        if org.credits_balance < cost:
            return False

        await db.execute(
            update(Organization)
            .where(Organization.id == org_id)
            .values(credits_balance=Organization.credits_balance - cost)
        )
        await db.commit()
        return True
    except Exception:
        logger.exception("Credits check failed for org %s — fail-open", org_id)
        return True


async def credits_middleware_dispatch(request: Request, call_next):
    """Placeholder hook — per-route credit costs applied in route handlers."""
    return await call_next(request)
