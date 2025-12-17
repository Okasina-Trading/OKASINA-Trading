# FORCE LOGIN SCRIPT
# This script bypasses all Windows settings and asks you to type your login manually.

Write-Host "The system thinks you are 'Omran1983' and is blocking you." -ForegroundColor Yellow
Write-Host "Please verify which GitHub account has access to this repo (likely 'Okasina-Trading')."

$User = Read-Host "Enter your GitHub Username"
$Token = Read-Host "Enter your Password (or Personal Access Token)"

if (-not $User -or -not $Token) {
    Write-Host "Username or Password cannot be empty." -ForegroundColor Red
    exit
}

Write-Host "Pushing as $User..."
# We construct the URL with credentials embedded. This forces Git to use them.
git push https://$($User):$($Token)@github.com/Okasina-Trading/OKASINA-Trading.git main

if ($LASTEXITCODE -eq 0) {
    Write-Host "SUCCESS! Deployed." -ForegroundColor Green
}
else {
    Write-Host "Failed. Please check if your Token/Password is correct." -ForegroundColor Red
    Write-Host "Note: If you have 2FA enabled, you MUST use a Personal Access Token, not your password."
}
