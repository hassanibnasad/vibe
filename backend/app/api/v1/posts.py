from datetime import datetime
from uuid import UUID
from fastapi import APIRouter, Depends, Query, status

from app.api.deps import get_post_repo
from app.exceptions import PostNotFoundError
from app.middleware.auth import get_current_user
from app.repositories.post_repo import PostRepository
from app.schemas.post import (
    PostCreateRequest,
    PostListResponse,
    PostPublishRequest,
    PostResponse,
    PostUpdateRequest,
)

router = APIRouter(prefix="/posts", tags=["Posts"])


@router.get("", response_model=PostListResponse)
async def list_posts(
    status_filter: str | None = Query(None, alias="status"),
    platform_id: UUID | None = Query(None),
    campaign_id: UUID | None = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    post_repo: PostRepository = Depends(get_post_repo),
    current_user: dict = Depends(get_current_user),
) -> PostListResponse:
    skip = (page - 1) * limit
    posts, total = await post_repo.filter_posts(
        status=status_filter,
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
    post_repo: PostRepository = Depends(get_post_repo),
    current_user: dict = Depends(get_current_user),
) -> PostResponse:
    post_data = data.model_dump()
    if post_data.get("scheduled_at"):
        post_data["status"] = "scheduled"
    else:
        post_data["status"] = "draft"

    post = await post_repo.create(**post_data)
    return PostResponse.model_validate(post)


@router.get("/{post_id}", response_model=PostResponse)
async def get_post(
    post_id: UUID,
    post_repo: PostRepository = Depends(get_post_repo),
    current_user: dict = Depends(get_current_user),
) -> PostResponse:
    post = await post_repo.get_by_id(post_id)
    if not post:
        raise PostNotFoundError(f"Post {post_id} not found")
    return PostResponse.model_validate(post)


@router.put("/{post_id}", response_model=PostResponse)
async def update_post(
    post_id: UUID,
    data: PostUpdateRequest,
    post_repo: PostRepository = Depends(get_post_repo),
    current_user: dict = Depends(get_current_user),
) -> PostResponse:
    post = await post_repo.update(post_id, **data.model_dump(exclude_unset=True))
    if not post:
        raise PostNotFoundError(f"Post {post_id} not found")
    return PostResponse.model_validate(post)


@router.post("/{post_id}/publish", response_model=PostResponse)
async def publish_post(
    post_id: UUID,
    data: PostPublishRequest,
    post_repo: PostRepository = Depends(get_post_repo),
    current_user: dict = Depends(get_current_user),
) -> PostResponse:
    post = await post_repo.get_by_id(post_id)
    if not post:
        raise PostNotFoundError(f"Post {post_id} not found")

    if data.scheduled_at:
        updated = await post_repo.update(
            post_id,
            status="scheduled",
            scheduled_at=data.scheduled_at,
        )
    else:
        # In production this triggers the publishing workflow
        updated = await post_repo.update(
            post_id,
            status="published",
            published_at=datetime.utcnow(),
        )

    return PostResponse.model_validate(updated)


@router.delete("/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_post(
    post_id: UUID,
    post_repo: PostRepository = Depends(get_post_repo),
    current_user: dict = Depends(get_current_user),
) -> None:
    deleted = await post_repo.delete(post_id)
    if not deleted:
        raise PostNotFoundError(f"Post {post_id} not found")
