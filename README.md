# 🚀 VibeAgent — AI Marketing & Lead Qualification Platform

> An open-source, production-grade AI agentic system that generates marketing content, publishes across social platforms, engages with leads, and qualifies them automatically.

---

## 🎯 What is VibeAgent?

VibeAgent is a **multi-agent AI system** that automates your entire social media marketing pipeline:

1. **Generate** — AI creates platform-optimized marketing content (text, images, captions, hashtags)
2. **Publish** — Schedules and posts across LinkedIn, Instagram, Facebook, WhatsApp, and X/Twitter
3. **Monitor** — Tracks incoming comments, DMs, mentions, and reactions in real-time
4. **Engage** — Replies intelligently to every interaction with context-aware responses
5. **Qualify** — Scores and qualifies leads using BANT framework and conversational intelligence
6. **Route** — Pushes qualified leads to CRM for sales follow-up

All powered by **100% open-source technologies**. No vendor lock-in. Self-hosted.

---

## ✨ Key Features

- 🤖 **5 Specialized AI Agents** — Content Generator, Publisher, Monitor, Reply, Lead Qualifier
- 🧠 **Self-hosted LLMs** — Llama 3.1 / Mistral via Ollama with smart model routing
- 🎨 **AI Image Generation** — Stable Diffusion XL for marketing visuals
- 📱 **Multi-platform** — LinkedIn, Facebook, Instagram, WhatsApp, X/Twitter
- 🎯 **BANT Lead Scoring** — Automated lead qualification with configurable rules
- 💬 **Conversation Memory** — Multi-turn context-aware replies across platforms
- 👤 **Human-in-the-Loop** — Review queue for high-value interactions
- 📊 **Analytics Dashboard** — AI-powered insights on content performance
- 📅 **Content Calendar** — Visual scheduling with drag-and-drop
- 🔐 **Enterprise Auth** — Authentik-powered RBAC and SSO
- 📦 **Production Ready** — Docker Compose deployment, monitoring, and alerting

---

## 🛠️ Tech Stack (Overview)

| Layer | Technologies |
|---|---|
| **AI/ML** | Ollama, Llama 3.1, Mistral, LangChain, Stable Diffusion XL |
| **Agents** | CrewAI / LangGraph |
| **Backend** | Python 3.12+, FastAPI |
| **Workflows** | Hatchet |
| **Database** | PostgreSQL 16 + pgvector |
| **Cache/Queue** | Redis 7 |
| **Object Storage** | RustFS |
| **Auth** | Authentik |
| **Frontend** | Next.js 14, shadcn/ui, Recharts |
| **Infrastructure** | Docker, Traefik, Prometheus, Grafana |

> See [TECH_STACK.md](./TECH_STACK.md) for exact versions and justifications.

---

## 🚀 Quick Start

### Prerequisites

- Docker & Docker Compose v2+
- NVIDIA GPU with 24GB+ VRAM (for LLM inference)
- 16GB+ RAM
- Node.js 20+ (for frontend development)
- Python 3.12+ (for backend development)

### ⚡ Quick Commands (Make / PowerShell)

You can run commands using `make <target>` (if GNU Make is installed) or `.\make <target>` in PowerShell:

```bash
# Start full development stack (Postgres + Redis in Docker, FastAPI, Next.js)
make dev         # or .\make dev

# Start development infra only (Postgres + Redis)
make infra-up    # or .\make infra-up

# Start individual services
make backend-dev # or .\make backend-dev
make frontend-dev# or .\make frontend-dev

# Watch live consolidated logs from dev services and containers
make watch       # or .\make watch

# Stop all background dev jobs and containers
make dev-stop    # or .\make dev-stop

# View all available commands
make help        # or .\make help
```

### 1. Clone & Configure

```bash
git clone https://github.com/your-org/vibeagent.git
cd vibeagent
cp .env.example .env
# Edit .env with your platform API keys and configuration
```

### 2. Start Infrastructure

```bash
docker compose up -d
```

This starts PostgreSQL, Redis, RustFS, Authentik, Hatchet, Ollama, Prometheus, and Grafana.

### 3. Start Backend

```bash
cd backend
uv venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
uv pip install -e ".[dev]"
alembic upgrade head
uv run uvicorn app.main:app --reload --port 8000
```

### 4. Start Frontend

```bash
cd frontend
npm install
npm run dev
```

### 5. Ingest Knowledge Base

```bash
python scripts/ingest_knowledge.py --dir knowledge-base/
```

### 6. Access

| Service | URL |
|---|---|
| Dashboard | http://localhost:3000 |
| API Docs | http://localhost:8000/docs |
| Grafana | http://localhost:3001 |
| Authentik | http://localhost:9000 |

---

## 📁 Project Structure

```
vibeagent/
├── backend/          # FastAPI backend + AI agents
├── frontend/         # Next.js dashboard
├── docs/             # Project specifications and architecture docs
├── monitoring/       # Prometheus + Grafana configs
├── scripts/          # Setup and utility scripts
├── docker-compose.dev.yml
├── .env.example
└── README.md
```

---

## 📚 Documentation

| Document | Purpose |
|---|---|
| [PROJECT.md](./docs/PROJECT.md) | Project vision, goals, users, scope |
| [REQUIREMENTS.md](./docs/REQUIREMENTS.md) | Functional and non-functional requirements |
| [ARCHITECTURE.md](./docs/ARCHITECTURE.md) | System design and component relationships |
| [TECH_STACK.md](./docs/TECH_STACK.md) | Exact technologies, versions, and justifications |
| [DATABASE.md](./docs/DATABASE.md) | Database schema, relationships, and migrations |
| [API.md](./docs/API.md) | API endpoints, request/response contracts |
| [AI_RULES.md](./docs/AI_RULES.md) | Rules the AI agent must follow while coding |
| [DEV_SPEC.md](./docs/DEV_SPEC.md) | Developer implementation guide and code patterns |
| [MVP_SPEC.md](./docs/MVP_SPEC.md) | MVP specification, sprint tasks, and DoD |

---

## 🤝 Contributing

1. Read [AI_RULES.md](./docs/AI_RULES.md) before writing any code
2. Follow the architecture in [ARCHITECTURE.md](./docs/ARCHITECTURE.md)
3. All API changes must update [API.md](./docs/API.md)
4. All schema changes must update [DATABASE.md](./docs/DATABASE.md)
5. Write tests for all new features
6. Use conventional commits: `feat:`, `fix:`, `docs:`, `refactor:`

---

## 📄 License

This project is licensed under the MIT License. See [LICENSE](./LICENSE) for details.

---

## ⚠️ Legal Disclaimer

Automated messaging on social platforms must comply with each platform's Terms of Service. Always ensure your usage stays within approved API use cases. Violating ToS can result in permanent account bans. Disclose AI-generated content where required by law.
