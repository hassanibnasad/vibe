import uuid
from unittest.mock import AsyncMock

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.agents.base import AgentResult
from app.agents.content_generator import ContentGeneratorAgent
from app.exceptions import NotFoundError
from app.models.enums import PostStatus
from app.repositories.post_repo import PostRepository
from app.repositories.post_revision_repo import PostRevisionRepository
from app.services.draft_review_service import DraftReviewService


@pytest.mark.asyncio
async def test_draft_review_service_edit_and_approve(db_session: AsyncSession):
    post_repo = PostRepository(db_session)
    revision_repo = PostRevisionRepository(db_session)

    tenant_id = uuid.uuid4()
    operator_id = uuid.uuid4()

    post = await post_repo.create(
        tenant_id=tenant_id,
        content="Initial generated draft content",
        status=PostStatus.DRAFT.value,
        requires_review=True,
    )

    service = DraftReviewService(post_repo=post_repo, revision_repo=revision_repo)

    # 1. Edit draft
    edited_post = await service.edit(
        post_id=post.id,
        tenant_id=tenant_id,
        operator_id=operator_id,
        content="Human edited copy for LinkedIn",
        hashtags=["#b2b", "#growth"],
        cta="Learn more",
        feedback="Tightened hook",
    )

    assert edited_post.content == "Human edited copy for LinkedIn"
    assert edited_post.hashtags == ["#b2b", "#growth"]
    assert edited_post.cta == "Learn more"
    assert edited_post.current_revision_id is not None
    assert edited_post.status == PostStatus.DRAFT.value

    # Check revisions
    revisions = await service.list_revisions(post.id, tenant_id)
    assert len(revisions) == 1
    assert revisions[0].revision_number == 1
    assert revisions[0].source == "operator_edit"
    assert revisions[0].feedback == "Tightened hook"

    # 2. Approve draft
    approved_post = await service.approve(
        post_id=post.id,
        tenant_id=tenant_id,
        operator_id=operator_id,
    )

    assert approved_post.status == PostStatus.APPROVED.value
    assert approved_post.requires_review is False
    assert approved_post.approved_by == operator_id
    assert approved_post.approved_revision_id == edited_post.current_revision_id


@pytest.mark.asyncio
async def test_draft_review_service_refine_with_agent(db_session: AsyncSession):
    post_repo = PostRepository(db_session)
    revision_repo = PostRevisionRepository(db_session)

    tenant_id = uuid.uuid4()
    operator_id = uuid.uuid4()

    post = await post_repo.create(
        tenant_id=tenant_id,
        content="Rough draft",
        status=PostStatus.DRAFT.value,
        requires_review=True,
    )

    mock_generator = AsyncMock(spec=ContentGeneratorAgent)
    mock_generator.generate_post.return_value = AgentResult(
        agent_name="ContentGeneratorAgent",
        success=True,
        confidence_score=0.92,
        requires_review=False,
        data={
            "content": "Refined copy based on operator feedback",
            "hashtags": ["#marketing"],
            "cta": "Check link",
        },
    )

    service = DraftReviewService(
        post_repo=post_repo, revision_repo=revision_repo, generator=mock_generator
    )

    refined_post = await service.refine(
        post_id=post.id,
        tenant_id=tenant_id,
        operator_id=operator_id,
        feedback="Make it punchier",
    )

    assert refined_post.content == "Refined copy based on operator feedback"
    assert refined_post.hashtags == ["#marketing"]
    assert refined_post.status == PostStatus.DRAFT.value

    revisions = await service.list_revisions(post.id, tenant_id)
    assert len(revisions) == 1
    assert revisions[0].source == "feedback_refinement"


@pytest.mark.asyncio
async def test_draft_review_service_tenant_isolation(db_session: AsyncSession):
    post_repo = PostRepository(db_session)
    revision_repo = PostRevisionRepository(db_session)

    tenant_id = uuid.uuid4()
    other_tenant_id = uuid.uuid4()
    operator_id = uuid.uuid4()

    post = await post_repo.create(
        tenant_id=tenant_id,
        content="Tenant A draft",
        status=PostStatus.DRAFT.value,
    )

    service = DraftReviewService(post_repo=post_repo, revision_repo=revision_repo)

    with pytest.raises(NotFoundError):
        await service.edit(
            post_id=post.id,
            tenant_id=other_tenant_id,
            operator_id=operator_id,
            content="Unauthorized edit",
        )
