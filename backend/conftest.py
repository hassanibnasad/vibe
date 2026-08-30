"""
Root-level conftest.py — runs before any test imports.

Patches the Hatchet client with a lightweight stub so that importing
``app.workflows.*`` during tests does not require a live Hatchet engine or a
valid ``HATCHET_CLIENT_TOKEN``.

The stub:
  - Makes ``@hatchet.task(...)`` and ``@hatchet.workflow(...)`` work as no-op
    decorators that return a MagicMock, preventing ValidationError from
    ``ClientConfig`` during import.
  - Any test that actually wants to assert Hatchet dispatch behaviour should
    override the specific task object's ``aio_run`` / ``aio_run_no_wait``
    methods via ``unittest.mock.patch``.
"""

import sys
from unittest.mock import AsyncMock, MagicMock

# Build a minimal stub that satisfies the decorator protocol expected by the
# workflow modules:
#   @hatchet.task(name="foo", ...)       → returns a decorator
#   @hatchet.workflow(name="foo", ...)   → returns an object with .task()
#   hatchet.worker(...)                  → returns a MagicMock worker

_stub_task_obj = MagicMock()
_stub_task_obj.aio_run = AsyncMock(return_value={})
_stub_task_obj.aio_run_no_wait = AsyncMock(return_value=MagicMock())
_stub_task_obj.run = MagicMock(return_value={})
_stub_task_obj.run_no_wait = MagicMock(return_value=MagicMock())


def _make_task_decorator(*args, **kwargs):
    """Return a decorator that wraps the function in a stub task object."""
    def decorator(fn):
        stub = MagicMock(wraps=_stub_task_obj)
        stub.aio_run = AsyncMock(return_value={})
        stub.aio_run_no_wait = AsyncMock(return_value=MagicMock())
        # Preserve the original function as an attribute for unit-testing the
        # raw function directly.
        stub.fn = fn
        return stub
    return decorator


def _make_workflow_decorator(*args, **kwargs):
    """Return a stub workflow object with a .task() method."""
    workflow_stub = MagicMock()
    workflow_stub.task = _make_task_decorator
    workflow_stub.aio_run = AsyncMock(return_value={})
    workflow_stub.aio_run_no_wait = AsyncMock(return_value=MagicMock())
    return workflow_stub


_hatchet_stub = MagicMock()
_hatchet_stub.task = _make_task_decorator
_hatchet_stub.workflow = _make_workflow_decorator
_hatchet_stub.worker = MagicMock(return_value=MagicMock())


# Inject the stub into sys.modules BEFORE any app.* imports happen.
# This is safe because this conftest.py is evaluated by pytest before
# any test-level conftest.py files are imported.
_hatchet_client_stub = MagicMock()
_hatchet_client_stub.hatchet = _hatchet_stub
_hatchet_client_stub.get_hatchet = MagicMock(return_value=_hatchet_stub)
sys.modules["app.hatchet_client"] = _hatchet_client_stub
