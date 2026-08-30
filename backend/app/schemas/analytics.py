from pydantic import BaseModel, ConfigDict

from app.schemas.conversation import ReviewItemResponse
from app.schemas.post import PostResponse


class AnalyticsOverviewResponse(BaseModel):
    posts_total: int = 0
    posts_published: int = 0
    posts_scheduled: int = 0
    leads_total: int = 0
    leads_qualified: int = 0
    conversations_active: int = 0
    pipeline: dict[str, int] = {}


class SentimentDistribution(BaseModel):
    positive: int = 0
    neutral: int = 0
    inquisitive: int = 0
    negative: int = 0


class LeadsByStage(BaseModel):
    cold: int = 0
    warm: int = 0
    hot: int = 0
    mql: int = 0
    sql: int = 0


class DashboardMetricsResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    total_posts_published: int = 0
    total_leads: int = 0
    mql_sql_leads: int = 0
    review_queue_pending: int = 0
    avg_reply_confidence: float = 0.85
    avg_response_time_sec: float = 1.4
    sentiment_distribution: SentimentDistribution = SentimentDistribution()
    leads_by_stage: LeadsByStage = LeadsByStage()
    recent_posts: list[PostResponse] = []
    review_queue: list[ReviewItemResponse] = []
