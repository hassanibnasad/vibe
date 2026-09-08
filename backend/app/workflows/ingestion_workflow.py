"""
Hatchet durable task: knowledge-ingestion

Wraps KnowledgeIngestionService.ingest_bytes() so HTTP upload requests
return 202 Accepted immediately.  The actual chunking, embedding, and DB
writes happen in the background worker with full retry and observability.

Input contract:
- ``object_key``: RustFS object key where the staged file lives.
- ``filename``: original filename (used for MIME sniffing and source_file).
- ``doc_type``: canonical doc_type value (e.g. "brand", "faq").
- ``tenant_id``: UUID string of the owning tenant.
- ``metadata``: arbitrary dict merged into chunk metadata.
- ``tags``: optional list of string tags.
"""

from __future__ import annotations

import datetime
import uuid

import structlog
from hatchet_sdk import Context
from pydantic import BaseModel

from app.hatchet_client import hatchet

logger = structlog.get_logger()


class IngestionTaskInput(BaseModel):
    """Input schema for the knowledge-ingestion Hatchet task."""

    object_key: str
    filename: str
    doc_type: str
    tenant_id: str
    metadata: dict = {}
    tags: list[str] = []


from pathlib import Path

_LOCAL_STAGE_DIR = Path(".scratch/uploads")


@hatchet.task(
    name="knowledge-ingestion",
    input_validator=IngestionTaskInput,
    retries=2,
    execution_timeout=datetime.timedelta(minutes=10),
)
async def knowledge_ingestion_task(
    input: IngestionTaskInput,
    ctx: Context,
) -> dict:
    """
    1. Fetch staged file bytes from local staging or RustFS.
    2. Call KnowledgeIngestionService.ingest_bytes().
    3. Commit and return an IngestionResult summary.
    """
    from app.dependencies import get_sessionmaker  # noqa: PLC0415
    from app.repositories.knowledge_repo import KnowledgeRepository  # noqa: PLC0415
    from app.services.knowledge.ingestion_service import KnowledgeIngestionService  # noqa: PLC0415
    from app.tools.ai.llm_client import LLMClient  # noqa: PLC0415

    tenant_id = uuid.UUID(input.tenant_id)

    try:
        # ── Step 1: Fetch file bytes ─────────────────────────────────────────
        content = await _fetch_from_rustfs(input.object_key)

        # ── Step 2: Ingest ───────────────────────────────────────────────────
        session_factory = get_sessionmaker()
        async with session_factory() as session:
            repo = KnowledgeRepository(session)
            llm_client = LLMClient()
            svc = KnowledgeIngestionService(knowledge_repo=repo, llm_client=llm_client)

            result = await svc.ingest_bytes(
                content=content,
                filename=input.filename,
                doc_type=input.doc_type,
                tenant_id=tenant_id,
                metadata=input.metadata,
                tags=input.tags,
            )

            await session.commit()

        # Clean up local staged file if present
        local_path = _LOCAL_STAGE_DIR / input.object_key
        if local_path.is_file():
            try:
                local_path.unlink()
            except Exception:
                pass

        logger.info(
            "knowledge_ingestion_task.complete",
            source_file=result.source_file,
            chunks_total=result.chunks_total,
            chunks_written=result.chunks_written,
            chunks_skipped=result.chunks_skipped,
            chunks_failed=result.chunks_failed,
        )

        return {
            "source_file": result.source_file,
            "parent_doc_id": str(result.parent_doc_id),
            "chunks_total": result.chunks_total,
            "chunks_written": result.chunks_written,
            "chunks_skipped": result.chunks_skipped,
            "chunks_failed": result.chunks_failed,
            "failed_chunk_indices": result.failed_chunk_indices,
            "status": "failed" if result.chunks_failed > 0 and result.chunks_written == 0 else "ok",
        }
    except Exception as exc:
        logger.error(
            "knowledge_ingestion_task.error",
            filename=input.filename,
            object_key=input.object_key,
            error=str(exc),
        )
        return {
            "source_file": input.filename,
            "parent_doc_id": "",
            "chunks_total": 0,
            "chunks_written": 0,
            "chunks_skipped": 0,
            "chunks_failed": 1,
            "failed_chunk_indices": [0],
            "status": "failed",
            "error": str(exc),
        }


async def _fetch_from_rustfs(object_key: str) -> bytes:
    """
    Download a file from local staging or RustFS / S3-compatible object storage.
    """
    # 1. First check local staging directory
    local_path = _LOCAL_STAGE_DIR / object_key
    if local_path.is_file():
        logger.debug("fetching_from_local_stage", path=str(local_path))
        return local_path.read_bytes()

    # 2. Check RustFS if configured
    from app.config import settings  # noqa: PLC0415

    if not settings.RUSTFS_ENDPOINT:
        raise RuntimeError(
            f"Staged file not found locally ({local_path}) and RUSTFS_ENDPOINT is not configured."
        )

    try:
        from botocore.config import Config  # noqa: PLC0415
        import boto3  # noqa: PLC0415

        def _sync_fetch() -> bytes:
            cfg = Config(connect_timeout=2, read_timeout=5, retries={"max_attempts": 1})
            s3 = boto3.client(
                "s3",
                endpoint_url=settings.RUSTFS_ENDPOINT,
                aws_access_key_id=settings.RUSTFS_ACCESS_KEY,
                aws_secret_access_key=settings.RUSTFS_SECRET_KEY,
                config=cfg,
            )
            response = s3.get_object(Bucket=settings.RUSTFS_BUCKET, Key=object_key)
            return response["Body"].read()

        import asyncio  # noqa: PLC0415
        return await asyncio.get_event_loop().run_in_executor(None, _sync_fetch)
    except Exception as exc:
        raise RuntimeError(f"Failed to fetch staged file from RustFS ({object_key}): {exc}") from exc
