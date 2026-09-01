from uuid import UUID

from fastapi import APIRouter, Depends, Query, status

from app.api.deps import get_content_service
from app.dependencies import DEFAULT_TENANT_ID
from app.middleware.auth import get_current_user
from app.schemas.post import (
    PostCreateRequest,
    PostGenerateRequest,
    PostListResponse,
    PostPublishRequest,
    PostResponse,
    PostUpdateRequest,
)
from app.services.content_service import ContentService
from app.workflows.content_workflow import ContentPipelineInput, content_pipeline_task
from app.workflows.scheduled_publish import PublishSinglePostInput, publish_single_post_task

router = APIRouter(prefix="/posts", tags=["Posts"])


@router.post("/generate", response_model=PostResponse, status_code=status.HTTP_201_CREATED)
async def generate_post(
    data: PostGenerateRequest,
    content_service: ContentService = Depends(get_content_service),
    current_user: dict = Depends(get_current_user),
) -> PostResponse:
    """Generate marketing post draft via ContentGeneratorAgent, dispatched through Hatchet."""
    platform_type = data.platforms[0] if data.platforms else "linkedin"

    result = await content_pipeline_task.aio_run(
        ContentPipelineInput(
            brief=data.brief,
            platform_id=str(DEFAULT_TENANT_ID),
            platform_type=platform_type,
            tone=data.tone,
            campaign_id=str(data.campaign_id) if data.campaign_id else None,
            variants_count=data.variants,
            auto_publish=False,
        )
    )

    post = await content_service.get_post(UUID(result["post_id"]))
    return PostResponse.model_validate(post)


@router.post("/generate-variants", response_model=list[PostResponse], status_code=status.HTTP_201_CREATED)
async def generate_post_variants(
    data: PostGenerateRequest,
    content_service: ContentService = Depends(get_content_service),
    current_user: dict = Depends(get_current_user),
) -> list[PostResponse]:
    """Generate multiple marketing post draft variants for A/B testing via Hatchet."""
    platform_type = data.platforms[0] if data.platforms else "linkedin"

    result = await content_pipeline_task.aio_run(
        ContentPipelineInput(
            brief=data.brief,
            platform_id=str(DEFAULT_TENANT_ID),
            platform_type=platform_type,
            tone=data.tone,
            campaign_id=str(data.campaign_id) if data.campaign_id else None,
            variants_count=max(data.variants, 2),
            auto_publish=False,
        )
    )

    post_ids = [UUID(pid) for pid in result.get("post_ids", [result["post_id"]])]
    posts = [await content_service.get_post(pid) for pid in post_ids]
    return [PostResponse.model_validate(p) for p in posts]


@router.post("/{post_id}/approve", response_model=PostResponse)
async def approve_post(
    post_id: UUID,
    content_service: ContentService = Depends(get_content_service),
    current_user: dict = Depends(get_current_user),
) -> PostResponse:
    """Approve a draft post for publishing/scheduling."""
    post = await content_service.approve_post(post_id)
    return PostResponse.model_validate(post)


@router.get("", response_model=PostListResponse)
async def list_posts(
    status_filter: str | None = Query(None, alias="status"),
    platform_id: UUID | None = Query(None),
    campaign_id: UUID | None = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    content_service: ContentService = Depends(get_content_service),
    current_user: dict = Depends(get_current_user),
) -> PostListResponse:
    skip = (page - 1) * limit
    posts, total = await content_service.list_posts(
        status_filter=status_filter,
        platform_id=platform_id,
        campaign_id=campaign_id,
        skip=skip,
        limit=limit,
    )
    return PostListResponse(
        data=[PostResponse.model_validate(post) for post in posts],
        pagination={"page": page, "limit": limit, "total": total},
    )


@router.post("", response_model=PostResponse, status_code=status.HTTP_201_CREATED)
async def create_post(
    data: PostCreateRequest,
    content_service: ContentService = Depends(get_content_service),
    current_user: dict = Depends(get_current_user),
) -> PostResponse:
    post_data = data.model_dump()
    post = await content_service.create_manual_post(**post_data)
    return PostResponse.model_validate(post)


@router.get("/{post_id}", response_model=PostResponse)
async def get_post(
    post_id: UUID,
    content_service: ContentService = Depends(get_content_service),
    current_user: dict = Depends(get_current_user),
) -> PostResponse:
    post = await content_service.get_post(post_id)
    return PostResponse.model_validate(post)


@router.put("/{post_id}", response_model=PostResponse)
async def update_post(
    post_id: UUID,
    data: PostUpdateRequest,
    content_service: ContentService = Depends(get_content_service),
    current_user: dict = Depends(get_current_user),
) -> PostResponse:
    post = await content_service.update_post(post_id, **data.model_dump(exclude_unset=True))
    return PostResponse.model_validate(post)


@router.post("/{post_id}/publish", response_model=PostResponse)
async def publish_post(
    post_id: UUID,
    data: PostPublishRequest,
    content_service: ContentService = Depends(get_content_service),
    current_user: dict = Depends(get_current_user),
) -> PostResponse:
    if data.scheduled_at:
        post = await content_service.schedule(post_id, scheduled_at=data.scheduled_at)
        return PostResponse.model_validate(post)

    await publish_single_post_task.aio_run(PublishSinglePostInput(post_id=str(post_id)))
    post = await content_service.get_post(post_id)
    return PostResponse.model_validate(post)


@router.delete("/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_post(
    post_id: UUID,
    content_service: ContentService = Depends(get_content_service),
    current_user: dict = Depends(get_current_user),
) -> None:
    await content_service.delete_post(post_id)
