from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.post_revision import PostRevision
from app.repositories.base import BaseRepository


class PostRevisionRepository(BaseRepository[PostRevision]):
    def __init__(self, session: AsyncSession):
        super().__init__(session, PostRevision)

    async def list_for_post(self, post_id: UUID) -> list[PostRevision]:
        stmt = (
            select(PostRevision)
            .where(PostRevision.post_id == post_id)
            .order_by(PostRevision.revision_number.desc())
        )
        return list((await self.session.execute(stmt)).scalars().all())

    async def next_number(self, post_id: UUID) -> int:
        stmt = select(func.coalesce(func.max(PostRevision.revision_number), 0)).where(
            PostRevision.post_id == post_id
        )
        return int((await self.session.execute(stmt)).scalar_one()) + 1

