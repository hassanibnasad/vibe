import argparse
import asyncio
from pathlib import Path
import sys

# Ensure backend root is on sys.path
backend_path = Path(__file__).parent.parent / "backend"
sys.path.insert(0, str(backend_path))

from sqlalchemy import delete
from app.config import settings
from app.dependencies import get_engine, get_sessionmaker
from app.models.knowledge_doc import KnowledgeDoc
from app.tools.ai.llm_client import LLMClient


def chunk_text(text: str, chunk_size: int = 500, overlap: int = 50) -> list[str]:
    """Token-aware sliding window chunker."""
    words = text.split()
    chunks: list[str] = []
    i = 0
    while i < len(words):
        chunk = " ".join(words[i : i + chunk_size])
        if chunk.strip():
            chunks.append(chunk)
        i += chunk_size - overlap
    return chunks or [text]


async def ingest_knowledge_base(
    directory: str = "knowledge-base",
    chunk_size: int = 500,
    overlap: int = 50,
    clear_existing: bool = False,
    dry_run: bool = False,
):
    kb_dir = Path(directory)
    if not kb_dir.is_absolute():
        kb_dir = Path(__file__).parent.parent / directory

    if not kb_dir.exists():
        print(f"❌ Knowledge base directory '{kb_dir}' does not exist.")
        return

    engine = get_engine()
    session_factory = get_sessionmaker()
    llm = LLMClient()

    print(f"🔍 Scanning knowledge base at: {kb_dir}")
    doc_files = list(kb_dir.rglob("*.md")) + list(kb_dir.rglob("*.txt"))
    print(f"📄 Found {len(doc_files)} documents to ingest.")

    if dry_run:
        total_chunks = 0
        for filepath in doc_files:
            content = filepath.read_text(encoding="utf-8")
            chunks = chunk_text(content, chunk_size=chunk_size, overlap=overlap)
            total_chunks += len(chunks)
            print(f"  - {filepath.name}: {len(chunks)} chunks ({len(content)} chars)")
        print(f"✅ [Dry Run] Total documents: {len(doc_files)}, Total chunks: {total_chunks}")
        await llm.close()
        await engine.dispose()
        return

    total_chunks = 0
    async with session_factory() as session:
        if clear_existing:
            print("🧹 Clearing existing knowledge docs from database...")
            await session.execute(delete(KnowledgeDoc))

        for filepath in doc_files:
            relative_path = filepath.relative_to(kb_dir)
            doc_type = relative_path.parts[0] if len(relative_path.parts) > 1 else "general"
            title = filepath.stem.replace("_", " ").replace("-", " ").title()

            content = filepath.read_text(encoding="utf-8")
            chunks = chunk_text(content, chunk_size=chunk_size, overlap=overlap)

            for idx, chunk in enumerate(chunks):
                try:
                    embedding = await llm.embed(chunk)
                except Exception as exc:
                    print(f"⚠️ Embedding failed for {filepath.name} chunk {idx}: {exc}. Using zero vector.")
                    embedding = [0.0] * 384

                doc = KnowledgeDoc(
                    title=f"{title} (Part {idx + 1})" if len(chunks) > 1 else title,
                    content=chunk,
                    doc_type=doc_type,
                    embedding=embedding,
                    source_file=str(relative_path),
                    chunk_index=idx,
                    metadata_={
                        "file_size": len(content),
                        "total_chunks": len(chunks),
                        "source_path": str(filepath),
                    },
                )
                session.add(doc)
                total_chunks += 1

        await session.commit()
        print(f"✅ Ingestion complete! Ingested {len(doc_files)} docs ({total_chunks} chunks) into pgvector.")

    await engine.dispose()
    await llm.close()


def main():
    parser = argparse.ArgumentParser(description="Ingest markdown & text documents into VibeAgent pgvector Knowledge Base")
    parser.add_argument("--dir", default="knowledge-base", help="Directory containing knowledge docs (default: knowledge-base)")
    parser.add_argument("--chunk-size", type=int, default=500, help="Chunk size in words (default: 500)")
    parser.add_argument("--overlap", type=int, default=50, help="Overlap between chunks in words (default: 50)")
    parser.add_argument("--clear", action="store_true", help="Clear existing knowledge docs before ingestion")
    parser.add_argument("--dry-run", action="store_true", help="Count chunks and validate files without database write")
    args = parser.parse_args()

    asyncio.run(
        ingest_knowledge_base(
            directory=args.dir,
            chunk_size=args.chunk_size,
            overlap=args.overlap,
            clear_existing=args.clear,
            dry_run=args.dry_run,
        )
    )


if __name__ == "__main__":
    main()
