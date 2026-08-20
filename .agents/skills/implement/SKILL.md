---
name: implement
description: Implement a piece of work based on a spec or set of tickets.
---

# Implement To Spec

Implement the work described by the user in the spec or tickets.

## Rules
1. **Read the Spec First**: Consult `docs/DEV_SPEC.md`, `docs/MVP_SPEC.md`, and `CONTEXT.md` before touching code.
2. **Use TDD at Seams**: Write tests against public interfaces first.
3. **Continuous Lint & Type Check**: Run `ruff check .` and `mypy` regularly to prevent syntax and typing debt.
4. **Zero Hardcoding**: Pass environment-dependent configurations through `app.config.Settings`.
