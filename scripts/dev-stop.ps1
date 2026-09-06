<#
.SYNOPSIS
    Stop all dev environment processes and infrastructure containers.
.PARAMETER Volumes
    Also remove Docker volumes (-v) for a full clean up.
.EXAMPLE
    .\scripts\dev-stop.ps1
    .\scripts\dev-stop.ps1 -Volumes
    .\scripts\dev-stop.ps1 -v
#>
param(
    [Alias("v")]
    [switch]$Volumes
)

$ROOT = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)

$msgSuffix = if ($Volumes) { " (with full volume cleanup -v)" } else { "" }
Write-Host "`n=== Stopping dev environment$msgSuffix ===" -ForegroundColor Cyan

# Stop any background PowerShell jobs from dev.ps1
$devJobs = Get-Job | Where-Object { $_.Name -in @("backend-api", "frontend-dev", "hatchet-worker") }
foreach ($job in $devJobs) {
    Write-Host "  ->  Stopping $($job.Name)..."
    Stop-Job $job -ErrorAction SilentlyContinue
    Remove-Job $job -Force -ErrorAction SilentlyContinue
}

# Stop Docker infra containers
if ($Volumes) {
    Write-Host "  ->  Stopping Docker containers and removing volumes (-v)..."
} else {
    Write-Host "  ->  Stopping Docker containers..."
}

Push-Location $ROOT
try {
    if ($Volumes) {
        docker compose -f docker-compose.dev.yml down -v --remove-orphans 2>&1 | Out-Null
    } else {
        docker compose -f docker-compose.dev.yml down --remove-orphans 2>&1 | Out-Null
    }
} catch {}
Pop-Location

Write-Host "  [OK]  Everything stopped.`n" -ForegroundColor Green
