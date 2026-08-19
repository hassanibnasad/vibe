from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_db_session
from app.repositories.conversation_repo import ConversationRepository
from app.repositories.knowledge_repo import KnowledgeRepository
from app.repositories.lead_repo import LeadRepository
from app.repositories.message_repo import MessageRepository
from app.repositories.post_repo import PostRepository
from app.repositories.score_event_repo import ScoreEventRepository


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
