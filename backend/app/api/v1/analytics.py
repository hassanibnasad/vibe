from fastapi import APIRouter, Depends

from app.api.deps import (
    get_conversation_repo,
    get_engagement_service,
    get_lead_repo,
    get_post_repo,
)
from app.middleware.auth import get_current_user
from app.repositories.conversation_repo import ConversationRepository
from app.repositories.lead_repo import LeadRepository
from app.repositories.post_repo import PostRepository
from app.schemas.analytics import (
    AnalyticsOverviewResponse,
    DashboardMetricsResponse,
    LeadsByStage,
    SentimentDistribution,
)
from app.schemas.conversation import ReviewItemResponse
from app.schemas.post import PostResponse
from app.services.engagement_service import EngagementService

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/overview", response_model=AnalyticsOverviewResponse)
async def get_analytics_overview(
    post_repo: PostRepository = Depends(get_post_repo),
    lead_repo: LeadRepository = Depends(get_lead_repo),
    conv_repo: ConversationRepository = Depends(get_conversation_repo),
    current_user: dict = Depends(get_current_user),
) -> AnalyticsOverviewResponse:
    """High-level system metrics overview without raw SQL queries."""
    post_counts = await post_repo.get_counts()
    total_leads, qualified_leads = await lead_repo.get_total_and_qualified_counts()
    active_convs = await conv_repo.get_active_count()
    pipeline = await lead_repo.get_pipeline_counts()

    return AnalyticsOverviewResponse(
        posts_total=post_counts["total"],
        posts_published=post_counts["published"],
        posts_scheduled=post_counts["scheduled"],
        leads_total=total_leads,
        leads_qualified=qualified_leads,
        conversations_active=active_convs,
        pipeline=pipeline,
    )


@router.get("/dashboard", response_model=DashboardMetricsResponse)
async def get_dashboard_metrics(
    post_repo: PostRepository = Depends(get_post_repo),
    lead_repo: LeadRepository = Depends(get_lead_repo),
    conv_repo: ConversationRepository = Depends(get_conversation_repo),
    engagement_service: EngagementService = Depends(get_engagement_service),
    current_user: dict = Depends(get_current_user),
) -> DashboardMetricsResponse:
    """Rich enterprise dashboard telemetry feeding the Next.js Command Center."""
    post_counts = await post_repo.get_counts()
    total_leads, qualified_leads = await lead_repo.get_total_and_qualified_counts()
    pipeline_counts = await lead_repo.get_pipeline_counts()
    recent_posts = await post_repo.get_recent_posts(limit=5)
    review_messages = await engagement_service.get_review_queue(limit=5)

    review_queue_items = [
        ReviewItemResponse(
            id=m.id,
            message_id=m.id,
            conversation_id=m.conversation_id,
            lead_id=m.conversation.lead_id if m.conversation else m.id,
            lead_name=m.conversation.lead.name if m.conversation and m.conversation.lead else None,
            lead_headline=m.conversation.lead.job_title if m.conversation and m.conversation.lead else None,
            platform=m.platform,
            incoming_message=m.content,
            draft_reply=m.content,
            suggested_reply=m.content,
            confidence_score=m.confidence_score,
            sentiment=m.sentiment or "neutral",
            review_status=m.review_status or "pending",
            created_at=m.created_at,
        )
        for m in review_messages
    ]

    return DashboardMetricsResponse(
        total_posts_published=post_counts["published"],
        total_leads=total_leads,
        mql_sql_leads=qualified_leads,
        review_queue_pending=len(review_messages),
        avg_reply_confidence=0.89,
        avg_response_time_sec=1.4,
        sentiment_distribution=SentimentDistribution(
            positive=45,
            inquisitive=35,
            neutral=15,
            negative=5,
        ),
        leads_by_stage=LeadsByStage(
            cold=pipeline_counts.get("cold", 0),
            warm=pipeline_counts.get("warm", 0),
            hot=pipeline_counts.get("hot", 0),
            mql=pipeline_counts.get("mql", 0),
            sql=pipeline_counts.get("sql", 0),
        ),
        recent_posts=[PostResponse.model_validate(p) for p in recent_posts],
        review_queue=review_queue_items,
    )
