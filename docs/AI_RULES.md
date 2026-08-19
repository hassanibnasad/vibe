# 🤖 AI_RULES.md — VibeAgent

## Purpose

These are mandatory rules that ALL AI coding agents (Copilot, Cursor, Antigravity, Claude, etc.) MUST follow when writing code for the VibeAgent project. Violating these rules results in code that won't pass review.

---

## 🔴 CRITICAL RULES (Never Break These)

### R-00: Zero Hardcoding Policy
**NOTHING gets hardcoded.** Every configurable value MUST come from environment variables via `config.py`.

```python
# ❌ WRONG — Hardcoded values
CONFIDENCE_THRESHOLD = 0.75
model = "llama3.1:8b"
base_url = "http://localhost:11434"
max_retries = 3

# ✅ CORRECT — Everything from config
from app.config import settings

model = settings.OLLAMA_MODEL_FAST
base_url = settings.OLLAMA_BASE_URL
max_retries = settings.MAX_RETRIES
confidence_threshold = settings.REPLY_CONFIDENCE_THRESHOLD
```

**The only exceptions** where hardcoding is acceptable:
- HTTP status codes (`200`, `404`)
- Mathematical constants
- Enum values / fixed string literals that represent code logic (`"cold"`, `"inbound"`)

Everything else → `config.py` → `.env`

### R-01: No Unnecessary Fallbacks
**Do NOT add fallback values "just in case."** If a config value is missing, the app should **fail loudly at startup**, not silently use a default.

```python
# ❌ WRONG — Silent fallback hides misconfiguration
model = os.getenv("OLLAMA_MODEL", "llama3.1:8b")
redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")

# ❌ WRONG — Defensive try/except that swallows real errors
try:
    result = await publish_to_linkedin(post)
except Exception:
    result = None  # "just in case"

# ✅ CORRECT — Fail loudly if config is missing
class Settings(BaseSettings):
    OLLAMA_MODEL_FAST: str           # No default = required
    REDIS_URL: str                    # No default = required

# ✅ CORRECT — Let errors propagate with context
result = await publish_to_linkedin(post)  # Caller handles the error
```

**When ARE fallbacks acceptable?**
- Graceful degradation between LLM models (70B unavailable → try 8B) — but log it as WARNING
- Pagination defaults (`page=1`, `limit=20`) — these are API contract defaults, not fallbacks
- Optional fields that genuinely can be None

### R-02: No Code Bloat — Write Less, Mean More
Every line must earn its place. If removing a line doesn't break functionality or readability, remove it.

```python
# ❌ BLOATED — Unnecessary variables, comments restating the obvious, verbose patterns
def get_lead_stage(score: int) -> str:
    """Get the lead stage based on the score."""
    # Check if the score is greater than or equal to 90
    if score >= 90:
        stage = "sql"
        return stage
    # Check if the score is greater than or equal to 75
    elif score >= 75:
        stage = "mql"
        return stage
    elif score >= 50:
        stage = "hot"
        return stage
    elif score >= 20:
        stage = "warm"
        return stage
    else:
        stage = "cold"
        return stage

# ✅ CLEAN — Same logic, zero waste
def get_lead_stage(score: int) -> str:
    if score >= 90: return "sql"
    if score >= 75: return "mql"
    if score >= 50: return "hot"
    if score >= 20: return "warm"
    return "cold"
```

**Rules:**
- No comments that restate what the code does — comments explain **why**, not **what**
- No wrapper functions that just call another function with the same args
- No empty `__init__.py` files with docstrings nobody reads
- No unused imports, dead code, or TODOs without a linked issue
- No excessive abstraction — don't create a `BasePlatformPublisherFactoryInterface` when a simple function will do
- Prefer flat over nested. If your function has 3+ levels of indentation, refactor it.

### R-03: Simple Production Code
Write code a junior developer can read in 10 seconds. No clever tricks, no over-engineering.

