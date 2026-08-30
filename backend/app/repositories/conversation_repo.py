from uuid import UUID

from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.conversation import Conversation
from app.repositories.base import BaseRepository


class ConversationRepository(BaseRepository[Conversation]):
    def __init__(self, session: AsyncSession):
        super().__init__(session, Conversation)

    async def get_by_lead_and_thread(
        self, lead_id: UUID, platform_thread_id: str
    ) -> Conversation | None:
        stmt = select(Conversation).where(
            and_(
                Conversation.lead_id == lead_id,
                Conversation.platform_thread_id == platform_thread_id,
            )
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_active_by_lead(self, lead_id: UUID) -> list[Conversation]:
        stmt = (
            select(Conversation)
            .where(
                and_(
                    Conversation.lead_id == lead_id,
                    Conversation.status == "active",
                )
            )
            .order_by(Conversation.last_message_at.desc())
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def get_active_count(self) -> int:
        """Count active conversations."""
        from sqlalchemy import func  # noqa: PLC0415
        stmt = select(func.count(Conversation.id)).where(Conversation.status == "active")
        res = await self.session.execute(stmt)
        return res.scalar_one() or 0

