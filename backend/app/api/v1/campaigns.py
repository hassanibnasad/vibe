from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_db_session
from app.exceptions import CampaignNotFoundError
from app.middleware.auth import get_current_user
from app.models.campaign import Campaign
from app.repositories.base import BaseRepository
from app.schemas.campaign import CampaignCreateRequest, CampaignResponse

router = APIRouter(prefix="/campaigns", tags=["Campaigns"])


@router.get("", response_model=list[CampaignResponse])
async def list_campaigns(
    session: AsyncSession = Depends(get_db_session),
    current_user: dict = Depends(get_current_user),
) -> list[CampaignResponse]:
    repo = BaseRepository(session, Campaign)
    campaigns = await repo.get_all()
    return [CampaignResponse.model_validate(c) for c in campaigns]


@router.post("", response_model=CampaignResponse, status_code=status.HTTP_201_CREATED)
async def create_campaign(
    data: CampaignCreateRequest,
    session: AsyncSession = Depends(get_db_session),
    current_user: dict = Depends(get_current_user),
) -> CampaignResponse:
    repo = BaseRepository(session, Campaign)
    campaign = await repo.create(**data.model_dump())
    return CampaignResponse.model_validate(campaign)


@router.get("/{campaign_id}", response_model=CampaignResponse)
async def get_campaign(
    campaign_id: UUID,
    session: AsyncSession = Depends(get_db_session),
    current_user: dict = Depends(get_current_user),
) -> CampaignResponse:
    repo = BaseRepository(session, Campaign)
    campaign = await repo.get_by_id(campaign_id)
    if not campaign:
        raise CampaignNotFoundError(f"Campaign {campaign_id} not found")
    return CampaignResponse.model_validate(campaign)
