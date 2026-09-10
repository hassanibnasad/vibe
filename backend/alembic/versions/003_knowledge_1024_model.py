"""003 Knowledge doc 1024 dims and embedding model

Revision ID: 003_knowledge_1024_model
Revises: 002_knowledge_doc_improvements
Create Date: 2026-09-09 00:00:00.000000

"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic
revision = "003_knowledge_1024_model"
down_revision = "002_knowledge_doc_improvements"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ── 1. Update vector column to 1024 dimensions ───────────────────────────
    # The HNSW index must be dropped before modifying the column type.
    op.execute("DROP INDEX IF EXISTS ix_knowledge_docs_hnsw")

    # In PostgreSQL with pgvector, 384-dim vectors cannot be cast to 1024-dim.
    # Set existing vectors to NULL so rows can be re-embedded with the new model,
    # and mark their ingestion_status as 'pending' so retrieval ignores them until re-embedded.
    op.execute(
        "ALTER TABLE knowledge_docs ALTER COLUMN embedding TYPE vector(1024) USING NULL"
    )
    op.execute(
        "UPDATE knowledge_docs SET ingestion_status = 'pending' WHERE embedding IS NULL"
    )

    # Recreate the HNSW index on the 1024-dim column.
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_knowledge_docs_hnsw "
        "ON knowledge_docs USING hnsw (embedding vector_cosine_ops)"
    )

    # ── 2. Add embedding_model column ─────────────────────────────────────────
    op.add_column(
        "knowledge_docs",
        sa.Column(
            "embedding_model",
            sa.String(100),
            nullable=True,
            comment="Model identifier (e.g. BAAI/bge-large-en-v1.5) used to produce embedding",
        ),
    )

    # Index on embedding_model enables fast filtering for re-embedding queries:
    # WHERE embedding_model != :current_model OR embedding_model IS NULL
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_knowledge_docs_embedding_model "
        "ON knowledge_docs (embedding_model)"
    )


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS ix_knowledge_docs_embedding_model")
    op.drop_column("knowledge_docs", "embedding_model")

    op.execute("DROP INDEX IF EXISTS ix_knowledge_docs_hnsw")
    op.execute(
        "ALTER TABLE knowledge_docs ALTER COLUMN embedding TYPE vector(384) USING NULL"
    )
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_knowledge_docs_hnsw "
        "ON knowledge_docs USING hnsw (embedding vector_cosine_ops)"
    )
