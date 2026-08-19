from datetime import datetime
from uuid import UUID

from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.post import Post
from app.repositories.base import BaseRepository


class PostRepository(BaseRepository[Post]):
    def __init__(self, session: AsyncSession):
        super().__init__(session, Post)

    async def filter_posts(
        self,
        status: str | None = None,
        platform_id: UUID | None = None,
        campaign_id: UUID | None = None,
        skip: int = 0,
        limit: int = 20,
    ) -> tuple[list[Post], int]:
        conditions = []
        if status:
            conditions.append(Post.status == status)
        if platform_id:
            conditions.append(Post.platform_id == platform_id)
        if campaign_id:
            conditions.append(Post.campaign_id == campaign_id)

        query = select(Post)
        count_query = select(func.count()).select_from(Post)

        if conditions:
            query = query.where(and_(*conditions))
            count_query = count_query.where(and_(*conditions))

        query = query.order_by(Post.created_at.desc()).offset(skip).limit(limit)

        posts_res = await self.session.execute(query)
        count_res = await self.session.execute(count_query)

        return list(posts_res.scalars().all()), count_res.scalar_one()

    async def get_due_scheduled_posts(self, current_time: datetime) -> list[Post]:
        stmt = (
            select(Post)
            .where(
                and_(
                    Post.status == "scheduled",
                    Post.scheduled_at <= current_time,
                )
            )
            .order_by(Post.scheduled_at.asc())
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())
