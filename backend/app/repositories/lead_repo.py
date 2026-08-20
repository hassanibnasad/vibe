from typing import Any

from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.lead import Lead
from app.repositories.base import BaseRepository


class LeadRepository(BaseRepository[Lead]):
    def __init__(self, session: AsyncSession):
        super().__init__(session, Lead)

    async def get_by_platform_user(self, platform: str, platform_user_id: str) -> Lead | None:
        stmt = select(Lead).where(
            and_(Lead.platform == platform, Lead.platform_user_id == platform_user_id)
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def upsert_from_interaction(
        self, platform: str, platform_user_id: str, **extra_fields: Any
    ) -> Lead:
        lead = await self.get_by_platform_user(platform, platform_user_id)
        if lead:
            for key, value in extra_fields.items():
                if value is not None:
                    setattr(lead, key, value)
            await self.session.flush()
            return lead
        return await self.create(
            platform=platform,
            platform_user_id=platform_user_id,
            **extra_fields,
        )

    async def filter_leads(
        self,
        stage: str | None = None,
        min_score: int | None = None,
        platform: str | None = None,
        skip: int = 0,
        limit: int = 20,
    ) -> tuple[list[Lead], int]:
        conditions = []
        if stage:
            conditions.append(Lead.lead_stage == stage)
        if min_score is not None:
            conditions.append(Lead.lead_score >= min_score)
        if platform:
            conditions.append(Lead.platform == platform)

        query = select(Lead)
        count_query = select(func.count()).select_from(Lead)

        if conditions:
            query = query.where(and_(*conditions))
            count_query = count_query.where(and_(*conditions))

        query = query.order_by(Lead.lead_score.desc(), Lead.last_interaction_at.desc())
        query = query.offset(skip).limit(limit)

        leads_res = await self.session.execute(query)
        count_res = await self.session.execute(count_query)

        return list(leads_res.scalars().all()), count_res.scalar_one()

    async def get_pipeline_counts(self) -> dict[str, int]:
        stmt = select(Lead.lead_stage, func.count(Lead.id)).group_by(Lead.lead_stage)
        result = await self.session.execute(stmt)
        return {row[0]: row[1] for row in result.all()}
