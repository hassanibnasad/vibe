from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.onboarding_run import OnboardingRun
from app.repositories.base import BaseRepository


class OnboardingRunRepository(BaseRepository[OnboardingRun]):
    def __init__(self, session: AsyncSession):
        super().__init__(session, OnboardingRun)

    async def get_owned(
        self, run_id: UUID, tenant_id: UUID, operator_id: UUID
    ) -> OnboardingRun | None:
        stmt = select(OnboardingRun).where(
            OnboardingRun.id == run_id,
            OnboardingRun.tenant_id == tenant_id,
            OnboardingRun.operator_id == operator_id,
        )
        return (await self.session.execute(stmt)).scalar_one_or_none()

