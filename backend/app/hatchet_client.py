"""
Hatchet workflow engine client — lazily-initialized module singleton.

The client is only fully initialized when a token is available. During
testing or when ``HATCHET_CLIENT_TOKEN`` is not set, a deferred wrapper
returns a stub-like object that raises a clear error if any task is actually
dispatched, rather than crashing at import time.

All tokens and host values are read from app.config.Settings to satisfy the
"Zero Hardcoding" architectural invariant defined in CONTEXT.md.
"""

from __future__ import annotations

import logging
from functools import lru_cache
from typing import Any

from hatchet_sdk import ClientConfig, Hatchet

logger = logging.getLogger(__name__)


@lru_cache(maxsize=1)
def get_hatchet() -> Hatchet:
    """Return a cached Hatchet client, initialised lazily from Settings.

    Raises ``RuntimeError`` if ``HATCHET_CLIENT_TOKEN`` is not configured.
    The error surfaces at call time (when a task is dispatched or a worker
    is started), **not** at import time, so tests that never touch Hatchet
    are unaffected.
    """
    # Deferred import to avoid circular imports and to keep module-level
    # code (executed at import time) free of side-effects.
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


class _LazyHatchet:
    """Transparent proxy that defers Hatchet initialisation until first use.

    This allows workflow modules to do ``from app.hatchet_client import hatchet``
    at module level without triggering a connection attempt at import time.
    Any attribute access (e.g. ``hatchet.task``, ``hatchet.worker``) triggers
    the actual initialisation on first use.
    """

    _instance: Hatchet | None = None

    def _get(self) -> Hatchet:
        if self._instance is None:
            self._instance = get_hatchet()
        return self._instance

    def __getattr__(self, name: str) -> Any:
        return getattr(self._get(), name)

    def __repr__(self) -> str:  # pragma: no cover
        return f"<LazyHatchet instance={self._instance!r}>"


# Module-level singleton. Attribute access is deferred until first use,
# so importing this module does NOT open a connection to Hatchet.
hatchet: Hatchet = _LazyHatchet()  # type: ignore[assignment]
