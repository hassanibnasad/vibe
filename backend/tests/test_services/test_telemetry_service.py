import uuid
from datetime import UTC, datetime

import pytest

from app.models.enums import LeadStage
from app.models.lead import Lead
from app.models.post import Post
from app.repositories.performance_repo import PerformanceRepository
from app.repositories.post_repo import PostRepository
from app.services.telemetry_service import TelemetryService


@pytest.mark.asyncio
async def test_telemetry_service_sync_post(db_session):
    tenant_id = uuid.uuid4()
    post_id = uuid.uuid4()

    post = Post(
        id=post_id,
        tenant_id=tenant_id,
        content="Testing telemetry sync with conversions",
        status="published",
        published_at=datetime.now(UTC),
        engagement_metrics={
            "impressions": 1200,
            "likes": 45,
            "comments": 12,
            "shares": 3,
            "dms_initiated": 2,
        },
    )
    db_session.add(post)

    # Add attributed leads
    lead1 = Lead(
        tenant_id=tenant_id,
        source_post_id=post_id,
        platform="linkedin",
        platform_user_id="user_123",
        lead_stage=LeadStage.MQL.value,
    )
    lead2 = Lead(
        tenant_id=tenant_id,
        source_post_id=post_id,
        platform="linkedin",
        platform_user_id="user_456",
        lead_stage=LeadStage.COLD.value,
    )
    db_session.add_all([lead1, lead2])
    await db_session.commit()

    post_repo = PostRepository(db_session)
    perf_repo = PerformanceRepository(db_session)
    telemetry = TelemetryService(post_repo=post_repo, performance_repo=perf_repo)

    result = await telemetry.sync_post_metrics(post_id=post_id, tenant_id=tenant_id)
    await db_session.commit()

    assert result["leads_generated"] == 2
    assert result["leads_qualified"] == 1
    assert result["conversion_score"] > 0

    # Verify score denormalized to post
    refreshed_post = await post_repo.get_by_id(post_id)
    assert refreshed_post is not None
    assert refreshed_post.conversion_score == result["conversion_score"]
