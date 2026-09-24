"""End-to-End Integration Test for VibeAgent Phase 1 MVP Pipeline.

Validates the full lifecycle matching Definition of Done (DoD) from MVP_SPEC.md:
1. Business Onboarding & Brand Profile extraction/upsert.
2. Operator LinkedIn Connection setup.
3. Content Generation (Draft creation with hashtags, CTA, review gate).
4. HITL Post Draft Review & Revision lifecycle (edit -> revision logged -> approve).
5. Publication via LinkedIn Connector (idempotent attempt recorded, external URN assigned).
6. Inbound Prospect Interaction & Conversation ingestion.
7. AI Contextual Reply generation & low-confidence Review Queue triage.
8. Operator authorization of AI reply.
9. BANT Lead qualification & Funnel Stage progression (Cold -> Warm -> MQL).
10. System Dashboard & Analytics telemetry verification.
"""

import uuid
from unittest.mock import AsyncMock, patch

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.agents.base import AgentResult
from app.agents.lead_qualifier import LeadQualifierAgent
from app.dependencies import DEFAULT_TENANT_ID
from app.models.enums import PostStatus
from app.models.social_connection import SocialConnection
from app.repositories.brand_profile_repo import BrandProfileRepository
from app.repositories.conversation_repo import ConversationRepository
from app.repositories.lead_repo import LeadRepository
from app.repositories.message_repo import MessageRepository
from app.repositories.post_repo import PostRepository
from app.repositories.post_revision_repo import PostRevisionRepository
from app.repositories.publication_attempt_repo import PublicationAttemptRepository
from app.repositories.score_event_repo import ScoreEventRepository
from app.services.draft_review_service import DraftReviewService
from app.services.linkedin_connection_service import LinkedInConnectionService
from app.services.publication_service import PublicationService
from app.services.scoring_service import ScoringService


