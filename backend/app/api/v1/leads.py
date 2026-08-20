from uuid import UUID

from fastapi import APIRouter, Depends, Query

from app.api.deps import get_lead_repo, get_score_event_repo
from app.exceptions import LeadNotFoundError
from app.middleware.auth import get_current_user
from app.repositories.lead_repo import LeadRepository
from app.repositories.score_event_repo import ScoreEventRepository
from app.schemas.lead import (
    LeadListResponse,
    LeadResponse,
    LeadScoreUpdateRequest,
    LeadUpdateRequest,
    PipelineResponse,
)

router = APIRouter(prefix="/leads", tags=["Leads"])


def calculate_lead_stage(score: int) -> str:
    if score >= 90:
        return "sql"
    if score >= 75:
        return "mql"
    if score >= 50:
        return "hot"
    if score >= 20:
        return "warm"
    return "cold"


@router.get("", response_model=LeadListResponse)
async def list_leads(
    stage: str | None = Query(None),
    min_score: int | None = Query(None, ge=0, le=100),
    platform: str | None = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    lead_repo: LeadRepository = Depends(get_lead_repo),
    current_user: dict = Depends(get_current_user),
) -> LeadListResponse:
    skip = (page - 1) * limit
    leads, total = await lead_repo.filter_leads(
        stage=stage,
        min_score=min_score,
        platform=platform,
        skip=skip,
        limit=limit,
    )
    return LeadListResponse(
        data=[LeadResponse.model_validate(lead) for lead in leads],
        pagination={"page": page, "limit": limit, "total": total},
    )


@router.get("/pipeline", response_model=PipelineResponse)
async def get_pipeline_summary(
    lead_repo: LeadRepository = Depends(get_lead_repo),
    current_user: dict = Depends(get_current_user),
) -> PipelineResponse:
    counts = await lead_repo.get_pipeline_counts()
    return PipelineResponse(
        cold=counts.get("cold", 0),
        warm=counts.get("warm", 0),
        hot=counts.get("hot", 0),
        mql=counts.get("mql", 0),
        sql=counts.get("sql", 0),
    )


@router.get("/{lead_id}", response_model=LeadResponse)
async def get_lead(
    lead_id: UUID,
    lead_repo: LeadRepository = Depends(get_lead_repo),
    current_user: dict = Depends(get_current_user),
) -> LeadResponse:
    lead = await lead_repo.get_by_id(lead_id)
    if not lead:
        raise LeadNotFoundError(f"Lead {lead_id} not found")
    return LeadResponse.model_validate(lead)


@router.put("/{lead_id}", response_model=LeadResponse)
async def update_lead(
    lead_id: UUID,
    data: LeadUpdateRequest,
    lead_repo: LeadRepository = Depends(get_lead_repo),
    current_user: dict = Depends(get_current_user),
) -> LeadResponse:
    update_data = data.model_dump(exclude_unset=True)
    if "lead_score" in update_data and "lead_stage" not in update_data:
        update_data["lead_stage"] = calculate_lead_stage(update_data["lead_score"])

    lead = await lead_repo.update(lead_id, **update_data)
    if not lead:
        raise LeadNotFoundError(f"Lead {lead_id} not found")
    return LeadResponse.model_validate(lead)


@router.post("/{lead_id}/score", response_model=LeadResponse)
async def update_lead_score(
    lead_id: UUID,
    data: LeadScoreUpdateRequest,
    lead_repo: LeadRepository = Depends(get_lead_repo),
    score_repo: ScoreEventRepository = Depends(get_score_event_repo),
    current_user: dict = Depends(get_current_user),
) -> LeadResponse:
    lead = await lead_repo.get_by_id(lead_id)
    if not lead:
        raise LeadNotFoundError(f"Lead {lead_id} not found")

    old_score = lead.lead_score
    new_stage = calculate_lead_stage(data.new_score)

    updated_lead = await lead_repo.update(
        lead_id,
        lead_score=data.new_score,
        lead_stage=new_stage,
    )

    await score_repo.create(
        lead_id=lead_id,
        event_type="manual_adjustment",
        score_before=old_score,
        score_after=data.new_score,
        score_delta=data.new_score - old_score,
        reason=data.reason,
    )

    return LeadResponse.model_validate(updated_lead)
