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

    async def get_counts(self) -> dict[str, int]:
        """Aggregate total, published, and scheduled post counts."""
        stmt = select(Post.status, func.count(Post.id)).group_by(Post.status)
        res = await self.session.execute(stmt)
        status_map = {row[0]: row[1] for row in res.all()}
        total = sum(status_map.values())
        return {
            "total": total,
            "published": status_map.get("published", 0),
            "scheduled": status_map.get("scheduled", 0),
            "draft": status_map.get("draft", 0),
        }

    async def get_recent_posts(self, limit: int = 5) -> list[Post]:
        """Return the most recently created or published posts."""
        stmt = select(Post).order_by(Post.created_at.desc()).limit(limit)
        res = await self.session.execute(stmt)
        return list(res.scalars().all())

