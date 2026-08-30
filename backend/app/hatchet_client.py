"""
Hatchet workflow engine client — lazily-initialized module singleton.

The client defers connection attempts until call time. During testing,
headless OpenAPI export, or when ``HATCHET_CLIENT_TOKEN`` is not set,
task wrappers allow clean direct execution and module imports without crashing.

All tokens and host values are read from app.config.Settings to satisfy the
"Zero Hardcoding" architectural invariant defined in CONTEXT.md.
"""

from __future__ import annotations

import asyncio
import inspect
import logging
from collections.abc import Callable
from functools import lru_cache
from typing import Any

from hatchet_sdk import ClientConfig, Hatchet

logger = logging.getLogger(__name__)


def is_hatchet_configured() -> bool:
    """Return True if a Hatchet client token is available in settings."""
    try:
        from app.config import settings  # noqa: PLC0415
        return bool(settings.HATCHET_CLIENT_TOKEN)
    except Exception:
        return False


@lru_cache(maxsize=1)
def get_hatchet() -> Hatchet:
    """Return a cached Hatchet client, initialised lazily from Settings.

    Raises ``RuntimeError`` if ``HATCHET_CLIENT_TOKEN`` is not configured.
    """
    from app.config import settings  # noqa: PLC0415

    token = settings.HATCHET_CLIENT_TOKEN
    if not token:
        raise RuntimeError(
            "HATCHET_CLIENT_TOKEN is not configured. "
            "Set it in your .env file or environment to use Hatchet."
        )

    config_kwargs: dict[str, Any] = {"token": token}
    host = settings.HATCHET_HOST
    if host:
        config_kwargs["host_port"] = host

    return Hatchet(config=ClientConfig(**config_kwargs))


class _TaskWrapper:
    """Wrapper that preserves the task interface and supports both Hatchet dispatch and direct execution."""

    def __init__(self, fn: Callable, task_kwargs: dict[str, Any]):
        self.fn = fn
        self.task_kwargs = task_kwargs
        self._real_task: Any = None

    def _get_real_task(self) -> Any:
        if self._real_task is None and is_hatchet_configured():
            try:
                client = get_hatchet()
                self._real_task = client.task(**self.task_kwargs)(self.fn)
            except Exception as e:
                logger.warning("hatchet_task_binding_failed", error=str(e))
        return self._real_task

    async def aio_run(self, input_data: Any, *args: Any, **kwargs: Any) -> Any:
        real_task = self._get_real_task()
        if real_task is not None and hasattr(real_task, "aio_run"):
            try:
                return await real_task.aio_run(input_data, *args, **kwargs)
            except Exception as e:
                logger.warning("hatchet_dispatch_fallback", error=str(e))
        # Fallback to direct async invocation
        if inspect.iscoroutinefunction(self.fn):
            return await self.fn(input_data, None)
        return self.fn(input_data, None)

    async def aio_run_no_wait(self, input_data: Any, *args: Any, **kwargs: Any) -> Any:
        real_task = self._get_real_task()
        if real_task is not None and hasattr(real_task, "aio_run_no_wait"):
            try:
                return await real_task.aio_run_no_wait(input_data, *args, **kwargs)
            except Exception as e:
                logger.warning("hatchet_no_wait_dispatch_fallback", error=str(e))
        try:
            loop = asyncio.get_running_loop()
            return loop.create_task(self.aio_run(input_data, *args, **kwargs))
        except RuntimeError:
            return asyncio.run(self.aio_run(input_data, *args, **kwargs))

    def __call__(self, *args: Any, **kwargs: Any) -> Any:
        return self.fn(*args, **kwargs)


class _WorkflowWrapper:
    """Wrapper that defers Hatchet workflow registration."""

    def __init__(self, workflow_kwargs: dict[str, Any]):
        self.workflow_kwargs = workflow_kwargs

    def task(self, **task_kwargs: Any) -> Callable:
        def decorator(fn: Callable) -> _TaskWrapper:
            return _TaskWrapper(fn, {**self.workflow_kwargs, **task_kwargs})
        return decorator


class _LazyHatchet:
    """Transparent proxy that defers Hatchet initialisation until execution."""

    def task(self, **kwargs: Any) -> Callable:
        def decorator(fn: Callable) -> _TaskWrapper:
            return _TaskWrapper(fn, kwargs)
        return decorator

    def workflow(self, **kwargs: Any) -> _WorkflowWrapper:
        return _WorkflowWrapper(kwargs)

    def worker(self, *args: Any, **kwargs: Any) -> Any:
        return get_hatchet().worker(*args, **kwargs)

    def __getattr__(self, name: str) -> Any:
        return getattr(get_hatchet(), name)


hatchet: Hatchet = _LazyHatchet()  # type: ignore[assignment]
