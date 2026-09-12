"""004 — brand_profile and content_performance tables, posts.conversion_score column.

Revision ID: 004
Revises: 003_knowledge_1024_model
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "004_brand_profile_and_performance"
down_revision = "003_knowledge_1024_model"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ── brand_profiles ────────────────────────────────────────────────────────
    op.create_table(
        "brand_profiles",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("tenant_id", postgresql.UUID(as_uuid=True), nullable=False, unique=True),
        sa.Column("brand_name", sa.String(255), nullable=False),
        sa.Column("website_url", sa.String(500), nullable=True),
        sa.Column("tagline", sa.String(500), nullable=True),
        sa.Column("visual_identity", postgresql.JSONB, nullable=False, server_default=sa.text("'{}'::jsonb")),
        sa.Column("written_identity", postgresql.JSONB, nullable=False, server_default=sa.text("'{}'::jsonb")),
        sa.Column("core_value_props", postgresql.JSONB, nullable=False, server_default=sa.text("'[]'::jsonb")),
        sa.Column("conversion_assets", postgresql.JSONB, nullable=False, server_default=sa.text("'{}'::jsonb")),
        sa.Column("icp_pain_points", postgresql.JSONB, nullable=False, server_default=sa.text("'[]'::jsonb")),
        sa.Column("extraction_status", sa.String(20), nullable=False, server_default="pending"),
        sa.Column("screenshot_url", sa.String(500), nullable=True),
        sa.Column("raw_scraped_markdown", sa.Text, nullable=True),
        sa.Column("last_extracted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_index("ix_brand_profiles_tenant_id", "brand_profiles", ["tenant_id"])
    op.create_index("ix_brand_profiles_extraction_status", "brand_profiles", ["extraction_status"])

    # RLS policy matching existing tenant isolation pattern
    op.execute(
        "ALTER TABLE brand_profiles ENABLE ROW LEVEL SECURITY"
    )
    op.execute(
        """
        CREATE POLICY tenant_isolation_brand_profiles ON brand_profiles
        USING (tenant_id::text = current_setting('app.current_tenant', true))
        """
    )

    # ── content_performance ───────────────────────────────────────────────────
    op.create_table(
        "content_performance",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("tenant_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("post_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("posts.id", ondelete="CASCADE"), nullable=False, unique=True),
        sa.Column("impressions", sa.Integer, nullable=False, server_default="0"),
        sa.Column("likes", sa.Integer, nullable=False, server_default="0"),
        sa.Column("comments", sa.Integer, nullable=False, server_default="0"),
        sa.Column("shares", sa.Integer, nullable=False, server_default="0"),
        sa.Column("dms_initiated", sa.Integer, nullable=False, server_default="0"),
        sa.Column("leads_generated", sa.Integer, nullable=False, server_default="0"),
        sa.Column("leads_qualified", sa.Integer, nullable=False, server_default="0"),
        sa.Column("conversion_score", sa.Float, nullable=False, server_default="0.0"),
        sa.Column("hook_type", sa.String(50), nullable=True),
        sa.Column("cta_type", sa.String(50), nullable=True),
        sa.Column("topic_cluster", sa.String(100), nullable=True),
        sa.Column("scored_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_index("ix_content_performance_tenant_id", "content_performance", ["tenant_id"])
    op.create_index("ix_content_performance_post_id", "content_performance", ["post_id"])
    op.create_index("ix_content_performance_conversion_score", "content_performance", ["conversion_score"])

    # RLS policy
    op.execute(
        "ALTER TABLE content_performance ENABLE ROW LEVEL SECURITY"
    )
    op.execute(
        """
        CREATE POLICY tenant_isolation_content_performance ON content_performance
        USING (tenant_id::text = current_setting('app.current_tenant', true))
        """
    )

    # ── posts.conversion_score ────────────────────────────────────────────────
    op.add_column("posts", sa.Column("conversion_score", sa.Float, server_default="0.0", nullable=False))
    op.create_index("ix_posts_conversion_score", "posts", ["conversion_score"])


def downgrade() -> None:
    op.drop_index("ix_posts_conversion_score", table_name="posts")
    op.drop_column("posts", "conversion_score")

    op.execute("DROP POLICY IF EXISTS tenant_isolation_content_performance ON content_performance")
    op.drop_table("content_performance")

    op.execute("DROP POLICY IF EXISTS tenant_isolation_brand_profiles ON brand_profiles")
    op.drop_table("brand_profiles")
