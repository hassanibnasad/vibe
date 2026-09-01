<#
.SYNOPSIS
    Stop all dev environment processes and infrastructure containers.
.EXAMPLE
    .\scripts\dev-stop.ps1
#>

$ROOT = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)

Write-Host "`n━━━ Stopping dev environment ━━━" -ForegroundColor Cyan

# Stop any background PowerShell jobs from dev.ps1
$devJobs = Get-Job | Where-Object { $_.Name -in @("backend-api", "frontend-dev", "hatchet-worker") }
foreach ($job in $devJobs) {
    Write-Host "  →  Stopping $($job.Name)..."
    Stop-Job $job -ErrorAction SilentlyContinue
    Remove-Job $job -Force -ErrorAction SilentlyContinue
}

# Stop Docker infra containers
Write-Host "  →  Stopping Docker containers..."
Push-Location $ROOT
docker compose -f docker-compose.dev.yml down 2>$null
Pop-Location

Write-Host "  ✓  Everything stopped.`n" -ForegroundColor Green
