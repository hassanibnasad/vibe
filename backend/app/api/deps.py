from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_db_session
from app.repositories.conversation_repo import ConversationRepository
from app.repositories.knowledge_repo import KnowledgeRepository
from app.repositories.lead_repo import LeadRepository
from app.repositories.message_repo import MessageRepository
from app.repositories.post_repo import PostRepository
from app.repositories.score_event_repo import ScoreEventRepository
from app.services.content_service import ContentService
from app.services.engagement_service import EngagementService
from app.services.knowledge import KnowledgeIngestionService
from app.services.lead_service import LeadService
from app.services.publishing_service import PublishingService
from app.services.scoring_service import ScoringService
from app.tools.ai.llm_client import LLMClient


# Repositories
async def get_lead_repo(session: AsyncSession = Depends(get_db_session)) -> LeadRepository:
    return LeadRepository(session)


async def get_post_repo(session: AsyncSession = Depends(get_db_session)) -> PostRepository:
    return PostRepository(session)


async def get_conversation_repo(session: AsyncSession = Depends(get_db_session)) -> ConversationRepository:
    return ConversationRepository(session)


async def get_message_repo(session: AsyncSession = Depends(get_db_session)) -> MessageRepository:
    return MessageRepository(session)


async def get_score_event_repo(session: AsyncSession = Depends(get_db_session)) -> ScoreEventRepository:
    return ScoreEventRepository(session)


async def get_knowledge_repo(session: AsyncSession = Depends(get_db_session)) -> KnowledgeRepository:
    return KnowledgeRepository(session)


# Domain Services
async def get_lead_service(
    lead_repo: LeadRepository = Depends(get_lead_repo),
    score_repo: ScoreEventRepository = Depends(get_score_event_repo),
) -> LeadService:
    return LeadService(lead_repo=lead_repo, score_event_repo=score_repo)


async def get_engagement_service(
    lead_repo: LeadRepository = Depends(get_lead_repo),
    conv_repo: ConversationRepository = Depends(get_conversation_repo),
    msg_repo: MessageRepository = Depends(get_message_repo),
) -> EngagementService:
    return EngagementService(lead_repo=lead_repo, conv_repo=conv_repo, msg_repo=msg_repo)


async def get_content_service(
    post_repo: PostRepository = Depends(get_post_repo),
) -> ContentService:
    return ContentService(post_repo=post_repo)


async def get_publishing_service(
    post_repo: PostRepository = Depends(get_post_repo),
) -> PublishingService:
    return PublishingService(post_repo=post_repo)


async def get_scoring_service(
    lead_repo: LeadRepository = Depends(get_lead_repo),
    score_repo: ScoreEventRepository = Depends(get_score_event_repo),
    conv_repo: ConversationRepository = Depends(get_conversation_repo),
    msg_repo: MessageRepository = Depends(get_message_repo),
) -> ScoringService:
    return ScoringService(
        lead_repo=lead_repo,
        score_event_repo=score_repo,
        conversation_repo=conv_repo,
        message_repo=msg_repo,
    )


async def get_knowledge_ingestion_service(
    knowledge_repo: KnowledgeRepository = Depends(get_knowledge_repo),
) -> KnowledgeIngestionService:
    """
    Construct a ``KnowledgeIngestionService`` with a live DB session and a
    fresh ``LLMClient`` (uses settings from ``app.config``).
    """
    llm_client = LLMClient()
    return KnowledgeIngestionService(knowledge_repo=knowledge_repo, llm_client=llm_client)




