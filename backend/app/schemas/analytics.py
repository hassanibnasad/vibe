from pydantic import BaseModel


class AnalyticsOverviewResponse(BaseModel):
    posts_total: int = 0
    posts_published: int = 0
    posts_scheduled: int = 0
    leads_total: int = 0
    leads_qualified: int = 0
    conversations_active: int = 0
    pipeline: dict[str, int] = {}