```python
# ❌ OVER-ENGINEERED — Abstraction for the sake of abstraction
class LeadStageStrategyFactory:
    _strategies: dict[str, LeadStageStrategy] = {}
    
    @classmethod
    def register(cls, name: str):
        def decorator(strategy_cls):
            cls._strategies[name] = strategy_cls()
            return strategy_cls
        return decorator
    
    @classmethod
    def get_stage(cls, score: int) -> str:
        for name, strategy in cls._strategies.items():
            if strategy.matches(score):
                return name
        return "cold"

# ✅ SIMPLE — Just a function. Done.
def get_lead_stage(score: int) -> str:
    if score >= 90: return "sql"
    if score >= 75: return "mql"
    if score >= 50: return "hot"
    if score >= 20: return "warm"
    return "cold"
```

**Principles:**
- **YAGNI** — Don't build it until you need it
- **Functions over classes** when there's no state to manage
- **Direct code over patterns** when the pattern adds complexity without value
- **One way to do things** — don't offer 3 ways to achieve the same result
- **Production grade ≠ complex** — Production grade means reliable, tested, and simple

### R-04: Read Docs First
Before writing ANY code, read the relevant documentation:
- [ARCHITECTURE.md](./ARCHITECTURE.md) — for system design decisions
- [DATABASE.md](./DATABASE.md) — for schema and data access patterns
- [API.md](./API.md) — for endpoint contracts
- [TECH_STACK.md](./TECH_STACK.md) — for approved technologies
- [REQUIREMENTS.md](./REQUIREMENTS.md) — for feature requirements
- [DEV_SPEC.md](./DEV_SPEC.md) — for code patterns and boilerplate

**Never guess. Always verify.**

### R-02: Never Introduce New Dependencies Without Justification
- Only use technologies listed in [TECH_STACK.md](./TECH_STACK.md)
- If a new package is needed, document WHY in the PR description
- Prefer stdlib → existing deps → new deps (in that order)
- No proprietary/paid dependencies. Everything must be open-source.

### R-03: Never Store Secrets in Code
- Use environment variables via `pydantic-settings`
- All secrets in `.env` (never committed) or Docker Secrets
- Platform OAuth tokens encrypted at application level before storing in DB
- NEVER log secrets, tokens, or credentials

### R-04: Always Use Type Hints
```python
# ✅ Correct
async def get_lead(lead_id: UUID) -> Lead:
    ...

# ❌ Wrong
async def get_lead(lead_id):
    ...
```

### R-05: Never Break Existing Tests
- Run `pytest` before every commit
- If you change behavior, update the tests
- New features MUST include tests

---

## 🟡 CODE STYLE RULES

### R-10: Python Code Style & Tooling
- **Package & Environment Manager**: `uv` (use `uv venv`, `uv pip install`, `uv run`)
- **Formatter & Linter**: Ruff (replaces flake8, black, isort)
- **Line length**: 100 characters max
- **Quotes**: Double quotes for strings
- **Imports**: Sorted by ruff (stdlib → third-party → local)
- **Docstrings**: Google-style docstrings for all public functions/classes

```python
async def generate_content(
    brief: str,
    platform: Platform,
    tone: str = "professional",
) -> GeneratedContent:
    """Generate marketing content for a specific platform.

    Args:
        brief: Campaign brief describing what to generate.
        platform: Target social media platform.
        tone: Desired tone of the content.

    Returns:
        GeneratedContent with text, hashtags, and CTA.

    Raises:
        LLMError: If the LLM service is unavailable.
    """
```

### R-11: Naming Conventions
| Element | Convention | Example |
|---|---|---|
| Files | `snake_case.py` | `lead_qualifier.py` |
| Classes | `PascalCase` | `LeadQualifier` |
| Functions | `snake_case` | `generate_content()` |
| Constants | `UPPER_SNAKE_CASE` | `MAX_RETRY_COUNT` |
| Variables | `snake_case` | `lead_score` |
| API routes | `kebab-case` | `/api/v1/review-queue` |
| DB tables | `snake_case` (plural) | `lead_score_events` |
| DB columns | `snake_case` | `platform_user_id` |

