# FINAL FIX SCRIPT
# The issue is "GitHub CLI" is forcing its own credentials.
# We will tell THIS repository to ignore it.

Write-Host "Disabling GitHub CLI Credential Helper for this repo..."
git config --local credential.helper ""

Write-Host "Cleaning up any previous settings..."
git config --local --unset-all credential.helper

Write-Host "Wait 2 seconds..."
Start-Sleep -Seconds 2

Write-Host "Attempting Push (You MUST sign in now)..." -ForegroundColor Green
git push origin main

if ($LASTEXITCODE -ne 0) {
    Write-Host "If this fails, you need to use a Personal Access Token." -ForegroundColor Yellow
}
