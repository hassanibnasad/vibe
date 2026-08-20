# 4. Use Astral uv for Dependency & Environment Management

Date: 2026-08-20  
Status: Accepted

## Context
Python dependency resolution with legacy `pip` and `pip-tools` can be slow, non-deterministic, and prone to complex dependency conflict resolution failures across complex data science packages (PyTorch, Transformers, LangChain).

## Decision
We standardize on **`uv`** (by Astral) for all Python virtual environments, dependency resolution, script execution, and lockfile management.

## Rationale
1. **Speed**: 10-100x faster package resolution and installation using global caching and Rust-native multi-threaded downloads.
2. **Determinism**: Strict lockfile support (`uv.lock`) and reproducible resolution across Linux and Windows environments.
3. **Unified Tooling**: Replaces `pip`, `pip-tools`, `virtualenv`, and `pyenv` under a single CLI.

## Consequences
- All CLI commands must use `uv run`, `uv pip`, or `uv venv` instead of bare `pip` / `python`.
