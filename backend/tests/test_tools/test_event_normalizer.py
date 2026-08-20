import pytest
from app.tools.utils.event_normalizer import EventNormalizer


def test_normalize_linkedin_comment():
    payload = {
        "id": "li_comment_123",
        "object": "urn:li:share:987654",
        "actor": {
            "id": "urn:li:person:vp_tech_456",
            "name": "Sarah Connor",
            "headline": "VP of Engineering at TechCorp",
        },
        "message": {"text": "How does VibeAgent handle multi-tenant isolation?"},
    }

    event = EventNormalizer.normalize("linkedin", payload)

    assert event.platform == "linkedin"
    assert event.event_type == "comment"
    assert event.event_id == "li_comment_123"
    assert event.thread_id == "urn:li:share:987654"
    assert event.author_id == "urn:li:person:vp_tech_456"
    assert event.author_name == "Sarah Connor"
    assert event.author_headline == "VP of Engineering at TechCorp"
    assert "multi-tenant" in event.content


def test_normalize_generic_fallback():
    payload = {
        "event_id": "gen_evt_1",
        "post_id": "thread_abc",
        "user_id": "user_xyz",
        "author_name": "Alex Smith",
        "content": "Excited about this launch!",
        "type": "direct_message",
    }

    event = EventNormalizer.normalize("twitter", payload)
    assert event.platform == "twitter"
    assert event.event_type == "direct_message"
    assert event.thread_id == "thread_abc"
    assert event.author_name == "Alex Smith"
