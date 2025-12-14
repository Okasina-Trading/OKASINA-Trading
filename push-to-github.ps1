# OKASINA - Push to New GitHub Repository
# This script helps you push code to the new Okasina-Trading organization

Write-Host "🚀 OKASINA - GitHub Push Helper" -ForegroundColor Cyan
Write-Host ""

# Check if GitHub CLI is installed
$ghInstalled = Get-Command gh -ErrorAction SilentlyContinue

if ($ghInstalled) {
    Write-Host "✅ GitHub CLI detected" -ForegroundColor Green
    Write-Host ""
    Write-Host "Authenticating with GitHub..." -ForegroundColor Yellow
    gh auth login
    
    Write-Host ""
    Write-Host "Pushing to new repository..." -ForegroundColor Yellow
    git push -u origin main
    
}
else {
    Write-Host "❌ GitHub CLI not found" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please choose an option:" -ForegroundColor Yellow
    Write-Host "1. Install GitHub CLI (recommended)"
    Write-Host "2. Use Personal Access Token"
    Write-Host "3. Use VS Code / GitHub Desktop"
    Write-Host ""
    
    $choice = Read-Host "Enter choice (1-3)"
    
    switch ($choice) {
        "1" {
            Write-Host "Installing GitHub CLI..." -ForegroundColor Yellow
            winget install GitHub.cli
            Write-Host "Please run this script again after installation" -ForegroundColor Green
        }
        "2" {
            Write-Host ""
            Write-Host "Steps to create Personal Access Token:" -ForegroundColor Cyan
            Write-Host "1. Go to: https://github.com/settings/tokens/new"
            Write-Host "2. Give it a name: 'OKASINA Deploy'"
            Write-Host "3. Select scope: 'repo' (full control)"
            Write-Host "4. Click 'Generate token'"
            Write-Host "5. Copy the token"
            Write-Host ""
            
            $token = Read-Host "Paste your token here" -AsSecureString
            $tokenPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
                [Runtime.InteropServices.Marshal]::SecureStringToBSTR($token)
            )
            
            Write-Host "Pushing to repository..." -ForegroundColor Yellow
            git push "https://$tokenPlain@github.com/Okasina-Trading/OKASINA-Trading.git" main
            
            Write-Host "✅ Push complete!" -ForegroundColor Green
        }
        "3" {
            Write-Host ""
            Write-Host "Using VS Code or GitHub Desktop:" -ForegroundColor Cyan
            Write-Host "1. Open VS Code or GitHub Desktop"
            Write-Host "2. Open this folder: $PWD"
            Write-Host "3. Use the Git panel to push"
            Write-Host "4. Authenticate when prompted"
            Write-Host ""
        }
    }
}
