# Script to Push Code to GitHub
Write-Host "Setting Remote URL..."
git remote set-url origin https://github.com/Okasina-Trading/OKASINA-Trading.git

Write-Host "Attempting Push..."
git push origin main

if ($LASTEXITCODE -ne 0) {
    Write-Host "Push Failed. Resetting Credentials..." -ForegroundColor Yellow
    
    # 1. Clear generic Windows credentials for GitHub
    cmdkey /delete:git:https://github.com
    
    # 2. Clear git credential helper cache
    # We pipe the protocol and host to 'git credential reject'
    "protocol=https`nhost=github.com" | git credential reject

    Write-Host "Credentials Cleared." -ForegroundColor Green
    Write-Host "Retrying Push... (A login window should pop up, or check your browser)" -ForegroundColor Cyan
    
    git push origin main
}

Write-Host "Done."
