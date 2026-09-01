<#
.SYNOPSIS
    Hybrid dev environment — Docker for infra, native for app code.

.DESCRIPTION
    Starts Postgres + Redis in Docker (lightweight), then launches:
      - Backend:  uv run uvicorn with --reload
      - Frontend: npm run dev (Next.js)
    Press Ctrl+C to stop everything gracefully.

.PARAMETER SkipInfra
    Skip starting Docker containers (useful if they're already running).

.PARAMETER Backend
    Start only the backend (no frontend).

.PARAMETER Frontend
    Start only the frontend (no backend).

.PARAMETER Worker
    Also start the Hatchet worker process.

.PARAMETER WithLitellm
    Also start the LiteLLM proxy container.

.EXAMPLE
    .\scripts\dev.ps1                    # Full stack
    .\scripts\dev.ps1 -Backend           # Backend only (infra + API)
    .\scripts\dev.ps1 -SkipInfra         # App only (infra already running)
    .\scripts\dev.ps1 -Worker            # Full stack + Hatchet worker
    .\scripts\dev.ps1 -WithLitellm       # Full stack + LiteLLM proxy
#>

param(
    [switch]$SkipInfra,
    [switch]$Backend,
    [switch]$Frontend,
    [switch]$Worker,
    [switch]$WithLitellm
)

$ErrorActionPreference = "Stop"
$ROOT = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)

# ── Colors ──────────────────────────────────────────────────────────────────
function Write-Status($icon, $msg) { Write-Host "  $icon  $msg" }
function Write-Header($msg) { Write-Host "`n━━━ $msg ━━━" -ForegroundColor Cyan }
function Write-Ok($msg) { Write-Status "✓" $msg }
function Write-Info($msg) { Write-Status "→" $msg }
function Write-Warn($msg) { Write-Host "  ⚠  $msg" -ForegroundColor Yellow }

# ── Resolve what to start ───────────────────────────────────────────────────
$startBackend  = -not $Frontend
$startFrontend = -not $Backend

# ── Track child processes for cleanup ───────────────────────────────────────
$script:childJobs = @()

function Stop-Everything {
    Write-Header "Shutting down"

    foreach ($job in $script:childJobs) {
        if ($job.State -eq "Running") {
            Write-Info "Stopping $($job.Name)..."
            Stop-Job $job -ErrorAction SilentlyContinue
            Remove-Job $job -Force -ErrorAction SilentlyContinue
        }
    }

    if (-not $SkipInfra) {
        Write-Info "Stopping Docker infra containers..."
        Push-Location $ROOT
        docker compose -f docker-compose.dev.yml stop postgres redis 2>$null
        if ($WithLitellm) {
            docker compose -f docker-compose.dev.yml stop litellm 2>$null
        }
        Pop-Location
    }

    Write-Ok "All stopped. Goodbye!"
}

# Register Ctrl+C handler
$null = Register-EngineEvent -SourceIdentifier PowerShell.Exiting -Action { Stop-Everything }
trap { Stop-Everything; break }

# ── 1. Docker infrastructure ───────────────────────────────────────────────
if (-not $SkipInfra) {
    Write-Header "Starting infrastructure containers"

    # Check Docker is running
    $dockerInfo = docker info 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Warn "Docker is not running. Please start Docker Desktop first."
        exit 1
    }

    Push-Location $ROOT

    $services = @("postgres", "redis")
    if ($WithLitellm) { $services += "litellm" }

    $serviceList = $services -join " "
    Write-Info "Starting: $serviceList"
    Invoke-Expression "docker compose -f docker-compose.dev.yml up -d $serviceList"

    # Wait for health checks
    Write-Info "Waiting for Postgres to be ready..."
    $retries = 0
    do {
        Start-Sleep -Seconds 2
        $pgReady = docker exec vibeagent-postgres pg_isready -U vibeagent 2>$null
        $retries++
    } while ($LASTEXITCODE -ne 0 -and $retries -lt 15)

    if ($LASTEXITCODE -ne 0) {
        Write-Warn "Postgres did not become ready in time."
        Pop-Location
        exit 1
    }
    Write-Ok "Postgres is ready"

    Write-Info "Waiting for Redis to be ready..."
    $retries = 0
    do {
        Start-Sleep -Seconds 1
        $redisReady = docker exec vibeagent-redis redis-cli ping 2>$null
        $retries++
    } while ($redisReady -ne "PONG" -and $retries -lt 10)

    if ($redisReady -ne "PONG") {
        Write-Warn "Redis did not become ready in time."
        Pop-Location
        exit 1
    }
    Write-Ok "Redis is ready"

    Pop-Location
}

# ── 2. Load .env into environment ───────────────────────────────────────────
$envFile = Join-Path $ROOT "backend\.env"
if (-not (Test-Path $envFile)) {
    $envExample = Join-Path $ROOT ".env.example"
    if (Test-Path $envExample) {
        Write-Warn "No backend/.env found. Copying from .env.example"
        Copy-Item $envExample $envFile
    }
}

