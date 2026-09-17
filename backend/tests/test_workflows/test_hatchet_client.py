import pytest
from pydantic import BaseModel

from app.hatchet_client import check_health, hatchet, is_hatchet_configured


class SampleInput(BaseModel):
    name: str
    multiplier: int = 2


@pytest.mark.asyncio
async def test_hatchet_unconfigured_fallback():
    """Verify that unconfigured Hatchet token leads to direct execution fallback."""
    # When token is unset (default test environment)
    assert not is_hatchet_configured()

    health = check_health()
    assert health["status"] == "fallback"
    assert health["mode"] == "direct_execution"
    assert health["configured"] is False


@pytest.mark.asyncio
async def test_task_wrapper_direct_async_execution():
    """Verify that @hatchet.task decorator falls back to direct async function call."""

    @hatchet.task(name="test-sample-task")
    async def sample_task(input_data: SampleInput, ctx=None):
        return {"result": input_data.name * input_data.multiplier}

    output = await sample_task.aio_run(SampleInput(name="Vibe", multiplier=3))
    assert output == {"result": "VibeVibeVibe"}


@pytest.mark.asyncio
async def test_task_wrapper_aio_run_no_wait():
    """Verify that aio_run_no_wait dispatches in the background without blocking."""

    side_effect = []

    @hatchet.task(name="test-no-wait-task")
    async def background_task(input_data: SampleInput, ctx=None):
        side_effect.append(input_data.name)
        return {"done": True}

    task_obj = await background_task.aio_run_no_wait(SampleInput(name="async_item"))
    # Wait for the background task to complete
    await task_obj
    assert "async_item" in side_effect


@pytest.mark.asyncio
async def test_event_proxy_fallback():
    """Verify that pushing events works without crashing in fallback mode."""
    # Synchronous push
    hatchet.event.push("user:action", {"user_id": "123", "action": "click"})
    # Asynchronous push
    await hatchet.event.aio_push("user:action", {"user_id": "123", "action": "click"})
