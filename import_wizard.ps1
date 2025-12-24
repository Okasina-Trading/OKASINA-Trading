
# TITAN Import Wizard 🧙‍♂️
# Automates the entire Product Import + AI Enhancement process.

$ErrorActionPreference = "Stop"

Write-Host "==============================================" -ForegroundColor Cyan
Write-Host "   🛍️  OKASINA PRODUCT IMPORT WIZARD" -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "This tool will:"
Write-Host "1. CLEAN IMPORT from 'okasina_simple_template.csv'"
Write-Host "2. Match Images from 'Website import' folder."
Write-Host "3. Update Stock Qty and Basic Details."
Write-Host "4. Use AI to read specific Prices/Sizes from images."
Write-Host ""

# 1. Environment Check
if (-not (Test-Path ".env")) {
    Write-Error "CRITICAL: .env file missing! Please verify you are in the project folder."
    exit 1
}

# 2. Run Import
Write-Host "Step 1: Running Bulk Import..." -ForegroundColor Yellow
try {
    node scripts/headless-import.js
}
catch {
    Write-Error "Import failed. Please check the logs above."
    exit 1
}

Write-Host "✅ Bulk Import Step Complete." -ForegroundColor Green
Write-Host ""

# 3. AI Enhancement
$runAI = Read-Host "Do you want to run AI Auto-Correction (Fix Prices/Sizes from Images)? (Y/N)"
if ($runAI -eq 'Y' -or $runAI -eq 'y') {
    Write-Host "Step 2: Activating AI Scanner..." -ForegroundColor Yellow
    Write-Host "(This may take a few minutes as it reads every image)" -ForegroundColor Gray
    node scripts/ocr-full.js
    Write-Host "✅ AI Enhancement Complete." -ForegroundColor Green
}
else {
    Write-Host "Skipping AI Enhancement." -ForegroundColor Gray
}

Write-Host ""
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host "   🎉  PROCESS COMPLETE" -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host "Check your website: https://okasinatrading.com"
Read-Host "Press Enter to exit..."
