import uuid
from pgvector.sqlalchemy import Vector
from sqlalchemy import Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import BaseModel


class KnowledgeDoc(BaseModel):
    __tablename__ = "knowledge_docs"

    title: Mapped[str] = mapped_column(String(500), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    doc_type: Mapped[str] = mapped_column(String(50), nullable=False, index=True)

    # 384 dimensions for all-MiniLM-L6-v2 embeddings
    embedding = mapped_column(Vector(384), nullable=True)

    source_file: Mapped[str | None] = mapped_column(String(500))
    metadata_: Mapped[dict] = mapped_column("metadata", JSONB, default=dict)
    chunk_index: Mapped[int] = mapped_column(Integer, default=0)
    parent_doc_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))
