"""002 Knowledge doc improvements — checksum, char_count, ingestion_status, tags, indexes

Revision ID: 002_knowledge_doc_improvements
Revises: 001_initial_schema_with_rls
Create Date: 2026-09-02 00:00:00.000000

"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic
revision = "002_knowledge_doc_improvements"
down_revision = "001_initial_schema_with_rls"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ── New columns ──────────────────────────────────────────────────────────

    op.add_column(
        "knowledge_docs",
        sa.Column(
            "checksum",
            sa.String(64),
            nullable=True,
            comment="SHA-256 hex digest of raw chunk text; used for skip-on-no-change idempotency",
        ),
    )
    op.add_column(
        "knowledge_docs",
        sa.Column(
            "char_count",
            sa.Integer(),
            nullable=True,
            comment="Character count of content at write time; used for context-window budget enforcement at retrieval",
        ),
    )
    op.add_column(
        "knowledge_docs",
        sa.Column(
            "ingestion_status",
            sa.String(20),
            nullable=False,
            server_default="embedded",
            comment="pending | embedded | failed — enables Hatchet step resumption on partial failures",
        ),
    )
    op.add_column(
        "knowledge_docs",
        sa.Column(
            "tags",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
            server_default="[]",
            comment="Free-form string tags for filtering (e.g. ['pricing', 'tier-1'])",
        ),
    )

    # ── Backfill existing rows ───────────────────────────────────────────────
    # Set char_count from existing content where NULL
    op.execute(
        "UPDATE knowledge_docs SET char_count = LENGTH(content) WHERE char_count IS NULL"
    )

    # ── Indexes ──────────────────────────────────────────────────────────────

    # Unique partial index — prevents duplicate chunk on re-ingestion.
    # WHERE source_file IS NOT NULL so API-uploaded ephemeral docs without a
    # file path are excluded from the uniqueness constraint.
    op.execute(
        """
        CREATE UNIQUE INDEX IF NOT EXISTS uix_knowledge_docs_source_chunk
        ON knowledge_docs (tenant_id, source_file, chunk_index)
        WHERE source_file IS NOT NULL
        """
    )

    # GIN index on metadata JSONB — fast containment queries like
    # WHERE metadata @> '{"campaign_id": "..."}' used by retrieval filters.
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_knowledge_docs_metadata_gin "
        "ON knowledge_docs USING gin (metadata)"
    )

    # GIN index on tags JSONB array — fast ANY() filtering.
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_knowledge_docs_tags_gin "
        "ON knowledge_docs USING gin (tags)"
    )

    # B-tree index on ingestion_status — for worker queries like
    # WHERE ingestion_status = 'pending'.
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_knowledge_docs_ingestion_status "
        "ON knowledge_docs (ingestion_status)"
    )


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS ix_knowledge_docs_ingestion_status")
    op.execute("DROP INDEX IF EXISTS ix_knowledge_docs_tags_gin")
    op.execute("DROP INDEX IF EXISTS ix_knowledge_docs_metadata_gin")
    op.execute("DROP INDEX IF EXISTS uix_knowledge_docs_source_chunk")

    op.drop_column("knowledge_docs", "tags")
    op.drop_column("knowledge_docs", "ingestion_status")
    op.drop_column("knowledge_docs", "char_count")
    op.drop_column("knowledge_docs", "checksum")
