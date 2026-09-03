<#
.SYNOPSIS
    PowerShell runner for Makefile targets on Windows (when make is not installed).
.EXAMPLE
    .\make dev
    .\make backend-dev
    .\make infra-up
    .\make help
#>
param(
    [Parameter(Position = 0)]
    [string]$Target = "help",
    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]]$RemainingArgs
)

$ROOT = $PSScriptRoot

switch ($Target.ToLower()) {
    "help" {
        Write-Host "`n==============================================================================" -ForegroundColor Cyan
        Write-Host "  VibeAgent Commands (via .\make or make)" -ForegroundColor Cyan
        Write-Host "==============================================================================" -ForegroundColor Cyan
        Write-Host "  Development Environment:" -ForegroundColor Yellow
        Write-Host "    .\make dev                Start full dev stack (Docker infra + Backend + Frontend)"
        Write-Host "    .\make dev-backend        Start dev stack with Backend and DB only"
        Write-Host "    .\make dev-frontend       Start dev stack with Frontend only"
        Write-Host "    .\make dev-worker         Start dev stack with Hatchet background worker"
        Write-Host "    .\make dev-litellm        Start dev stack with LiteLLM proxy"
        Write-Host "    .\make dev-stop           Stop all running dev background jobs and containers"
        Write-Host ""
        Write-Host "  Docker Infrastructure:" -ForegroundColor Yellow
        Write-Host "    .\make infra-up           Start PostgreSQL and Redis dev containers"
        Write-Host "    .\make infra-down         Stop development Docker containers"
        Write-Host "    .\make infra-logs         Follow development Docker container logs"
        Write-Host "    .\make infra-status       Check status of development Docker containers"
        Write-Host ""
        Write-Host "  Backend (FastAPI):" -ForegroundColor Yellow
        Write-Host "    .\make backend-install    Install backend dependencies via uv"
        Write-Host "    .\make backend-dev        Run FastAPI dev server (port 8000)"
        Write-Host "    .\make backend-worker     Run Hatchet worker process"
        Write-Host "    .\make backend-migrate    Apply Alembic database migrations"
        Write-Host "    .\make backend-test       Run backend test suite with pytest"
        Write-Host "    .\make backend-lint       Check backend code with ruff"
        Write-Host "    .\make backend-format     Format backend code with ruff"
        Write-Host ""
        Write-Host "  Frontend (Next.js):" -ForegroundColor Yellow
        Write-Host "    .\make frontend-install   Install frontend dependencies via npm"
        Write-Host "    .\make frontend-dev       Run Next.js dev server (port 3000)"
        Write-Host "    .\make frontend-build     Build Next.js production bundle"
        Write-Host "    .\make frontend-lint      Run ESLint on frontend"
        Write-Host "    .\make frontend-types     Generate TypeScript types from OpenAPI schema"
        Write-Host ""
        Write-Host "  Knowledge Base & Production:" -ForegroundColor Yellow
        Write-Host "    .\make ingest             Ingest documents from knowledge-base/ directory"
        Write-Host "    .\make prod-up            Start full production Docker stack"
        Write-Host "    .\make prod-down          Stop full production Docker stack"
        Write-Host "    .\make prod-logs          Follow production Docker logs"
        Write-Host "    .\make setup              Initialize environment files and install dependencies"
        Write-Host "==============================================================================`n" -ForegroundColor Cyan
    }
    "setup" {
        if (-not (Test-Path "$ROOT\.env")) {
            Copy-Item "$ROOT\.env.example" "$ROOT\.env"
            Write-Host "  Created .env" -ForegroundColor Green
        }
        if (-not (Test-Path "$ROOT\backend\.env")) {
            Copy-Item "$ROOT\.env.example" "$ROOT\backend\.env"
            Write-Host "  Created backend/.env" -ForegroundColor Green
        }
        Push-Location "$ROOT\backend"
        uv sync
        Pop-Location
        Push-Location "$ROOT\frontend"
        npm install
        Pop-Location
    }
    "dev" {
        & "$ROOT\scripts\dev.ps1" @RemainingArgs
    }
    "dev-backend" {
        & "$ROOT\scripts\dev.ps1" -Backend @RemainingArgs
    }
    "dev-frontend" {
        & "$ROOT\scripts\dev.ps1" -Frontend @RemainingArgs
    }
    "dev-worker" {
        & "$ROOT\scripts\dev.ps1" -Worker @RemainingArgs
    }
    "dev-litellm" {
        & "$ROOT\scripts\dev.ps1" -WithLitellm @RemainingArgs
    }
    "dev-stop" {
        & "$ROOT\scripts\dev-stop.ps1"
    }
    "infra-up" {
        docker compose -f "$ROOT\docker-compose.dev.yml" up -d postgres redis
    }
    "infra-down" {
        docker compose -f "$ROOT\docker-compose.dev.yml" down
    }
    "infra-logs" {
        docker compose -f "$ROOT\docker-compose.dev.yml" logs -f
    }
    "infra-status" {
        docker compose -f "$ROOT\docker-compose.dev.yml" ps
    }
    "backend-install" {
        Push-Location "$ROOT\backend"
        uv sync
        Pop-Location
    }
    "backend-dev" {
        Push-Location "$ROOT\backend"
        uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
        Pop-Location
    }
    "backend-worker" {
        Push-Location "$ROOT\backend"
        uv run python worker.py
        Pop-Location
    }
    "backend-migrate" {
        Push-Location "$ROOT\backend"
        uv run alembic upgrade head
        Pop-Location
    }
    "backend-test" {
        Push-Location "$ROOT\backend"
        uv run pytest
        Pop-Location
    }
    "backend-lint" {
        Push-Location "$ROOT\backend"
        uv run ruff check .
        Pop-Location
    }
    "backend-format" {
        Push-Location "$ROOT\backend"
        uv run ruff format .
        Pop-Location
    }
    "frontend-install" {
        Push-Location "$ROOT\frontend"
        npm install
        Pop-Location
    }
    "frontend-dev" {
        Push-Location "$ROOT\frontend"
        npm run dev
        Pop-Location
    }
    "frontend-build" {
        Push-Location "$ROOT\frontend"
        npm run build
        Pop-Location
    }
    "frontend-lint" {
        Push-Location "$ROOT\frontend"
        npm run lint
        Pop-Location
    }
    "frontend-types" {
        Push-Location "$ROOT\frontend"
        npm run generate:api
        Pop-Location
    }
    "ingest" {
        Push-Location "$ROOT\backend"
        uv run python ..\scripts\ingest_knowledge.py --dir ..\knowledge-base\
        Pop-Location
    }
    "prod-up" {
        docker compose -f "$ROOT\docker-compose.yml" up -d
    }
    "prod-down" {
        docker compose -f "$ROOT\docker-compose.yml" down
    }
    "prod-logs" {
        docker compose -f "$ROOT\docker-compose.yml" logs -f
    }
    default {
        Write-Host "Unknown target: $Target" -ForegroundColor Red
        Write-Host "Run '.\make help' to see available targets." -ForegroundColor Yellow
    }
}
