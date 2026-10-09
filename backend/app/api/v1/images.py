from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from app.dependencies import get_db_session
from app.middleware.auth import get_current_user
from app.repositories.brand_profile_repo import BrandProfileRepository
from app.services.image_generation_service import ImageGenerationService, ImageResult

router = APIRouter(prefix="/images", tags=["Images"])


class ImageGenerateRequest(BaseModel):
    prompt: str = Field(..., min_length=2, description="Image generation prompt")
    width: int | None = None
    height: int | None = None
    aspect_ratio: str | None = "1:1"
    style_preset: str | None = None
    brand_profile_id: UUID | None = None
    n: int = Field(default=1, ge=1, le=4)


@router.post(
    "/generate",
    response_model=list[ImageResult],
    status_code=status.HTTP_200_OK,
    summary="Generate marketing visuals using FLUX.1-schnell",
)
async def generate_image(
    data: ImageGenerateRequest,
    current_user: dict = Depends(get_current_user),
) -> list[ImageResult]:
    """Generate marketing visuals via configured provider (Hugging Face Space FLUX.1-schnell)."""
    service = ImageGenerationService()

    brand_profile_dict: dict | None = None
    # Optionally load brand identity to ground prompt
    if data.brand_profile_id:
        async for session in get_db_session():
            repo = BrandProfileRepository(session)
            profile = await repo.get_by_id(data.brand_profile_id)
            if profile:
                brand_profile_dict = {
                    "brand_name": profile.brand_name,
                    "visual_identity": profile.visual_identity or {},
                }
            break

    composed_prompt = service.build_brand_image_prompt(
        base_prompt=data.prompt,
        brand_profile=brand_profile_dict,
        style_preset=data.style_preset,
    )

    results = await service.generate(
        prompt=composed_prompt,
        width=data.width,
        height=data.height,
        aspect_ratio=data.aspect_ratio,
        n=data.n,
        fallback_to_pollinations=True,
    )

    if not results:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Image generation returned no results. Verify provider and credentials.",
        )

    return results
