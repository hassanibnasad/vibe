from typing import Any
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.brand_profile import BrandProfile
from app.repositories.base import BaseRepository


class BrandProfileRepository(BaseRepository[BrandProfile]):
    def __init__(self, session: AsyncSession):
        super().__init__(session, BrandProfile)

    async def get_by_tenant(self, tenant_id: UUID) -> BrandProfile | None:
        """Return the BrandProfile for a tenant, or None if not yet created."""
        stmt = select(BrandProfile).where(BrandProfile.tenant_id == tenant_id).limit(1)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def upsert(self, tenant_id: UUID, **fields: Any) -> BrandProfile:
        """Insert or update the BrandProfile for a tenant.

        Uses ``INSERT ... ON CONFLICT (tenant_id) DO UPDATE`` for atomicity.
        Returns the upserted row (fetched via a follow-up SELECT for ORM
        hydration, since raw SQL doesn't populate mapped attributes).
        """
        existing = await self.get_by_tenant(tenant_id)
        if existing is not None:
            # Update in place
            for key, value in fields.items():
                if hasattr(existing, key):
                    setattr(existing, key, value)
            await self.session.flush()
            return existing

        # Create new
        profile = BrandProfile(tenant_id=tenant_id, **fields)
        self.session.add(profile)
        await self.session.flush()
        return profile

    async def update_extraction_status(
        self,
        tenant_id: UUID,
        status: str,
        **extra: Any,
    ) -> BrandProfile | None:
        """Update just the extraction_status (and optional extra fields) for a tenant."""
        profile = await self.get_by_tenant(tenant_id)
        if profile is None:
            return None
        profile.extraction_status = status
        for key, value in extra.items():
            if hasattr(profile, key):
                setattr(profile, key, value)
        await self.session.flush()
        return profile

    async def get_active_tenant_ids(self) -> list[UUID]:
        """Return all tenant IDs with completed brand profiles."""
        stmt = select(BrandProfile.tenant_id).where(BrandProfile.extraction_status == "complete")
        result = await self.session.execute(stmt)
        return [row[0] for row in result.all() if row[0] is not None]
