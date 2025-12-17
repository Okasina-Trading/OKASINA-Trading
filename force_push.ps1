# FORCE PUSH SCRIPT
# This script aggressively clears credentials and forces a new login.

Write-Host "Unsetting local credential helper..."
git config --local --unset credential.helper

Write-Host "Clearing Windows Credentials..."
cmdkey /delete:git:https://github.com
cmdkey /delete:LegacyGeneric:target=git:https://github.com
cmdkey /delete:LegacyGeneric:target=GITHUB_TOKEN@Jarvis
cmdkey /delete:LegacyGeneric:target=github.com

Write-Host "Clearing Git Manager Cache..."
"protocol=https`nhost=github.com" | git credential-manager reject

Write-Host "Attempting Push (You MUST sign in now)..." -ForegroundColor Green
git push origin main

if ($LASTEXITCODE -ne 0) {
    Write-Host "Still failed? Try signing out of GitHub in your browser first." -ForegroundColor Red
}
