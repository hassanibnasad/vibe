import uuid

import pytest

from app.models.post import Post
from app.repositories.brand_profile_repo import BrandProfileRepository
from app.repositories.performance_repo import PerformanceRepository


@pytest.mark.asyncio
async def test_brand_profile_repository_lifecycle(db_session):
    repo = BrandProfileRepository(db_session)
    tenant_id = uuid.uuid4()

    # Create new profile
    profile = await repo.upsert(
        tenant_id=tenant_id,
        brand_name="CloudScale AI",
        tagline="Next-gen distributed workflows",
        visual_identity={"palette": {"primary": "#000000"}},
        written_identity={"archetype": "Expert", "tone_attributes": ["Pragmatic"]},
        extraction_status="pending",
    )
    await db_session.commit()

    assert profile.id is not None
    assert profile.brand_name == "CloudScale AI"
    assert profile.extraction_status == "pending"

    # Query
    fetched = await repo.get_by_tenant(tenant_id)
    assert fetched is not None
    assert fetched.brand_name == "CloudScale AI"

    # Update extraction status
    updated = await repo.update_extraction_status(tenant_id, "complete")
    await db_session.commit()
    assert updated is not None
    assert updated.extraction_status == "complete"


@pytest.mark.asyncio
async def test_performance_repository_upsert_and_ranking(db_session):
    repo = PerformanceRepository(db_session)
    tenant_id = uuid.uuid4()
    post_id_1 = uuid.uuid4()
    post_id_2 = uuid.uuid4()

    # Create post rows first if foreign key requires it (SQLite doesn't enforce without pragma, but let's be thorough)
    post1 = Post(id=post_id_1, tenant_id=tenant_id, content="Post 1", status="published")
    post2 = Post(id=post_id_2, tenant_id=tenant_id, content="Post 2", status="published")
    db_session.add_all([post1, post2])
    await db_session.commit()

    # Post 1: low engagement
    perf1 = await repo.upsert_metrics(
        post_id=post_id_1,
        tenant_id=tenant_id,
        impressions=100,
        likes=5,
        comments=1,
        shares=0,
        dms_initiated=0,
        leads_generated=0,
        leads_qualified=0,
    )

    # Post 2: high conversion
    perf2 = await repo.upsert_metrics(
        post_id=post_id_2,
        tenant_id=tenant_id,
        impressions=500,
        likes=20,
        comments=15,
        shares=5,
        dms_initiated=4,
        leads_generated=3,
        leads_qualified=2,
    )
    await db_session.commit()

    assert perf2.conversion_score > perf1.conversion_score

    # Ranking query
    top = await repo.get_top_performers(tenant_id=tenant_id, limit=5)
    assert len(top) == 2
    assert top[0].post_id == post_id_2
    assert top[1].post_id == post_id_1
