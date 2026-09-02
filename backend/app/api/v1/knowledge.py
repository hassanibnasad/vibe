"""
Knowledge management API — /api/v1/knowledge

Endpoints:
  POST   /upload             Upload a file → stage to RustFS → dispatch Hatchet ingestion task → 202
  GET    /                   List KnowledgeDocs (paginated, filterable by doc_type)
  DELETE /{doc_id}           Delete a single KnowledgeDoc row
  DELETE /source/{name}      Delete all chunks for a given source_file name
"""

from __future__ import annotations

import uuid
from typing import Annotated

import structlog
from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile, status
from pydantic import BaseModel

from app.api.deps import get_knowledge_ingestion_service, get_knowledge_repo
from app.config import settings
from app.dependencies import DEFAULT_TENANT_ID
from app.middleware.auth import get_current_user
from app.repositories.knowledge_repo import KnowledgeRepository
from app.services.knowledge import KnowledgeIngestionService
from app.services.knowledge.parsers import SUPPORTED_EXTENSIONS

logger = structlog.get_logger()

router = APIRouter(prefix="/knowledge", tags=["Knowledge"])

# ── Response schemas ──────────────────────────────────────────────────────────


class KnowledgeDocResponse(BaseModel):
    id: str
    title: str
    doc_type: str
    source_file: str | None
    chunk_index: int
    char_count: int | None
    ingestion_status: str
    tags: list[str]

    model_config = {"from_attributes": True}


class KnowledgeListResponse(BaseModel):
    data: list[KnowledgeDocResponse]
    pagination: dict


class UploadAcceptedResponse(BaseModel):
    job_id: str
    object_key: str
    filename: str
    status: str = "queued"
    message: str


class DeleteResponse(BaseModel):
    deleted: int


# ── Helpers ───────────────────────────────────────────────────────────────────


def _assert_supported_extension(filename: str) -> None:
    from pathlib import Path  # noqa: PLC0415

    ext = Path(filename).suffix.lower()
    if ext not in SUPPORTED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=(
                f"Unsupported file type '{ext}'. "
                f"Allowed: {sorted(SUPPORTED_EXTENSIONS)}"
            ),
        )


async def _stage_to_rustfs(content: bytes, object_key: str) -> None:
    """Upload raw bytes to RustFS.  No-op if RUSTFS_ENDPOINT is not configured."""
    if not settings.RUSTFS_ENDPOINT:
        logger.warning("rustfs_not_configured_skipping_stage", object_key=object_key)
        return

    try:
        import aioboto3  # noqa: PLC0415

        session = aioboto3.Session()
        async with session.client(
            "s3",
            endpoint_url=settings.RUSTFS_ENDPOINT,
            aws_access_key_id=settings.RUSTFS_ACCESS_KEY,
            aws_secret_access_key=settings.RUSTFS_SECRET_KEY,
        ) as s3:
            await s3.put_object(
                Bucket=settings.RUSTFS_BUCKET,
                Key=object_key,
                Body=content,
            )
    except ImportError:
        import asyncio  # noqa: PLC0415
        import boto3  # noqa: PLC0415

        def _sync_put() -> None:
            s3 = boto3.client(
                "s3",
                endpoint_url=settings.RUSTFS_ENDPOINT,
                aws_access_key_id=settings.RUSTFS_ACCESS_KEY,
                aws_secret_access_key=settings.RUSTFS_SECRET_KEY,
            )
            s3.put_object(Bucket=settings.RUSTFS_BUCKET, Key=object_key, Body=content)

        await asyncio.get_event_loop().run_in_executor(None, _sync_put)


# ── Endpoints ─────────────────────────────────────────────────────────────────


