import os
import sys
import uuid

import pytest
from httpx import ASGITransport, AsyncClient

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../../packages/shared-models/src")))

from core.security import create_access_token  # noqa: E402
from main import app  # noqa: E402

@pytest.mark.asyncio
async def test_health():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/health")
    assert response.status_code == 200
    assert response.json()["service"] == "api-gateway"


@pytest.mark.asyncio
async def test_org_isolation_token_contains_org_id():
    """JWT access tokens must embed org_id for tenant scoping."""
    org_a_id = uuid.uuid4()
    org_b_id = uuid.uuid4()
    user_id = uuid.uuid4()

    token = create_access_token(user_id, org_a_id, "student")
    from jose import jwt
    from core.config import settings

    payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
    assert payload["org_id"] == str(org_a_id)
    assert payload["org_id"] != str(org_b_id)
