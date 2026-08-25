"""001 Initial schema with multi-tenant RLS, HNSW vector index, and lead_field_history

Revision ID: 001_initial_schema_with_rls
Revises: 
Create Date: 2026-08-22 23:55:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '001_initial_schema_with_rls'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 1. Enable pgvector extension
    op.execute("CREATE EXTENSION IF NOT EXISTS vector;")

    # 2. Platforms & Campaigns
    op.create_table(
        'platforms',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('name', sa.String(50), nullable=False, unique=True),
        sa.Column('display_name', sa.String(100), nullable=False),
        sa.Column('icon_url', sa.String(500)),
        sa.Column('is_active', sa.Boolean(), default=True),
        sa.Column('rate_limit_per_minute', sa.Integer(), default=60),
        sa.Column('supported_content_types', postgresql.JSONB(), default=list),
        sa.Column('char_limit', sa.Integer()),
        sa.Column('api_version', sa.String(20)),
        sa.Column('config', postgresql.JSONB(), default=dict),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    )

    op.create_table(
        'campaigns',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('description', sa.Text()),
        sa.Column('status', sa.String(20), default='draft', nullable=False),
        sa.Column('target_audience', postgresql.JSONB(), default=dict),
        sa.Column('goals', postgresql.JSONB(), default=dict),
        sa.Column('start_date', sa.DateTime(timezone=True)),
        sa.Column('end_date', sa.DateTime(timezone=True)),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    )

    # 3. Leads Table (with tenant_id & BANT JSONB)
    op.create_table(
        'leads',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('tenant_id', postgresql.UUID(as_uuid=True), nullable=False, index=True),
        sa.Column('thread_id', sa.String(255), index=True),
        sa.Column('name', sa.String(255)),
        sa.Column('email', sa.String(255)),
        sa.Column('phone', sa.String(50)),
        sa.Column('avatar_url', sa.String(500)),
        sa.Column('platform', sa.String(50), nullable=False, index=True),
        sa.Column('platform_user_id', sa.String(255), nullable=False),
        sa.Column('platform_username', sa.String(255)),
        sa.Column('platform_profile_url', sa.String(500)),
        sa.Column('company', sa.String(255)),
        sa.Column('job_title', sa.String(255)),
        sa.Column('industry', sa.String(255)),
        sa.Column('company_size', sa.String(50)),
        sa.Column('budget', postgresql.JSONB(), default=dict),
        sa.Column('authority', postgresql.JSONB(), default=dict),
        sa.Column('need', postgresql.JSONB(), default=dict),
        sa.Column('timeline', postgresql.JSONB(), default=dict),
        sa.Column('is_qualified', sa.Boolean(), default=False, index=True),
        sa.Column('lead_score', sa.Integer(), default=0, index=True),
        sa.Column('lead_stage', sa.String(20), default='cold', nullable=False, index=True),
        sa.Column('tags', postgresql.JSONB(), default=list),
        sa.Column('pain_points', postgresql.JSONB(), default=list),
        sa.Column('interests', postgresql.JSONB(), default=list),
        sa.Column('metadata', postgresql.JSONB(), default=dict),
        sa.Column('source_type', sa.String(50)),
        sa.Column('first_interaction_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('last_interaction_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('qualified_at', sa.DateTime(timezone=True)),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    )

    # 4. Lead Field History Table (Append-only)
    op.create_table(
        'lead_field_history',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('tenant_id', postgresql.UUID(as_uuid=True), nullable=False, index=True),
        sa.Column('lead_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('leads.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('field', sa.String(50), nullable=False),
        sa.Column('old_value', postgresql.JSONB()),
        sa.Column('new_value', postgresql.JSONB()),
        sa.Column('changed_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    )

    # 5. Conversations & Messages
    op.create_table(
        'conversations',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('tenant_id', postgresql.UUID(as_uuid=True), nullable=False, index=True),
        sa.Column('lead_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('leads.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('platform_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('platforms.id', ondelete='SET NULL'), nullable=True),
        sa.Column('platform_thread_id', sa.String(255)),
        sa.Column('status', sa.String(20), default='active', nullable=False, index=True),
        sa.Column('context', postgresql.JSONB(), default=dict),
        sa.Column('topic', sa.String(255)),
        sa.Column('total_messages', sa.Integer(), default=0),
        sa.Column('last_message_at', sa.DateTime(timezone=True), index=True),
        sa.Column('assigned_to', postgresql.UUID(as_uuid=True)),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    )

    op.create_table(
        'messages',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('tenant_id', postgresql.UUID(as_uuid=True), nullable=False, index=True),
        sa.Column('conversation_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('conversations.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('direction', sa.String(10), nullable=False, index=True),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('content_type', sa.String(20), default='text'),
        sa.Column('media_urls', postgresql.JSONB(), default=list),
        sa.Column('platform', sa.String(50), nullable=False),
        sa.Column('platform_message_id', sa.String(255)),
        sa.Column('sentiment', sa.String(20)),
        sa.Column('sentiment_score', sa.Float()),
        sa.Column('intent_signals', postgresql.JSONB(), default=list),
        sa.Column('confidence_score', sa.Float()),
        sa.Column('requires_review', sa.Boolean(), default=False, index=True),
        sa.Column('review_status', sa.String(20)),
        sa.Column('reviewed_by', postgresql.UUID(as_uuid=True)),
        sa.Column('reviewed_at', sa.DateTime(timezone=True)),
        sa.Column('original_content', sa.Text()),
        sa.Column('llm_model', sa.String(100)),
        sa.Column('generation_time_ms', sa.Integer()),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    )

    # 6. Knowledge Docs (with HNSW vector index)
    op.execute("""
    CREATE TABLE IF NOT EXISTS knowledge_docs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL,
        title VARCHAR(500) NOT NULL,
        content TEXT NOT NULL,
        doc_type VARCHAR(50) NOT NULL,
        embedding vector(384),
        source_file VARCHAR(500),
        metadata JSONB DEFAULT '{}'::jsonb,
        chunk_index INTEGER DEFAULT 0,
        parent_doc_id UUID,
        created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
    );
    """)

    op.execute("CREATE INDEX IF NOT EXISTS ix_knowledge_docs_hnsw ON knowledge_docs USING hnsw (embedding vector_cosine_ops);")

    # 7. Enable and Force Row-Level Security (RLS)
    rls_tables = ['leads', 'lead_field_history', 'conversations', 'messages', 'knowledge_docs']
    for table in rls_tables:
        op.execute(f"ALTER TABLE {table} ENABLE ROW LEVEL SECURITY;")
        op.execute(f"ALTER TABLE {table} FORCE ROW LEVEL SECURITY;")
        op.execute(f"""
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM pg_policies WHERE tablename = '{table}' AND policyname = 'tenant_isolation_{table}'
            ) THEN
                CREATE POLICY tenant_isolation_{table} ON {table}
                    USING (tenant_id = NULLIF(current_setting('app.current_tenant', true), '')::uuid);
            END IF;
        END
        $$;
        """)


def downgrade() -> None:
    rls_tables = ['knowledge_docs', 'messages', 'conversations', 'lead_field_history', 'leads']
    for table in rls_tables:
        op.execute(f"DROP POLICY IF EXISTS tenant_isolation_{table} ON {table};")
        op.execute(f"ALTER TABLE {table} DISABLE ROW LEVEL SECURITY;")

    op.drop_table('messages')
    op.drop_table('conversations')
    op.drop_table('lead_field_history')
    op.drop_table('leads')
    op.drop_table('campaigns')
    op.drop_table('platforms')
    op.execute("DROP TABLE IF EXISTS knowledge_docs;")
