---
name: tdd
description: Test-driven development. Use when the user wants to build features or fix bugs test-first, mentions "red-green-refactor", or wants integration tests.
---

# Test-Driven Development (TDD)

TDD is the red → green → refactor loop. Every section applies on every cycle: consult them before and during the loop, not after.

When exploring the codebase, read `CONTEXT.md` (if it exists) so test names and interface vocabulary match the project's domain language, and respect ADRs in the area you're touching.

## What a Good Test Is
- Tests verify behavior through **public interfaces (seams)**, not implementation details.
- Code can change entirely; tests shouldn't.
- A good test reads like a specification: `"user can checkout with valid cart"` tells you exactly what capability exists.

## Seams: Where Tests Go
- A **seam** is the public boundary you test at: the interface where you observe behavior without reaching inside (e.g., API endpoints, public service methods).
- Test only at pre-agreed seams.

## The Loop Rules
1. **Red**: Write a minimal failing test at a public seam. Run it and watch it fail for the expected reason.
2. **Green**: Write the simplest production-grade code that makes the test pass.
3. **Refactor**: Clean up duplication and ensure zero lint errors with tests remaining green throughout.
