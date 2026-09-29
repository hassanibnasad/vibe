"""004 — brand_profile and content_performance tables, posts.conversion_score column.

Revision ID: 004
Revises: 003_knowledge_1024_model
"""

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

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

    # ── posts ─────────────────────────────────────────────────────────────────
    op.create_table(
        "posts",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("tenant_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("campaign_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("campaigns.id", ondelete="SET NULL"), nullable=True),
        sa.Column("platform_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("platforms.id", ondelete="CASCADE"), nullable=True),
        sa.Column("content", sa.Text, nullable=False),
        sa.Column("media_urls", postgresql.JSONB, nullable=False, server_default=sa.text("'[]'::jsonb")),
        sa.Column("hashtags", postgresql.JSONB, nullable=False, server_default=sa.text("'[]'::jsonb")),
        sa.Column("cta", sa.Text, nullable=True),
        sa.Column("platform_post_id", sa.String(255), nullable=True),
        sa.Column("platform_post_url", sa.String(500), nullable=True),
        sa.Column("status", sa.String(20), nullable=False, server_default="draft"),
        sa.Column("error_message", sa.Text, nullable=True),
        sa.Column("retry_count", sa.Integer, nullable=False, server_default="0"),
        sa.Column("scheduled_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("published_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("engagement_metrics", postgresql.JSONB, nullable=False, server_default=sa.text("'{}'::jsonb")),
        sa.Column("ai_generated", sa.Boolean, nullable=False, server_default="false"),
        sa.Column("confidence_score", sa.Float, nullable=True),
        sa.Column("requires_review", sa.Boolean, nullable=False, server_default="false"),
        sa.Column("generation_prompt", sa.Text, nullable=True),
        sa.Column("rag_sources", postgresql.JSONB, nullable=False, server_default=sa.text("'[]'::jsonb")),
        sa.Column("metadata", postgresql.JSONB, nullable=False, server_default=sa.text("'{}'::jsonb")),
        sa.Column("variant_group", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("variant_label", sa.String(10), nullable=True),
        sa.Column("current_revision_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("approved_revision_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("conversion_score", sa.Float, nullable=False, server_default="0.0"),
        sa.Column("created_by", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("approved_by", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_index("ix_posts_tenant_id", "posts", ["tenant_id"])
    op.create_index("ix_posts_campaign_id", "posts", ["campaign_id"])
    op.create_index("ix_posts_platform_id", "posts", ["platform_id"])
    op.create_index("ix_posts_status", "posts", ["status"])
    op.create_index("ix_posts_scheduled_at", "posts", ["scheduled_at"])
    op.create_index("ix_posts_published_at", "posts", ["published_at"])
    op.create_index("ix_posts_conversion_score", "posts", ["conversion_score"])

    op.execute("ALTER TABLE posts ENABLE ROW LEVEL SECURITY")
    op.execute("""
        CREATE POLICY tenant_isolation_posts ON posts
        USING (tenant_id::text = current_setting('app.current_tenant', true))
    """)

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


def downgrade() -> None:
    op.execute("DROP POLICY IF EXISTS tenant_isolation_content_performance ON content_performance")
    op.drop_table("content_performance")

    op.execute("DROP POLICY IF EXISTS tenant_isolation_posts ON posts")
    op.drop_table("posts")

    op.execute("DROP POLICY IF EXISTS tenant_isolation_brand_profiles ON brand_profiles")
    op.drop_table("brand_profiles")