@pytest.mark.asyncio
async def test_e2e_full_business_lifecycle(client: AsyncClient, db_session: AsyncSession):
    tenant_id = DEFAULT_TENANT_ID
    operator_id = DEFAULT_TENANT_ID
    connection_id = uuid.uuid4()

    # -------------------------------------------------------------------------
    # Step 1: Business Onboarding & Brand Profile
    # -------------------------------------------------------------------------
    brand_repo = BrandProfileRepository(db_session)
    brand = await brand_repo.upsert(
        tenant_id=tenant_id,
        brand_name="Nexus AI Solutions",
        tagline="Autonomous B2B Marketing Intelligence",
        visual_identity={"palette": {"primary": "#0A66C2", "accent": "#00F2FE"}},
        written_identity={"archetype": "Visionary Authority", "tone": "sharp, consultative"},
        core_value_props=["Zero-touch social lead generation", "Human-in-the-loop compliance"],
        conversion_assets={"lead_magnets": ["2026 Social Selling Playbook"]},
        icp_pain_points=[{"feature": "Automated Replies", "pain_hook": "Missed inbound pipeline"}],
        extraction_status="complete",
    )
    await db_session.commit()
    assert brand.brand_name == "Nexus AI Solutions"

    # Verify Onboarding API endpoint
    onboarding_res = await client.get("/api/v1/onboarding/brand-profile")
    assert onboarding_res.status_code == 200
    assert onboarding_res.json()["brand_name"] == "Nexus AI Solutions"

    # -------------------------------------------------------------------------
    # Step 2: Operator LinkedIn Social Connection
    # -------------------------------------------------------------------------
    mock_connection = SocialConnection(
        id=connection_id,
        tenant_id=tenant_id,
        operator_id=operator_id,
        provider="linkedin",
        external_subject="linkedin-operator-456",
        author_urn="urn:li:person:linkedin-operator-456",
        display_name="Alex River (Founder)",
        access_token_encrypted="encrypted-test-token",
        status="active",
    )
    db_session.add(mock_connection)
    await db_session.commit()

    conn_res = await client.get("/api/v1/connectors")
    assert conn_res.status_code == 200
    connectors = conn_res.json()
    assert any(c["provider"] == "linkedin" and c["status"] == "active" for c in connectors)

    # -------------------------------------------------------------------------
    # Step 3: Content Generation — Create Draft with Review Gate
    post_repo = PostRepository(db_session)
    revision_repo = PostRevisionRepository(db_session)
    draft_review_service = DraftReviewService(post_repo=post_repo, revision_repo=revision_repo)

    post = await post_repo.create(
        tenant_id=tenant_id,
        content="Why modern B2B marketing teams are replacing manual SDR outreach with autonomous social agents.",
        hashtags=["#B2BMarketing", "#AI", "#Growth"],
        cta="Read our latest framework in the comments below.",
        status=PostStatus.DRAFT.value,
        ai_generated=True,
        requires_review=True,
        confidence_score=0.74,
    )
    await db_session.commit()
    post_id = post.id

    get_post_res = await client.get(f"/api/v1/posts/{post_id}")
    assert get_post_res.status_code == 200
    post_data = get_post_res.json()
    assert post_data["status"] == "draft"
    assert post_data["requires_review"] is True

    # -------------------------------------------------------------------------
    # Step 4: HITL Post Draft Review & Revision Lifecycle
    # -------------------------------------------------------------------------

    # Operator performs inline edit & logs revision
    edited = await draft_review_service.edit(
        post_id=post_id,
        tenant_id=tenant_id,
        operator_id=operator_id,
        content="Why modern B2B marketing teams are replacing manual outreach with autonomous AI agents. (Updated)",
        hashtags=["#B2BMarketing", "#AI", "#Autonomous"],
        cta="Drop a comment to see the benchmark.",
        feedback="Sharpened hook and updated call-to-action.",
    )
    assert edited.content.endswith("(Updated)")
    assert edited.current_revision_id is not None

    # Verify revision history recorded
    revisions = await draft_review_service.list_revisions(post_id, tenant_id)
    assert len(revisions) == 1
    assert revisions[0].revision_number == 1
    assert revisions[0].feedback == "Sharpened hook and updated call-to-action."

    # Operator approves post draft
    approved = await draft_review_service.approve(
        post_id=post_id,
        tenant_id=tenant_id,
        operator_id=operator_id,
    )
    assert approved.status == PostStatus.APPROVED.value
    assert approved.requires_review is False

    # -------------------------------------------------------------------------
    # Step 5: Idempotent LinkedIn Publication
    # -------------------------------------------------------------------------
    attempt_repo = PublicationAttemptRepository(db_session)
    mock_conn_service = AsyncMock(spec=LinkedInConnectionService)
    mock_conn_service.get_publishable_connection.return_value = mock_connection
    mock_conn_service.decrypt_access_token.return_value = "decrypted-test-token"

    pub_service = PublicationService(
        post_repo=post_repo,
        attempts=attempt_repo,
        connections=mock_conn_service,
    )

    with patch("app.services.publication_service.LinkedInTool.publish_post", new_callable=AsyncMock) as mock_pub:
        mock_pub.return_value = AgentResult(
            agent_name="LinkedInTool",
            success=True,
            confidence_score=1.0,
            requires_review=False,
            data={
                "platform_post_id": "urn:li:share:987654321",
                "platform_post_url": "https://www.linkedin.com/feed/update/urn:li:share:987654321/",
            },
        )

        published_post = await pub_service.publish(
            post_id=post_id,
            connection_id=connection_id,
            tenant_id=tenant_id,
            operator_id=operator_id,
        )

    assert published_post.status == PostStatus.PUBLISHED.value
    assert published_post.platform_post_id == "urn:li:share:987654321"

    # Verify publication idempotency ledger
    attempt = await attempt_repo.get_for_post_and_connection(post_id, connection_id)
    assert attempt is not None
    assert attempt.status == "succeeded"
    assert attempt.platform_post_id == "urn:li:share:987654321"

    # -------------------------------------------------------------------------
    # Step 6: Inbound Prospect Interaction & Conversation Ingestion
    # -------------------------------------------------------------------------
    lead_repo = LeadRepository(db_session)
    conv_repo = ConversationRepository(db_session)
    msg_repo = MessageRepository(db_session)

    prospect = await lead_repo.create(
        platform="linkedin",
        platform_user_id="prospect_sarah_101",
        name="Sarah Connor",
        company="Cyberdyne Systems",
        job_title="VP of Marketing Operations",
        lead_score=15,
        lead_stage="cold",
    )
    conversation = await conv_repo.create(
        lead_id=prospect.id,
        platform_thread_id="thread_inbound_post_987654321",
    )
    # Prospect leaves an inquisitive comment
    await msg_repo.create(
        conversation_id=conversation.id,
        direction="inbound",
        content="Does this support multi-tenant authorization and custom CRM webhooks?",
        platform="linkedin",
    )

    # -------------------------------------------------------------------------
    # Step 7: Contextual AI Reply Queued for Operator Authorization (HITL)
    # -------------------------------------------------------------------------
    proposed_reply = await msg_repo.create(
        conversation_id=conversation.id,
        direction="outbound",
        content="Hi Sarah! Yes, we support complete tenant isolation via PostgreSQL RLS and custom webhook endpoints.",
        platform="linkedin",
        requires_review=True,
        review_status="pending",
        confidence_score=0.72,  # Below high confidence threshold -> enters review queue
    )
    await db_session.commit()

    # Verify reply is visible in the Review Queue API
    rq_res = await client.get("/api/v1/conversations/review-queue")
    assert rq_res.status_code == 200
    queue = rq_res.json()
    assert any(item["message_id"] == str(proposed_reply.id) for item in queue)

    # -------------------------------------------------------------------------
    # Step 8: Operator Approves Reply
    # -------------------------------------------------------------------------
    approve_reply_res = await client.post(f"/api/v1/conversations/review-queue/{proposed_reply.id}/approve")
    assert approve_reply_res.status_code == 200
    assert approve_reply_res.json()["status"] == "approved"

    # -------------------------------------------------------------------------
    # Step 9: BANT Lead Qualification & Funnel Progression
    # -------------------------------------------------------------------------
    score_event_repo = ScoreEventRepository(db_session)
    mock_qualifier = AsyncMock(spec=LeadQualifierAgent)
    mock_qualifier.qualify_lead.return_value = AgentResult(
        success=True,
        confidence_score=0.92,
        requires_review=False,
        data={
            "old_score": 15,
            "new_score": 78,
            "score_delta": 63,
            "new_stage": "mql",
            "pain_points": ["tenant isolation", "webhook routing"],
            "interests": ["automated CRM sync"],
            "reason": "Confirmed authority (VP) and defined technical need with active dialogue.",
        },
    )

    scoring_service = ScoringService(
        lead_repo=lead_repo,
        score_event_repo=score_event_repo,
        conversation_repo=conv_repo,
        message_repo=msg_repo,
        qualifier_agent=mock_qualifier,
    )

    updated_lead = await scoring_service.evaluate_and_update_lead(
        lead_id=prospect.id,
    )
    assert updated_lead.lead_score == 78
    assert updated_lead.lead_stage == "mql"

    # Verify pipeline summary reflects progression
    pipeline_res = await client.get("/api/v1/leads/pipeline")
    assert pipeline_res.status_code == 200
    pipeline_data = pipeline_res.json()
    assert pipeline_data["mql"] >= 1

    # -------------------------------------------------------------------------
    # Step 10: Telemetry & Dashboard Command Center Verification
    # -------------------------------------------------------------------------
    dashboard_res = await client.get("/api/v1/analytics/dashboard")
    assert dashboard_res.status_code == 200
    dashboard = dashboard_res.json()

    assert dashboard["total_posts_published"] >= 1
    assert dashboard["total_leads"] >= 1
    assert dashboard["mql_sql_leads"] >= 1
    assert dashboard["leads_by_stage"]["mql"] >= 1
    assert len(dashboard["recent_posts"]) >= 1
    assert dashboard["recent_posts"][0]["id"] == str(post_id)
