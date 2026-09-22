from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.oauth_state import OAuthState
from app.repositories.base import BaseRepository


class OAuthStateRepository(BaseRepository[OAuthState]):
    def __init__(self, session: AsyncSession):
        super().__init__(session, OAuthState)

    async def consume(self, provider: str, state_hash: str) -> OAuthState | None:
        stmt = select(OAuthState).where(
            OAuthState.provider == provider,
            OAuthState.state_hash == state_hash,
        )
        state = (await self.session.execute(stmt)).scalar_one_or_none()
        if state is None or state.consumed_at is not None:
            return None
        expires_at = state.expires_at
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=UTC)
        if expires_at <= datetime.now(UTC):
            return None
        state.consumed_at = datetime.now(UTC)
        await self.session.flush()
        return state

