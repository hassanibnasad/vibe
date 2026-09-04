<#
.SYNOPSIS
    Watch live consolidated logs from dev containers and services.
.DESCRIPTION
    Streams logs from running background PowerShell jobs (FastAPI, Next.js, Hatchet worker)
    or Docker dev containers (Postgres, Redis, LiteLLM).
    Press Ctrl+C to stop watching (does not stop the services).
.EXAMPLE
    .\scripts\dev-watch.ps1
    .\scripts\dev-watch.ps1 -Docker
#>
param(
    [switch]$Docker
)

$ROOT = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)

Write-Host "`n=== Watching Dev Environment Logs ===" -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop watching (services will remain running)`n" -ForegroundColor Gray

# If -Docker flag specified, directly follow docker compose logs
if ($Docker) {
    Push-Location $ROOT
    docker compose -f docker-compose.dev.yml logs -f --tail=100
    Pop-Location
    exit 0
}

# Check for active background jobs
$activeJobs = Get-Job | Where-Object { $_.Name -in @("backend-api", "frontend-dev", "hatchet-worker") -and $_.State -eq "Running" }

if ($activeJobs) {
    Write-Host "  -> Streaming logs from active services: $(($activeJobs | ForEach-Object { $_.Name }) -join ', ')...`n" -ForegroundColor Green
    try {
        while ($true) {
            foreach ($job in $activeJobs) {
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
            }
            Start-Sleep -Milliseconds 500
        }
    }
    catch {
        # Graceful exit on interrupt
    }
    exit 0
}

# If no PowerShell jobs, check if Docker infra is running
$dockerRunning = docker compose -f "$ROOT\docker-compose.dev.yml" ps --services --filter "status=running" 2>$null
if ($dockerRunning) {
    Write-Host "  -> No background app jobs found. Streaming Docker infrastructure logs...`n" -ForegroundColor Green
    Push-Location $ROOT
    docker compose -f docker-compose.dev.yml logs -f --tail=100
    Pop-Location
    exit 0
}

Write-Host "  [!] No active dev services or Docker containers found." -ForegroundColor Yellow
Write-Host "      Start the environment first using 'make dev' or 'make infra-up'.`n" -ForegroundColor Gray
