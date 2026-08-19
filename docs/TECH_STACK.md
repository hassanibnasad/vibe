# 🔧 TECH_STACK.md — VibeAgent

## Technology Decisions

Every technology is **open-source** and **self-hostable**. No proprietary dependencies.

---

## AI / ML Layer

| Component | Technology | Version | Purpose | Justification |
|---|---|---|---|---|
| LLM Runtime | [Ollama](https://ollama.ai) | latest | Self-hosted LLM inference | Simplest setup for local LLM serving. Supports GGUF models. |
| LLM Runtime (Prod) | [vLLM](https://github.com/vllm-project/vllm) | 0.6.x | High-throughput LLM serving | PagedAttention for production throughput. Use for scale. |
| Primary LLM | Llama 3.1 70B | Q4_K_M | Content generation, lead qualification | Best open-source general-purpose model for reasoning and writing. |
| Fast LLM | Llama 3.1 8B / Mistral 7B | Q4_K_M | Quick replies, classification, sentiment | Fast inference for real-time reply generation. |
| Embeddings | [sentence-transformers](https://github.com/UKPLab/sentence-transformers) | 3.x | Vector embeddings for RAG | `all-MiniLM-L6-v2` — fast, accurate, small footprint. |
| RAG Framework | [LangChain](https://github.com/langchain-ai/langchain) | 0.3.x | RAG pipeline orchestration | Mature ecosystem, pgvector integration, tool abstractions. |
| Image Generation | [Stable Diffusion XL](https://github.com/Stability-AI/generative-models) | SDXL 1.0 | Marketing visual generation | Best open-source image gen quality. |
| Image Gen Server | [ComfyUI](https://github.com/comfyanonymous/ComfyUI) | latest | SDXL API server | Node-based, API-accessible, supports workflows. |

---

## Agent Orchestration

| Component | Technology | Version | Purpose | Justification |
|---|---|---|---|---|
| Agent Framework | [CrewAI](https://github.com/crewAIInc/crewAI) | 0.80.x | Multi-agent orchestration | Simpler than LangGraph for role-based agents. Built-in tool use. |
| Agent Framework (Alt) | [LangGraph](https://github.com/langchain-ai/langgraph) | 0.2.x | Graph-based agent orchestration | Use if we need complex conditional flows between agents. |
| Workflow Engine | [Hatchet](https://github.com/hatchet-dev/hatchet) | 0.40.x | Durable workflow execution | Replaces both Celery and n8n. Python SDK, retries, concurrency, cron. Simpler Temporal alternative. |

**Decision: CrewAI vs LangGraph**
- Start with **CrewAI** for initial development (simpler, role-based agents)
- Migrate to **LangGraph** if we need complex conditional branching or state machines
- Both use LangChain tools, so migration cost is low

---

## Backend

| Component | Technology | Version | Purpose | Justification |
|---|---|---|---|---|
| Language | Python | 3.12+ | Backend language | AI/ML ecosystem. Async support. Team expertise. |
| Web Framework | [FastAPI](https://github.com/tiangolo/fastapi) | 0.115.x | REST API + WebSocket | Async, auto-docs (OpenAPI), Pydantic validation, high performance. |
| ORM | [SQLAlchemy](https://github.com/sqlalchemy/sqlalchemy) | 2.0.x | Database ORM | Async support, mature, excellent PostgreSQL support. |
| Migrations | [Alembic](https://github.com/sqlalchemy/alembic) | 1.14.x | Database migrations | Standard for SQLAlchemy projects. |
| Validation | [Pydantic](https://github.com/pydantic/pydantic) | 2.10.x | Request/response schemas | Built into FastAPI. Type-safe, fast. |
| Settings | [pydantic-settings](https://github.com/pydantic/pydantic-settings) | 2.7.x | Environment configuration | Type-safe env config with .env file support. |
| HTTP Client | [httpx](https://github.com/encode/httpx) | 0.28.x | Platform API calls | Async, HTTP/2 support, timeout handling. |
| Task Scheduling | Hatchet (see above) | — | Async tasks, cron jobs | Replaces Celery. Durable, event-driven. |

---

## Data & Storage

| Component | Technology | Version | Purpose | Justification |
|---|---|---|---|---|
| Primary Database | [PostgreSQL](https://www.postgresql.org/) | 16.x | Relational data store | Rock-solid, JSON support, extensions ecosystem. |
| Vector Extension | [pgvector](https://github.com/pgvector/pgvector) | 0.8.x | Vector embeddings for RAG | Eliminates separate vector DB. Same DB for relational + vector. Simpler ops. |
| Cache / Queue | [Redis](https://github.com/redis/redis) | 7.4.x | Message queues, caching, rate limiting | In-memory speed. Pub/Sub for real-time events. Rate limit counters. |
| Object Storage | [RustFS](https://github.com/nicholascw/rustfs) | latest | S3-compatible media storage | Lightweight, fast, Rust-based. Stores images, videos, media assets. |

**Decision: pgvector vs ChromaDB/Qdrant**
- **pgvector** was chosen to reduce operational complexity
- One database for both relational data AND vector embeddings
- Sufficient performance for our scale (< 1M vectors)
- Eliminates a separate service to deploy, monitor, and backup

---

## Infrastructure

| Component | Technology | Version | Purpose | Justification |
|---|---|---|---|---|
| API Gateway | [Traefik](https://github.com/traefik/traefik) | 3.2.x | Reverse proxy, TLS, routing | Auto-discovery, Let's Encrypt, Docker-native. |
| Auth / IAM | [Authentik](https://github.com/goauthentik/authentik) | 2024.12.x | Authentication, RBAC, SSO | Python-native (Django). Modern UI. Lightweight (~500MB RAM). OAuth/OIDC. |
| Containerization | [Docker](https://www.docker.com/) + Compose | 27.x / 2.x | Service orchestration | Standard. Single `docker compose up` to start everything. |
| Monitoring | [Prometheus](https://github.com/prometheus/prometheus) | 2.55.x | Metrics collection | Industry standard. Pull-based. PromQL. |
| Dashboards | [Grafana](https://github.com/grafana/grafana) | 11.x | Visualization and alerting | Rich dashboards. Alert rules. Loki integration. |
| Logging | [Loki](https://github.com/grafana/loki) | 3.x | Centralized log aggregation | Lightweight. Grafana-native. LogQL. |

**Decision: Authentik vs Keycloak vs ZITADEL**
- **Authentik** chosen for: Python ecosystem match, modern UI, lower resource usage
- Keycloak: too heavy (~2GB RAM), Java-based, complex admin UI
- ZITADEL: excellent but Go-based, smaller community

**Decision: Hatchet vs n8n vs Temporal**
- **Hatchet** chosen as a simpler Temporal alternative with Python SDK
- n8n: visual but not code-first, harder to version control
- Temporal: powerful but heavy operational burden

---

## Frontend

| Component | Technology | Version | Purpose | Justification |
|---|---|---|---|---|
| Framework | [Next.js](https://github.com/vercel/next.js) | 14.x | React framework with SSR/SSG | App Router, server components, file-based routing. |
| UI Library | [shadcn/ui](https://github.com/shadcn-ui/ui) | latest | Component library | Beautiful, accessible, copy-paste components. Tailwind-based. |
| CSS | [Tailwind CSS](https://github.com/tailwindcss/tailwindcss) | 3.4.x | Utility-first CSS | Required by shadcn/ui. Consistent styling. |
| Charts | [Recharts](https://github.com/recharts/recharts) | 2.x | Analytics visualizations | React-native. Responsive. Good for dashboards. |
| State Management | [Zustand](https://github.com/pmndrs/zustand) | 5.x | Client state | Simple, lightweight. No boilerplate. |
| API Client | [TanStack Query](https://github.com/TanStack/query) | 5.x | Server state management | Caching, background refetch, optimistic updates. |
| Forms | [React Hook Form](https://github.com/react-hook-form/react-hook-form) | 7.x | Form handling | Performance, validation (zod integration). |

---

## Development Tools

| Component | Technology | Purpose |
|---|---|---|
| Package & Env Manager | [uv](https://github.com/astral-sh/uv) | Extremely fast Python package installer and virtualenv manager |
| Linter & Formatter | Ruff | Fast Python linting + formatting (replaces flake8, black, isort) |
| Type Checker | mypy | Static type checking for Python |
| Testing | pytest + pytest-asyncio | Unit and integration testing |
| API Testing | httpx (TestClient) | FastAPI test client |
| Frontend Linter | ESLint + Prettier | JS/TS linting and formatting |
| Git Hooks | pre-commit | Automated checks before commit |
| CI/CD | GitHub Actions | Automated testing and deployment |

---

## Minimum Hardware Requirements

| Component | Dev Machine | Production (Self-hosted) |
|---|---|---|
| **LLM Server** | 1× GPU (RTX 3090 24GB) | 2× GPU (RTX 4090 / A100 40GB) |
| **Application Server** | 4 CPU, 16GB RAM | 16 CPU, 32GB RAM |
| **Database** | Shared with app server | 8 CPU, 16GB RAM, 500GB NVMe |
| **Image Gen** | Shared GPU | 1× GPU (RTX 4090 24GB) |
| **Total Storage** | 100GB SSD | 1TB NVMe |

> **Cost-effective alternative**: Use cloud GPU (RunPod, Vast.ai) for LLM inference. Run everything else on a $50/mo VPS. Use GGUF Q4 quantized models to fit on smaller GPUs.