### R-12: File Organization
```python
# Order within a Python file:
# 1. Module docstring
# 2. Imports (stdlib → third-party → local)
# 3. Constants
# 4. Type aliases
# 5. Pydantic models / schemas
# 6. Helper functions (private, prefixed with _)
# 7. Main classes / functions (public)
# 8. No code at module level that has side effects
```

### R-13: Frontend Code Style
- **Components**: PascalCase files (`LeadCard.tsx`)
- **Hooks**: `use` prefix (`useLeads.ts`)
- **Utils**: camelCase (`formatDate.ts`)
- **Always use TypeScript** — no `.js` files in frontend
- **Prefer server components** in Next.js unless client interactivity is needed

---

## 🟢 ARCHITECTURE RULES

### R-20: Follow the Layer Architecture
```
API Route → Schema Validation → Service → Repository → Database
                                   ↓
                              Agent/Tool (if AI-involved)
```
- **API routes** only handle HTTP concerns (parse request, return response)
- **Services** contain business logic
- **Repositories** handle database queries (Repository pattern)
- **Agents** orchestrate AI tasks
- **Tools** are atomic operations used by agents

**Never put business logic in API routes. Never put SQL in services.**

### R-21: Repository Pattern for Data Access
```python
# ✅ Correct — Repository handles queries
class LeadRepository:
    async def get_by_id(self, lead_id: UUID) -> Lead | None:
        stmt = select(LeadModel).where(LeadModel.id == lead_id)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

# ❌ Wrong — SQL in service layer
class LeadService:
    async def get_lead(self, lead_id: UUID):
        result = await self.db.execute("SELECT * FROM leads WHERE id = $1", lead_id)
```

### R-22: Pydantic Schemas for All API I/O
```python
# Request schema
class CreatePostRequest(BaseModel):
    campaign_id: UUID
    platforms: list[str]
    brief: str
    tone: str = "professional"

# Response schema
class PostResponse(BaseModel):
    id: UUID
    content: str
    status: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
```

### R-23: Dependency Injection
```python
# ✅ Use FastAPI's Depends()
@router.get("/leads/{lead_id}")
async def get_lead(
    lead_id: UUID,
    lead_service: LeadService = Depends(get_lead_service),
    current_user: User = Depends(get_current_user),
) -> LeadResponse:
    ...
```

### R-24: Async Everywhere
- All database operations MUST be async (`async/await`)
- All HTTP calls MUST be async (use `httpx.AsyncClient`)
- All Redis operations MUST be async
- Never use `time.sleep()` — use `asyncio.sleep()`

---

## 🔵 AGENT/AI RULES

### R-30: Agent Tool Design
- Each tool does ONE thing
- Tools are stateless
- Tools return structured data (Pydantic models), not raw strings
- Tools handle their own errors and return error states

```python
# ✅ Good tool design
class LinkedInPublishTool:
    """Publish a single post to LinkedIn."""
    
    async def run(self, content: str, media_urls: list[str]) -> PublishResult:
        try:
            result = await self.client.publish(content, media_urls)
            return PublishResult(success=True, post_id=result.id)
        except RateLimitError:
            return PublishResult(success=False, error="rate_limited", retry_after=60)
```

### R-31: LLM Prompt Management
- Store prompts in `backend/app/prompts/` as separate files
- Use Jinja2 templates for dynamic prompts
- Version prompts — include a version comment at the top
- Never hardcode prompts inline in agent code

```python
# ✅ Correct
CONTENT_GENERATION_PROMPT = load_prompt("content_generation_v2.j2")

# ❌ Wrong
prompt = f"Generate a LinkedIn post about {topic}..."
```

