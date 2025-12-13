# JARVIS Tier 1 Health Monitor - PowerShell Version
# Run this to start autonomous monitoring with better logging

Write-Host "Starting JARVIS Tier 1 Health Monitor..." -ForegroundColor Cyan
Write-Host "Checking every 5 minutes" -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop" -ForegroundColor Yellow
Write-Host ""

$logFile = "scripts\jarvis-monitor.log"

while ($true) {
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Write-Host "[$timestamp] Running health check..." -ForegroundColor Green
    
    # Run health check
    $output = node scripts\jarvis-tier1-health.js 2>&1
    $exitCode = $LASTEXITCODE
    
    # Log output
    "$timestamp | Exit Code: $exitCode" | Out-File -Append $logFile
    $output | Out-File -Append $logFile
    
    if ($exitCode -ne 0) {
        Write-Host "[WARNING] Health check detected issues (Exit Code: $exitCode)" -ForegroundColor Yellow
    }
    else {
        Write-Host "[OK] All systems healthy" -ForegroundColor Green
    }
    
    Write-Host "Waiting 5 minutes..." -ForegroundColor Gray
    Start-Sleep -Seconds 300
}
