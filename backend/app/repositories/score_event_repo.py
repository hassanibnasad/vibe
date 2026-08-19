from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.lead_score_event import LeadScoreEvent
from app.repositories.base import BaseRepository


class ScoreEventRepository(BaseRepository[LeadScoreEvent]):
    def __init__(self, session: AsyncSession):
        super().__init__(session, LeadScoreEvent)

    async def get_history_by_lead(
        self, lead_id: UUID, limit: int = 50
    ) -> list[LeadScoreEvent]:
        stmt = (
            select(LeadScoreEvent)
            .where(LeadScoreEvent.lead_id == lead_id)
            .order_by(LeadScoreEvent.created_at.desc())
            .limit(limit)
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())