@router.post(
    "/upload",
    response_model=UploadAcceptedResponse,
    status_code=status.HTTP_202_ACCEPTED,
    summary="Upload a knowledge document for async ingestion",
)
async def upload_knowledge_doc(
    file: Annotated[UploadFile, File(description="Markdown, text, PDF, or DOCX file")],
    doc_type: Annotated[
        str,
        Form(description="Canonical type: brand | faq | product | template | case_study | general"),
    ] = "general",
    tags: Annotated[str, Form(description="Comma-separated tags, e.g. 'pricing,tier-1'")] = "",
    current_user: dict = Depends(get_current_user),
) -> UploadAcceptedResponse:
    """
    Stage the file to RustFS then dispatch a Hatchet ``knowledge-ingestion``
    background task.  Returns ``202 Accepted`` immediately.

    The Hatchet job handles chunking, embedding, and DB upsert asynchronously.
    """
    filename = file.filename or "upload.md"
    _assert_supported_extension(filename)

    content = await file.read()
    if len(content) > settings.INGESTION_MAX_FILE_SIZE_MB * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File exceeds the {settings.INGESTION_MAX_FILE_SIZE_MB} MB limit.",
        )

    # Stage to RustFS for durable access by the Hatchet worker.
    stage_id = uuid.uuid4()
    object_key = f"knowledge/{DEFAULT_TENANT_ID}/{stage_id}/{filename}"
    await _stage_to_rustfs(content, object_key)

    # Parse tags from comma-separated form field.
    tag_list = [t.strip() for t in tags.split(",") if t.strip()]

    # Dispatch Hatchet task.
    from app.workflows.ingestion_workflow import (  # noqa: PLC0415
        IngestionTaskInput,
        knowledge_ingestion_task,
    )

    job_ref = await knowledge_ingestion_task.aio_run(
        IngestionTaskInput(
            object_key=object_key,
            filename=filename,
            doc_type=doc_type,
            tenant_id=str(DEFAULT_TENANT_ID),
            tags=tag_list,
        )
    )

    job_id = str(getattr(job_ref, "workflow_run_id", stage_id))

    logger.info(
        "knowledge_upload.accepted",
        filename=filename,
        doc_type=doc_type,
        object_key=object_key,
        job_id=job_id,
    )

    return UploadAcceptedResponse(
        job_id=job_id,
        object_key=object_key,
        filename=filename,
        status="queued",
        message="File staged. Ingestion job dispatched. Chunks will be searchable once the job completes.",
    )


@router.get(
    "",
    response_model=KnowledgeListResponse,
    summary="List knowledge documents",
)
async def list_knowledge_docs(
    doc_type: str | None = Query(None, description="Filter by doc_type"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    knowledge_repo: KnowledgeRepository = Depends(get_knowledge_repo),
    current_user: dict = Depends(get_current_user),
) -> KnowledgeListResponse:
    """Paginated list of all KnowledgeDocs for the current tenant."""
    from sqlalchemy import select  # noqa: PLC0415
    from app.models.knowledge_doc import KnowledgeDoc  # noqa: PLC0415

    skip = (page - 1) * limit
    stmt = select(KnowledgeDoc).offset(skip).limit(limit).order_by(
        KnowledgeDoc.doc_type.asc(), KnowledgeDoc.chunk_index.asc()
    )
    if doc_type:
        stmt = stmt.where(KnowledgeDoc.doc_type == doc_type)

    result = await knowledge_repo.session.execute(stmt)
    docs = list(result.scalars().all())
    total = await knowledge_repo.count()

    return KnowledgeListResponse(
        data=[KnowledgeDocResponse.model_validate(d) for d in docs],
        pagination={"page": page, "limit": limit, "total": total},
    )


@router.delete(
    "/source/{source_name:path}",
    response_model=DeleteResponse,
    summary="Delete all chunks for a given source file",
)
async def delete_by_source(
    source_name: str,
    knowledge_repo: KnowledgeRepository = Depends(get_knowledge_repo),
    current_user: dict = Depends(get_current_user),
) -> DeleteResponse:
    """Delete every chunk whose ``source_file`` matches ``source_name``."""
    count = await knowledge_repo.delete_by_source(
        source_file=source_name, tenant_id=DEFAULT_TENANT_ID
    )
    await knowledge_repo.session.commit()
    return DeleteResponse(deleted=count)


@router.delete(
    "/{doc_id}",
    response_model=DeleteResponse,
    summary="Delete a single knowledge document chunk",
)
async def delete_knowledge_doc(
    doc_id: uuid.UUID,
    knowledge_repo: KnowledgeRepository = Depends(get_knowledge_repo),
    current_user: dict = Depends(get_current_user),
) -> DeleteResponse:
    """Delete a single KnowledgeDoc row by its UUID."""
    deleted = await knowledge_repo.delete(doc_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="KnowledgeDoc not found")
    await knowledge_repo.session.commit()
    return DeleteResponse(deleted=1)
