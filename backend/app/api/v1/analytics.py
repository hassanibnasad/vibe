from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_lead_repo
from app.dependencies import get_db_session
from app.middleware.auth import get_current_user
from app.models.conversation import Conversation
from app.models.lead import Lead
from app.models.post import Post
from app.repositories.lead_repo import LeadRepository
from app.schemas.analytics import AnalyticsOverviewResponse

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/overview", response_model=AnalyticsOverviewResponse)
async def get_analytics_overview(
    session: AsyncSession = Depends(get_db_session),
    lead_repo: LeadRepository = Depends(get_lead_repo),
    current_user: dict = Depends(get_current_user),
) -> AnalyticsOverviewResponse:
    # Post counts
    posts_total = (await session.execute(select(func.count()).select_from(Post))).scalar_one()
    posts_published = (
        await session.execute(select(func.count()).select_from(Post).where(Post.status == "published"))
    ).scalar_one()
    posts_scheduled = (
        await session.execute(select(func.count()).select_from(Post).where(Post.status == "scheduled"))
    ).scalar_one()

    # Lead counts
    leads_total = (await session.execute(select(func.count()).select_from(Lead))).scalar_one()
    leads_qualified = (
        await session.execute(select(func.count()).select_from(Lead).where(Lead.lead_stage.in_(["mql", "sql"])))
    ).scalar_one()

    # Active conversations
    conversations_active = (
        await session.execute(select(func.count()).select_from(Conversation).where(Conversation.status == "active"))
    ).scalar_one()

    # Pipeline summary
    pipeline = await lead_repo.get_pipeline_counts()

    return AnalyticsOverviewResponse(
        posts_total=posts_total,
        posts_published=posts_published,
        posts_scheduled=posts_scheduled,
        leads_total=leads_total,
        leads_qualified=leads_qualified,
        conversations_active=conversations_active,
        pipeline=pipeline,
    )
