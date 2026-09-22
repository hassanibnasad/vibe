from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.social_connection import SocialConnection
from app.repositories.base import BaseRepository


class SocialConnectionRepository(BaseRepository[SocialConnection]):
    def __init__(self, session: AsyncSession):
        super().__init__(session, SocialConnection)

    async def list_for_operator(self, tenant_id: UUID, operator_id: UUID) -> list[SocialConnection]:
        stmt = (
            select(SocialConnection)
            .where(
                SocialConnection.tenant_id == tenant_id,
                SocialConnection.operator_id == operator_id,
            )
            .order_by(SocialConnection.created_at.desc())
        )
        return list((await self.session.execute(stmt)).scalars().all())

    async def get_owned(
        self, connection_id: UUID, tenant_id: UUID, operator_id: UUID
    ) -> SocialConnection | None:
        stmt = select(SocialConnection).where(
            SocialConnection.id == connection_id,
            SocialConnection.tenant_id == tenant_id,
            SocialConnection.operator_id == operator_id,
        )
        return (await self.session.execute(stmt)).scalar_one_or_none()

    async def get_for_tenant(
        self, connection_id: UUID, tenant_id: UUID
    ) -> SocialConnection | None:
        stmt = select(SocialConnection).where(
            SocialConnection.id == connection_id,
            SocialConnection.tenant_id == tenant_id,
        )
        return (await self.session.execute(stmt)).scalar_one_or_none()

    async def upsert_linkedin(
        self,
        *,
        tenant_id: UUID,
        operator_id: UUID,
        subject: str,
        author_urn: str,
        display_name: str | None,
        access_token_encrypted: str,
        refresh_token_encrypted: str | None,
        expires_at: datetime | None,
        granted_scopes: list[str],
    ) -> SocialConnection:
        stmt = select(SocialConnection).where(
            SocialConnection.tenant_id == tenant_id,
            SocialConnection.operator_id == operator_id,
            SocialConnection.provider == "linkedin",
            SocialConnection.external_subject == subject,
        )
        connection = (await self.session.execute(stmt)).scalar_one_or_none()
        values = {
            "author_urn": author_urn,
            "display_name": display_name,
            "access_token_encrypted": access_token_encrypted,
            "refresh_token_encrypted": refresh_token_encrypted,
            "expires_at": expires_at,
            "granted_scopes": granted_scopes,
            "status": "active",
            "last_error": None,
            "connected_at": datetime.now(UTC),
            "disconnected_at": None,
        }
        if connection is None:
            connection = SocialConnection(
                tenant_id=tenant_id,
                operator_id=operator_id,
                provider="linkedin",
                external_subject=subject,
                **values,
            )
            self.session.add(connection)
            await self.session.flush()
            return connection

        for key, value in values.items():
            setattr(connection, key, value)
        await self.session.flush()
        return connection

    async def mark_status(
        self, connection: SocialConnection, status: str, error: str | None = None
    ) -> SocialConnection:
        connection.status = status
        connection.last_error = error
        if status == "disconnected":
            connection.disconnected_at = datetime.now(UTC)
        await self.session.flush()
        return connection

