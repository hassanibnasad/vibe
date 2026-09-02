from fastapi import APIRouter

from app.api.v1 import (
    analytics,
    campaigns,
    conversations,
    health,
    knowledge,
    leads,
    posts,
    webhooks,
)

api_v1_router = APIRouter()

api_v1_router.include_router(health.router)
api_v1_router.include_router(posts.router)
api_v1_router.include_router(leads.router)
api_v1_router.include_router(conversations.router)
api_v1_router.include_router(campaigns.router)
api_v1_router.include_router(webhooks.router)
api_v1_router.include_router(analytics.router)
api_v1_router.include_router(knowledge.router)

