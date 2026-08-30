from uuid import UUID

from fastapi import APIRouter, Depends, Query

from app.api.deps import get_lead_service
from app.middleware.auth import get_current_user
from app.schemas.lead import (
    LeadListResponse,
    LeadResponse,
    LeadScoreUpdateRequest,
    LeadStageUpdateRequest,
    LeadUpdateRequest,
    PipelineResponse,
)
from app.services.lead_service import LeadService

router = APIRouter(prefix="/leads", tags=["Leads"])


@router.get("", response_model=LeadListResponse)
async def list_leads(
    stage: str | None = Query(None),
    min_score: int | None = Query(None, ge=0, le=100),
    platform: str | None = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    lead_service: LeadService = Depends(get_lead_service),
    current_user: dict = Depends(get_current_user),
) -> LeadListResponse:
    skip = (page - 1) * limit
    leads, total = await lead_service.filter_leads(
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
    lead_service: LeadService = Depends(get_lead_service),
    current_user: dict = Depends(get_current_user),
) -> PipelineResponse:
    counts = await lead_service.get_pipeline_summary()
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
    lead_service: LeadService = Depends(get_lead_service),
    current_user: dict = Depends(get_current_user),
) -> LeadResponse:
    lead = await lead_service.get_lead(lead_id)
    return LeadResponse.model_validate(lead)


@router.put("/{lead_id}", response_model=LeadResponse)
async def update_lead(
    lead_id: UUID,
    data: LeadUpdateRequest,
    lead_service: LeadService = Depends(get_lead_service),
    current_user: dict = Depends(get_current_user),
) -> LeadResponse:
    lead = await lead_service.update_lead(lead_id, **data.model_dump(exclude_unset=True))
    return LeadResponse.model_validate(lead)


@router.patch("/{lead_id}/stage", response_model=LeadResponse)
async def update_lead_stage(
    lead_id: UUID,
    data: LeadStageUpdateRequest,
    lead_service: LeadService = Depends(get_lead_service),
    current_user: dict = Depends(get_current_user),
) -> LeadResponse:
    """Update lead funnel stage directly (e.g. from Kanban drag-and-drop or pipeline triage)."""
    lead = await lead_service.update_lead(lead_id, lead_stage=data.lead_stage)
    return LeadResponse.model_validate(lead)



@router.post("/{lead_id}/score", response_model=LeadResponse)
async def update_lead_score(
    lead_id: UUID,
    data: LeadScoreUpdateRequest,
    lead_service: LeadService = Depends(get_lead_service),
    current_user: dict = Depends(get_current_user),
) -> LeadResponse:
    lead = await lead_service.adjust_lead_score(
        lead_id=lead_id,
        new_score=data.new_score,
        reason=data.reason,
        event_type="manual_adjustment",
    )
    return LeadResponse.model_validate(lead)
