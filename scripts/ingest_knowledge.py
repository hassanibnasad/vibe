import asyncio
import os
from pathlib import Path
import sys

# Ensure backend root is on sys.path
backend_path = Path(__file__).parent.parent / "backend"
sys.path.insert(0, str(backend_path))

from app.config import settings
from app.dependencies import get_engine, get_sessionmaker
from app.models.knowledge_doc import KnowledgeDoc
from app.tools.ai.llm_client import LLMClient


def chunk_text(text: str, chunk_size: int = 500, overlap: int = 50) -> list[str]:
    """Simple sliding window chunker."""
    words = text.split()
    chunks: list[str] = []
    i = 0
    while i < len(words):
        chunk = " ".join(words[i : i + chunk_size])
        if chunk.strip():
            chunks.append(chunk)
        i += chunk_size - overlap
    return chunks or [text]


async def ingest_knowledge_base():
    kb_dir = Path(__file__).parent.parent / "knowledge-base"
    if not kb_dir.exists():
        print(f"Knowledge base directory {kb_dir} not found.")
        return

    engine = get_engine()
    session_factory = get_sessionmaker()
    llm = LLMClient()

    print(f"Scanning knowledge base at: {kb_dir}")
    md_files = list(kb_dir.rglob("*.md"))
    print(f"Found {len(md_files)} documents to ingest.")

    total_chunks = 0
    async with session_factory() as session:
        for filepath in md_files:
            relative_path = filepath.relative_to(kb_dir)
            doc_type = relative_path.parts[0] if len(relative_path.parts) > 1 else "general"
            title = filepath.stem.replace("_", " ").title()

            content = filepath.read_text(encoding="utf-8")
            chunks = chunk_text(content)

            for idx, chunk in enumerate(chunks):
                try:
                    embedding = await llm.embed(chunk)
                except Exception:
                    # Fallback to zero vector if Ollama is not yet running
                    embedding = [0.0] * 384

                doc = KnowledgeDoc(
                    title=f"{title} (Part {idx + 1})" if len(chunks) > 1 else title,
                    content=chunk,
                    doc_type=doc_type,
                    embedding=embedding,
                    source_file=str(relative_path),
                    chunk_index=idx,
                    metadata_={"file_size": len(content), "total_chunks": len(chunks)},
                )
                session.add(doc)
                total_chunks += 1

        await session.commit()
        print(f"Successfully ingested {len(md_files)} documents ({total_chunks} chunks) into database.")

    await engine.dispose()
    await llm.close()


if __name__ == "__main__":
    asyncio.run(ingest_knowledge_base())
