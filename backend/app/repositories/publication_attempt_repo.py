from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.publication_attempt import PublicationAttempt
from app.repositories.base import BaseRepository


class PublicationAttemptRepository(BaseRepository[PublicationAttempt]):
    def __init__(self, session: AsyncSession):
        super().__init__(session, PublicationAttempt)

    async def get_for_post_and_connection(
        self, post_id: UUID, connection_id: UUID
    ) -> PublicationAttempt | None:
        stmt = select(PublicationAttempt).where(
            PublicationAttempt.post_id == post_id,
            PublicationAttempt.connection_id == connection_id,
        )
        return (await self.session.execute(stmt)).scalar_one_or_none()