### R-32: LLM Response Parsing
- Always validate LLM outputs with Pydantic
- Use structured output (JSON mode) when available
- Handle malformed responses gracefully (retry or fallback)
- Log all LLM inputs/outputs for debugging

### R-33: RAG Query Rules
- Always include a relevance threshold (don't return low-quality matches)
- Limit context window to avoid exceeding model token limits
- Log retrieved documents for debugging

---

## 🟣 TESTING RULES

### R-40: Test Coverage Requirements
| Component | Min Coverage | Test Type |
|---|---|---|
| API routes | 90% | Integration tests (TestClient) |
| Services | 85% | Unit tests |
| Repositories | 80% | Integration tests (test DB) |
| Agents | 70% | Unit tests (mock LLM) |
| Tools | 80% | Unit + integration tests |

### R-41: Test Naming
```python
# Pattern: test_{method}_{scenario}_{expected_result}
def test_score_lead_with_high_engagement_returns_hot_stage():
    ...

def test_generate_content_when_llm_unavailable_raises_service_error():
    ...
```

### R-42: Mock External Services
- Always mock LLM calls in tests (use fixtures)
- Always mock platform APIs in tests
- Use `pytest-asyncio` for async tests
- Use factory fixtures for test data (not raw SQL)

---

## 🟤 ERROR HANDLING RULES

### R-50: Custom Exceptions
```python
# Define in backend/app/exceptions.py
class VibeAgentError(Exception):
    """Base exception for all VibeAgent errors."""

class LLMError(VibeAgentError):
    """LLM service error (timeout, unavailable)."""

class PlatformAPIError(VibeAgentError):
    """Social media platform API error."""

class LeadNotFoundError(VibeAgentError):
    """Lead not found in database."""
```

### R-51: Never Swallow Exceptions
```python
# ✅ Correct
try:
    await publish_to_linkedin(content)
except LinkedInAPIError as e:
    logger.error("LinkedIn publish failed", extra={"error": str(e), "post_id": post_id})
    raise PlatformAPIError(f"LinkedIn publish failed: {e}") from e

# ❌ Wrong
try:
    await publish_to_linkedin(content)
except Exception:
    pass  # NEVER DO THIS
```

### R-52: Structured Logging
```python
import structlog

logger = structlog.get_logger()

# ✅ Correct
logger.info("post_published", post_id=post_id, platform="linkedin", latency_ms=245)

# ❌ Wrong
print(f"Published post {post_id} to LinkedIn")
```

---

## 📝 COMMIT & PR RULES

### R-60: Conventional Commits
```
feat: add LinkedIn publishing tool
fix: resolve race condition in webhook processing
docs: update API.md with new analytics endpoints
refactor: extract lead scoring into separate service
test: add integration tests for content generation
chore: update dependencies
```

### R-61: PR Checklist
Before submitting a PR, verify:
- [ ] Code follows all rules in this file
- [ ] All existing tests pass (`pytest`)
- [ ] New features have tests
- [ ] Ruff linting passes (`ruff check .`)
- [ ] Type checking passes (`mypy .`)
- [ ] API changes reflected in [API.md](./API.md)
- [ ] Schema changes have Alembic migration
- [ ] No secrets, tokens, or credentials in code
- [ ] Docstrings on all public functions

---

## 🚫 BANNED PATTERNS

| Pattern | Reason | Alternative |
|---|---|---|
| `import *` | Pollutes namespace | Explicit imports |
| `global` variables | Shared mutable state | Dependency injection |
| `print()` for logging | Not structured, not configurable | `structlog` |
| `time.sleep()` | Blocks async event loop | `asyncio.sleep()` |
| Raw SQL strings | SQL injection risk | SQLAlchemy ORM |
| `requests` library | Blocking I/O | `httpx` (async) |
| `.env` in git | Security risk | `.env.example` only |
| `Any` type hint | Defeats type safety | Use specific types |
| Nested try/except (3+ levels) | Unreadable | Refactor to functions |
| Functions > 50 lines | Too complex | Break into smaller functions |
