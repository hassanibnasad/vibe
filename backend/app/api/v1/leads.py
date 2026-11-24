from uuid import UUID

from fastapi import APIRouter, Depends, Query

from app.api.deps import get_lead_service, get_playbook_service
from app.dependencies import DEFAULT_TENANT_ID
from app.middleware.auth import get_current_user
from app.schemas.lead import (
    LeadListResponse,
    LeadResponse,
    LeadScoreUpdateRequest,
    LeadStageUpdateRequest,
    LeadUpdateRequest,
    PipelineResponse,
)
from app.schemas.playbook import (
    NurturePlaybook,
    PlaybookExecutionRequest,
    PlaybookExecutionResponse,
)
from app.services.lead_service import LeadService
from app.services.playbook_service import PlaybookService

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


@router.get("/{lead_id}/playbooks", response_model=list[NurturePlaybook])
async def get_lead_playbooks(
    lead_id: UUID,
    lead_service: LeadService = Depends(get_lead_service),
    playbook_service: PlaybookService = Depends(get_playbook_service),
    current_user: dict = Depends(get_current_user),
) -> list[NurturePlaybook]:
    """Retrieve BANT-driven nurture playbooks tailored with lead context & AI draft messages."""
    lead = await lead_service.get_lead(lead_id)
    return playbook_service.generate_playbooks_for_lead(lead)


@router.post(
    "/{lead_id}/playbooks/{playbook_id}/steps/{step_id}/execute",
    response_model=PlaybookExecutionResponse,
)
async def execute_lead_playbook_step(
    lead_id: UUID,
    playbook_id: str,
    step_id: str,
    data: PlaybookExecutionRequest | None = None,
    playbook_service: PlaybookService = Depends(get_playbook_service),
    current_user: dict = Depends(get_current_user),
) -> PlaybookExecutionResponse:
    """Execute a step in the lead nurture cadence with tamper-evident audit recording."""
    operator_id = UUID(current_user["id"]) if "id" in current_user else DEFAULT_TENANT_ID
    return await playbook_service.execute_step(
        lead_id=lead_id,
        tenant_id=DEFAULT_TENANT_ID,
        playbook_id=playbook_id,
        step_id=step_id,
        custom_message=data.custom_message if data else None,
        operator_id=operator_id,
        operator_email=current_user.get("email"),
    )

