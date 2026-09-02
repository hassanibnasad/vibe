#!/usr/bin/env python
"""
Knowledge-base seed script.

Delegates to KnowledgeIngestionService (MarkdownAwareChunker, DocumentParser,
idempotent upsert via checksum).

Usage:
  # Ingest the full knowledge-base/ directory (run from repo root)
  uv run python scripts/ingest_knowledge.py --dir knowledge-base/

  # Ingest (or re-ingest) a single file
  uv run python scripts/ingest_knowledge.py --file knowledge-base/faq/pricing.md --doc-type faq

  # Delete all chunks for a source file then re-ingest (heading restructuring)
  uv run python scripts/ingest_knowledge.py --file knowledge-base/faq/pricing.md --force-reindex

  # Dry-run: show what would be ingested without writing anything
  uv run python scripts/ingest_knowledge.py --dir knowledge-base/ --dry-run
"""

from __future__ import annotations

import argparse
import asyncio
import sys
import uuid
from pathlib import Path

# ── backend/ onto sys.path ────────────────────────────────────────────────────
_BACKEND = Path(__file__).resolve().parent.parent / "backend"
if str(_BACKEND) not in sys.path:
    sys.path.insert(0, str(_BACKEND))


async def _run(args: argparse.Namespace) -> None:
    from app.config import settings  # noqa: PLC0415
    from app.dependencies import get_sessionmaker  # noqa: PLC0415
    from app.repositories.knowledge_repo import KnowledgeRepository  # noqa: PLC0415
    from app.services.knowledge.ingestion_service import (  # noqa: PLC0415
        KnowledgeIngestionService,
        _DIR_TO_DOC_TYPE,
    )
    from app.services.knowledge.parsers import SUPPORTED_EXTENSIONS  # noqa: PLC0415
    from app.tools.ai.llm_client import LLMClient  # noqa: PLC0415

    tenant_id = uuid.UUID("00000000-0000-0000-0000-000000000001")  # default tenant

    if args.dry_run:
        print("── DRY RUN — no writes will occur ──────────────────────────")

    session_factory = get_sessionmaker()

    async with session_factory() as session:
        repo = KnowledgeRepository(session)
        llm_client = LLMClient()
        svc = KnowledgeIngestionService(knowledge_repo=repo, llm_client=llm_client)

        # ── Single file ────────────────────────────────────────────────────────
        if args.file:
            path = Path(args.file).resolve()
            if not path.exists():
                print(f"ERROR: File not found: {path}", file=sys.stderr)
                sys.exit(1)
            if path.suffix.lower() not in SUPPORTED_EXTENSIONS:
                print(
                    f"ERROR: Unsupported extension '{path.suffix}'. "
                    f"Supported: {sorted(SUPPORTED_EXTENSIONS)}",
                    file=sys.stderr,
                )
                sys.exit(1)

            doc_type = args.doc_type or "general"

            if args.dry_run:
                from app.services.knowledge.chunker import MarkdownAwareChunker  # noqa: PLC0415
                from app.services.knowledge.parsers import DocumentParser  # noqa: PLC0415

                parsed = DocumentParser().parse_path(path)
                chunks = MarkdownAwareChunker(
                    max_tokens=settings.INGESTION_CHUNK_SIZE,
                    overlap_tokens=settings.INGESTION_CHUNK_OVERLAP,
                ).chunk(parsed.raw_text, document_title=parsed.title)
                print(f"\n  {path}")
                print(f"  doc_type : {doc_type}")
                print(f"  title    : {parsed.title}")
                print(f"  chunks   : {len(chunks)}")
                for c in chunks:
                    print(f"    [{c.chunk_index}] {c.title!r}  ({c.char_count} chars)")
                return

            if args.force_reindex:
                deleted = await svc.delete_by_source(str(path), tenant_id)
                print(f"  Deleted {deleted} existing chunks for {path.name}")

            result = await svc.ingest_file(path=path, doc_type=doc_type, tenant_id=tenant_id)
            await session.commit()

            print(f"\n✓ {path.name}")
            print(f"  doc_type       : {doc_type}")
            print(f"  parent_doc_id  : {result.parent_doc_id}")
            print(f"  chunks total   : {result.chunks_total}")
            print(f"  chunks written : {result.chunks_written}")
            print(f"  chunks skipped : {result.chunks_skipped}")
            if result.chunks_failed:
                print(f"  chunks FAILED  : {result.chunks_failed} → {result.failed_chunk_indices}")

        # ── Directory ──────────────────────────────────────────────────────────
        elif args.dir:
            root = Path(args.dir).resolve()
            if not root.is_dir():
                # Try relative to repo root
                root = Path(__file__).resolve().parent.parent / args.dir
            if not root.is_dir():
                print(f"ERROR: Directory not found: {args.dir}", file=sys.stderr)
                sys.exit(1)

            files = sorted(
                p for p in root.rglob("*")
                if p.is_file() and p.suffix.lower() in SUPPORTED_EXTENSIONS
            )
            print(f"\nFound {len(files)} file(s) under {root}\n")

            if args.dry_run:
                from app.services.knowledge.chunker import MarkdownAwareChunker  # noqa: PLC0415
                from app.services.knowledge.parsers import DocumentParser  # noqa: PLC0415

                total_chunks = 0
                for path in files:
                    rel = path.relative_to(root)
                    subdir = rel.parts[0] if len(rel.parts) > 1 else ""
                    doc_type = _DIR_TO_DOC_TYPE.get(subdir, "general")
                    try:
                        parsed = DocumentParser().parse_path(path)
                        chunks = MarkdownAwareChunker(
                            max_tokens=settings.INGESTION_CHUNK_SIZE,
                            overlap_tokens=settings.INGESTION_CHUNK_OVERLAP,
                        ).chunk(parsed.raw_text, document_title=parsed.title)
                        total_chunks += len(chunks)
                        print(f"  {rel}  [{doc_type}]  →  {len(chunks)} chunks")
                    except Exception as e:
                        print(f"  ERROR {rel}: {e}")
                print(f"\nTotal chunks that would be written: {total_chunks}")
                return

            results = await svc.ingest_directory(root=root, tenant_id=tenant_id)
            await session.commit()

            total_written = sum(r.chunks_written for r in results.values())
            total_skipped = sum(r.chunks_skipped for r in results.values())
            total_failed = sum(r.chunks_failed for r in results.values())

            print("\n── Summary ─────────────────────────────────────────────────")
            for src, result in results.items():
                icon = "✓" if result.chunks_failed == 0 else "⚠"
                print(
                    f"  {icon} {Path(src).name:<40} "
                    f"written={result.chunks_written}  "
                    f"skipped={result.chunks_skipped}  "
                    f"failed={result.chunks_failed}"
                )
            print(f"\n  Total written : {total_written}")
            print(f"  Total skipped : {total_skipped}")
            if total_failed:
                print(f"  Total FAILED  : {total_failed}")
        else:
            print("ERROR: Specify --file <path> or --dir <directory>", file=sys.stderr)
            sys.exit(1)


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Ingest knowledge-base documents into pgvector.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    source = parser.add_mutually_exclusive_group(required=True)
    source.add_argument("--file", metavar="PATH", help="Single file to ingest")
    source.add_argument("--dir", metavar="PATH", help="Directory to walk and ingest")

    parser.add_argument(
        "--doc-type",
        metavar="TYPE",
        default=None,
        help="Override doc_type. Inferred from subdirectory name when using --dir.",
    )
    parser.add_argument(
        "--force-reindex",
        action="store_true",
        help="Delete existing chunks for the file before re-ingesting (--file only).",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Show what would be ingested without writing to the database.",
    )

    args = parser.parse_args()
    asyncio.run(_run(args))


if __name__ == "__main__":
    main()
