.DEFAULT_GOAL := help

.PHONY: help setup dev dev-backend dev-frontend dev-worker dev-litellm dev-stop \
        infra-up infra-down infra-logs infra-status \
        backend-install backend-dev backend-worker backend-migrate backend-migration \
        backend-test backend-lint backend-format \
        frontend-install frontend-dev frontend-build frontend-lint frontend-types \
        ingest prod-up prod-down prod-logs clean

# ------------------------------------------------------------------------------
# Help
# ------------------------------------------------------------------------------
help:
	@echo ==============================================================================
	@echo   VibeAgent Makefile Commands
	@echo ==============================================================================
	@echo   Development Environment:
	@echo     make dev                Start full dev stack (Docker infra + Backend + Frontend)
	@echo     make dev-backend        Start dev stack with Backend and DB only
	@echo     make dev-frontend       Start dev stack with Frontend only
	@echo     make dev-worker         Start dev stack with Hatchet background worker
	@echo     make dev-litellm        Start dev stack with LiteLLM proxy
	@echo     make dev-stop           Stop all running dev background jobs and containers
	@echo ""
	@echo   Docker Infrastructure:
	@echo     make infra-up           Start PostgreSQL and Redis dev containers
	@echo     make infra-down         Stop development Docker containers
	@echo     make infra-logs         Follow development Docker container logs
	@echo     make infra-status       Check status of development Docker containers
	@echo ""
	@echo   Backend (FastAPI):
	@echo     make backend-install    Install backend dependencies via uv
	@echo     make backend-dev        Run FastAPI dev server (port 8000)
	@echo     make backend-worker     Run Hatchet worker process
	@echo     make backend-migrate    Apply Alembic database migrations
	@echo     make backend-migration  Generate new migration (use msg="description")
	@echo     make backend-test       Run backend test suite with pytest
	@echo     make backend-lint       Check backend code with ruff
	@echo     make backend-format     Format backend code with ruff
	@echo ""
	@echo   Frontend (Next.js):
	@echo     make frontend-install   Install frontend dependencies via npm
	@echo     make frontend-dev       Run Next.js dev server (port 3000)
	@echo     make frontend-build     Build Next.js production bundle
	@echo     make frontend-lint      Run ESLint on frontend
	@echo     make frontend-types     Generate TypeScript types from OpenAPI schema
	@echo ""
	@echo   Knowledge Base & Production:
	@echo     make ingest             Ingest documents from knowledge-base/ directory
	@echo     make prod-up            Start full production Docker stack
	@echo     make prod-down          Stop full production Docker stack
	@echo     make prod-logs          Follow production Docker logs
	@echo     make setup              Initialize environment files and install all dependencies
	@echo ==============================================================================

# ------------------------------------------------------------------------------
# Setup
# ------------------------------------------------------------------------------
setup:
	powershell -Command "if (!(Test-Path .env)) { Copy-Item .env.example .env; Write-Host 'Created .env' }"
	powershell -Command "if (!(Test-Path backend\.env)) { Copy-Item .env.example backend\.env; Write-Host 'Created backend/.env' }"
	cd backend && uv sync
	cd frontend && npm install

# ------------------------------------------------------------------------------
# Dev Environment Orchestration
# ------------------------------------------------------------------------------
dev:
	powershell -ExecutionPolicy Bypass -File ./scripts/dev.ps1

dev-backend:
	powershell -ExecutionPolicy Bypass -File ./scripts/dev.ps1 -Backend

dev-frontend:
	powershell -ExecutionPolicy Bypass -File ./scripts/dev.ps1 -Frontend

dev-worker:
	powershell -ExecutionPolicy Bypass -File ./scripts/dev.ps1 -Worker

dev-litellm:
	powershell -ExecutionPolicy Bypass -File ./scripts/dev.ps1 -WithLitellm

dev-stop:
	powershell -ExecutionPolicy Bypass -File ./scripts/dev-stop.ps1

# ------------------------------------------------------------------------------
# Docker Infrastructure
# ------------------------------------------------------------------------------
infra-up:
	docker compose -f docker-compose.dev.yml up -d postgres redis

infra-down:
	docker compose -f docker-compose.dev.yml down

infra-logs:
	docker compose -f docker-compose.dev.yml logs -f

infra-status:
	docker compose -f docker-compose.dev.yml ps

# ------------------------------------------------------------------------------
# Backend
# ------------------------------------------------------------------------------
backend-install:
	cd backend && uv sync

backend-dev:
	cd backend && uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

backend-worker:
	cd backend && uv run python worker.py

backend-migrate:
	cd backend && uv run alembic upgrade head

backend-migration:
	cd backend && uv run alembic revision --autogenerate -m "$(msg)"

backend-test:
	cd backend && uv run pytest

backend-lint:
	cd backend && uv run ruff check .

backend-format:
	cd backend && uv run ruff format .

# ------------------------------------------------------------------------------
# Frontend
# ------------------------------------------------------------------------------
frontend-install:
	cd frontend && npm install

frontend-dev:
	cd frontend && npm run dev

frontend-build:
	cd frontend && npm run build

frontend-lint:
	cd frontend && npm run lint

frontend-types:
	cd frontend && npm run generate:api

# ------------------------------------------------------------------------------
# Knowledge Base & Scripts
# ------------------------------------------------------------------------------
ingest:
	cd backend && uv run python ../scripts/ingest_knowledge.py --dir ../knowledge-base/

# ------------------------------------------------------------------------------
# Full Production Docker
# ------------------------------------------------------------------------------
prod-up:
	docker compose up -d

prod-down:
	docker compose down

prod-logs:
	docker compose logs -f

# ------------------------------------------------------------------------------
# Clean
# ------------------------------------------------------------------------------
clean:
	powershell -Command "Get-ChildItem -Path . -Include __pycache__,.pytest_cache,.ruff_cache -Recurse -Directory -ErrorAction SilentlyContinue | Remove-Item -Recurse -Force; Write-Host 'Cleaned caches'"