if (Test-Path $envFile) {
    Write-Info "Loading environment from backend/.env"
    Get-Content $envFile | ForEach-Object {
        $line = $_.Trim()
        if ($line -and -not $line.StartsWith("#")) {
            $parts = $line -split "=", 2
            if ($parts.Count -eq 2) {
                [System.Environment]::SetEnvironmentVariable($parts[0].Trim(), $parts[1].Trim(), "Process")
            }
        }
    }
}

# ── 3. Backend ──────────────────────────────────────────────────────────────
if ($startBackend) {
    Write-Header "Starting backend (FastAPI)"

    $backendDir = Join-Path $ROOT "backend"

    # Check venv exists
    $venvPath = Join-Path $backendDir ".venv"
    if (-not (Test-Path $venvPath)) {
        Write-Info "Creating virtual environment with uv..."
        Push-Location $backendDir
        uv venv
        uv sync
        Pop-Location
    }

    Write-Info "uvicorn on http://localhost:8000 (reload enabled)"
    $backendJob = Start-Job -Name "backend-api" -ScriptBlock {
        param($dir, $envFile)
        Set-Location $dir

        # Load .env into job's environment
        if (Test-Path $envFile) {
            Get-Content $envFile | ForEach-Object {
                $line = $_.Trim()
                if ($line -and -not $line.StartsWith("#")) {
                    $parts = $line -split "=", 2
                    if ($parts.Count -eq 2) {
                        [System.Environment]::SetEnvironmentVariable($parts[0].Trim(), $parts[1].Trim(), "Process")
                    }
                }
            }
        }

        uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
    } -ArgumentList $backendDir, $envFile
    $script:childJobs += $backendJob
    Write-Ok "Backend started (job: $($backendJob.Id))"

    # Optional: Hatchet worker
    if ($Worker) {
        Write-Header "Starting Hatchet worker"
        Write-Info "Worker process launching..."
        $workerJob = Start-Job -Name "hatchet-worker" -ScriptBlock {
            param($dir, $envFile)
            Set-Location $dir
            if (Test-Path $envFile) {
                Get-Content $envFile | ForEach-Object {
                    $line = $_.Trim()
                    if ($line -and -not $line.StartsWith("#")) {
                        $parts = $line -split "=", 2
                        if ($parts.Count -eq 2) {
                            [System.Environment]::SetEnvironmentVariable($parts[0].Trim(), $parts[1].Trim(), "Process")
                        }
                    }
                }
            }
            uv run python worker.py
        } -ArgumentList $backendDir, $envFile
        $script:childJobs += $workerJob
        Write-Ok "Worker started (job: $($workerJob.Id))"
    }
}

# ── 4. Frontend ─────────────────────────────────────────────────────────────
if ($startFrontend) {
    Write-Header "Starting frontend (Next.js)"

    $frontendDir = Join-Path $ROOT "frontend"

    # Check node_modules exists
    $nodeModules = Join-Path $frontendDir "node_modules"
    if (-not (Test-Path $nodeModules)) {
        Write-Info "Installing npm dependencies..."
        Push-Location $frontendDir
        npm install
        Pop-Location
    }

    Write-Info "Next.js dev on http://localhost:3000"
    $frontendJob = Start-Job -Name "frontend-dev" -ScriptBlock {
        param($dir)
        Set-Location $dir
        npm run dev
    } -ArgumentList $frontendDir
    $script:childJobs += $frontendJob
    Write-Ok "Frontend started (job: $($frontendJob.Id))"
}

# ── 5. Summary ──────────────────────────────────────────────────────────────
Write-Header "Dev environment is running"
Write-Host ""
if ($startBackend)  { Write-Ok "Backend  → http://localhost:8000" }
if ($startBackend)  { Write-Ok "API Docs → http://localhost:8000/docs" }
if ($startFrontend) { Write-Ok "Frontend → http://localhost:3000" }
if ($Worker)        { Write-Ok "Worker   → Hatchet worker active" }
if ($WithLitellm)   { Write-Ok "LiteLLM  → http://localhost:4000" }
Write-Host ""
Write-Info "Press Ctrl+C to stop everything"
Write-Host ""

# ── 6. Tail logs from all jobs ─────────────────────────────────────────────
try {
    while ($true) {
        foreach ($job in $script:childJobs) {
            $output = Receive-Job $job -ErrorAction SilentlyContinue
            if ($output) {
                $prefix = switch ($job.Name) {
                    "backend-api"    { "[API]" }
                    "frontend-dev"   { "[WEB]" }
                    "hatchet-worker" { "[WKR]" }
                    default          { "[???]" }
                }
                $color = switch ($job.Name) {
                    "backend-api"    { "Green" }
                    "frontend-dev"   { "Blue" }
                    "hatchet-worker" { "Magenta" }
                    default          { "White" }
                }
                $output | ForEach-Object { Write-Host "$prefix $_" -ForegroundColor $color }
            }

            # Check for crashed jobs
            if ($job.State -eq "Failed") {
                Write-Warn "$($job.Name) has crashed!"
                Receive-Job $job -ErrorAction SilentlyContinue | ForEach-Object {
                    Write-Host "  $_" -ForegroundColor Red
                }
            }
        }
        Start-Sleep -Milliseconds 500
    }
} finally {
    Stop-Everything
}
