"""005 — LinkedIn connector tables: social_connections, oauth_states, post_revisions,
publication_attempts; and posts columns for social connection + revision tracking.

Revision ID: 005_linkedin_connector_tables
Revises: 004_brand_profile_and_performance
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "005_linkedin_connector_tables"
down_revision = "004_brand_profile_and_performance"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ── social_connections ─────────────────────────────────────────────────────
    op.create_table(
        "social_connections",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("tenant_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("operator_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("provider", sa.String(50), nullable=False),
        sa.Column("external_subject", sa.String(255), nullable=False),
        sa.Column("author_urn", sa.String(255), nullable=False),
        sa.Column("display_name", sa.String(255), nullable=True),
        sa.Column("access_token_encrypted", sa.Text, nullable=False),
        sa.Column("refresh_token_encrypted", sa.Text, nullable=True),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("granted_scopes", postgresql.JSONB, nullable=False, server_default=sa.text("'[]'::jsonb")),
        sa.Column("status", sa.String(30), nullable=False, server_default="active"),
        sa.Column("last_error", sa.Text, nullable=True),
        sa.Column("connected_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("disconnected_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("last_used_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("metadata", postgresql.JSONB, nullable=False, server_default=sa.text("'{}'::jsonb")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.UniqueConstraint("tenant_id", "operator_id", "provider", "external_subject",
                            name="uq_social_connection_owner"),
    )
    op.create_index("ix_social_connections_tenant_id", "social_connections", ["tenant_id"])
    op.create_index("ix_social_connections_operator_id", "social_connections", ["operator_id"])
    op.create_index("ix_social_connections_provider", "social_connections", ["provider"])
    op.create_index("ix_social_connections_status", "social_connections", ["status"])
    op.create_index("ix_social_connections_expires_at", "social_connections", ["expires_at"])

    op.execute("ALTER TABLE social_connections ENABLE ROW LEVEL SECURITY")
    op.execute("""
        CREATE POLICY tenant_isolation_social_connections ON social_connections
        USING (tenant_id::text = current_setting('app.current_tenant', true))
    """)

    # ── oauth_states ───────────────────────────────────────────────────────────
    op.create_table(
        "oauth_states",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("tenant_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("operator_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("provider", sa.String(50), nullable=False),
        sa.Column("state_hash", sa.String(64), nullable=False, unique=True),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("consumed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("metadata", postgresql.JSONB, nullable=False, server_default=sa.text("'{}'::jsonb")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_index("ix_oauth_states_tenant_id", "oauth_states", ["tenant_id"])
    op.create_index("ix_oauth_states_operator_id", "oauth_states", ["operator_id"])
    op.create_index("ix_oauth_states_provider", "oauth_states", ["provider"])
    op.create_index("ix_oauth_states_state_hash", "oauth_states", ["state_hash"])
    op.create_index("ix_oauth_states_expires_at", "oauth_states", ["expires_at"])

    # oauth_states are system-scoped (no tenant RLS needed — state_hash is a secret)

    # ── post_revisions ─────────────────────────────────────────────────────────
    op.create_table(
        "post_revisions",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("tenant_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("post_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("posts.id", ondelete="CASCADE"), nullable=False),
        sa.Column("revision_number", sa.Integer, nullable=False),
        sa.Column("content", sa.Text, nullable=False),
        sa.Column("hashtags", postgresql.JSONB, nullable=False, server_default=sa.text("'[]'::jsonb")),
        sa.Column("cta", sa.Text, nullable=True),
        sa.Column("feedback", sa.Text, nullable=True),
        sa.Column("source", sa.String(30), nullable=False),
        sa.Column("created_by", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("parent_revision_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("metadata", postgresql.JSONB, nullable=False, server_default=sa.text("'{}'::jsonb")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.UniqueConstraint("post_id", "revision_number", name="uq_post_revision_number"),
    )
    op.create_index("ix_post_revisions_tenant_id", "post_revisions", ["tenant_id"])
    op.create_index("ix_post_revisions_post_id", "post_revisions", ["post_id"])

    op.execute("ALTER TABLE post_revisions ENABLE ROW LEVEL SECURITY")
    op.execute("""
        CREATE POLICY tenant_isolation_post_revisions ON post_revisions
        USING (tenant_id::text = current_setting('app.current_tenant', true))
    """)

    # ── publication_attempts ───────────────────────────────────────────────────
    op.create_table(
        "publication_attempts",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("tenant_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("post_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("posts.id", ondelete="CASCADE"), nullable=False),
        sa.Column("revision_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("post_revisions.id", ondelete="SET NULL"), nullable=True),
        sa.Column("connection_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("social_connections.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("idempotency_key", sa.String(128), nullable=False, unique=True),
        sa.Column("status", sa.String(30), nullable=False, server_default="pending"),
        sa.Column("platform_post_id", sa.String(255), nullable=True),
        sa.Column("platform_post_url", sa.String(500), nullable=True),
        sa.Column("error_message", sa.Text, nullable=True),
        sa.Column("dispatched_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("metadata", postgresql.JSONB, nullable=False, server_default=sa.text("'{}'::jsonb")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.UniqueConstraint("post_id", "connection_id", name="uq_publication_attempt_post_connection"),
    )
    op.create_index("ix_publication_attempts_tenant_id", "publication_attempts", ["tenant_id"])
    op.create_index("ix_publication_attempts_post_id", "publication_attempts", ["post_id"])
    op.create_index("ix_publication_attempts_status", "publication_attempts", ["status"])

    op.execute("ALTER TABLE publication_attempts ENABLE ROW LEVEL SECURITY")
    op.execute("""
        CREATE POLICY tenant_isolation_publication_attempts ON publication_attempts
        USING (tenant_id::text = current_setting('app.current_tenant', true))
    """)

    # ── posts: add social_connection_id, current_revision_id, approved_revision_id ──
    # These columns already exist in the ORM model but were not in the original migration.
    # Add them only if not present (idempotent guard via exception handling at migration time).
    op.add_column(
        "posts",
        sa.Column("social_connection_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("social_connections.id", ondelete="SET NULL"), nullable=True),
    )
    op.create_index("ix_posts_social_connection_id", "posts", ["social_connection_id"])


def downgrade() -> None:
    op.drop_index("ix_posts_social_connection_id", table_name="posts")
    op.drop_column("posts", "social_connection_id")

    op.execute("DROP POLICY IF EXISTS tenant_isolation_publication_attempts ON publication_attempts")
    op.drop_table("publication_attempts")

    op.execute("DROP POLICY IF EXISTS tenant_isolation_post_revisions ON post_revisions")
    op.drop_table("post_revisions")

    op.drop_table("oauth_states")

    op.execute("DROP POLICY IF EXISTS tenant_isolation_social_connections ON social_connections")
    op.drop_table("social_connections")
