# Test-OkasinaSupabaseInsert-Service.ps1
# Safe: does NOT touch any project files. Only calls Supabase once using service key.

# 1) Load your main env file (same one you've been using)
. 'F:\tweakops\Load-DotEnv.ps1' -EnvFilePath 'F:\secrets\.env-main'

# 2) Read Supabase URL + SERVICE key from env
$supabaseUrl  = "https://drnqpbyptyyuacmrvdrr.supabase.co"
$anonKey      = "https://drnqpbyptyyuacmrvdrr.supabase.coeyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRybnFwYnlwdHl5dWFjbXJ2ZHJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyODE4NzIsImV4cCI6MjA3MTg1Nzg3Mn0.7lECyzHEhzVlOaBbOWBWwOygFCG1KAkSlE-ucs4Dozw"

Write-Host ">>> Using Supabase URL: $supabaseUrl" -ForegroundColor Cyan

if (-not $supabaseUrl -or -not $serviceKey) {
    Write-Host ">>> ERROR: EC_SUPABASE_URL or EC_SUPABASE_SERVICE_KEY not set after loading .env-main" -ForegroundColor Red
    exit 1
}

$table = "products"

$headers = @{
    "apikey"        = $serviceKey
    "Authorization" = "Bearer $serviceKey"
    "Content-Type"  = "application/json"
    "Prefer"        = "return=representation"
}

$debugName = "Debug Test Product " + (Get-Date -Format "yyyyMMdd-HHmmss")

# Minimal guess payload; Supabase will tell us if something is missing/wrong
$bodyObject = [ordered]@{
    name        = $debugName
    description = "Temporary debug insert from PowerShell - safe to delete."
    price       = 1000
    category    = "debug"
    image_url   = "https://via.placeholder.com/600x800.png?text=Debug"
    stock_qty   = 1
    status      = "active"
}

$bodyJson = $bodyObject | ConvertTo-Json -Depth 5

Write-Host "`n>>> Sending test insert to: $supabaseUrl/rest/v1/$table" -ForegroundColor Cyan
Write-Host ">>> Payload:" -ForegroundColor Cyan
$bodyJson

$insertFailed      = $false
$errorBody         = ""
$errorMessage      = ""
$errorStatusCode   = ""
$errorStatusDescr  = ""

try {
    $uri  = "$supabaseUrl/rest/v1/$table"
    $resp = Invoke-RestMethod -Method Post -Uri $uri `
        -Headers $headers -Body $bodyJson -ErrorAction Stop

    Write-Host ""
    Write-Host "=== INSERT SUCCEEDED ===" -ForegroundColor Green
    $resp | ConvertTo-Json -Depth 10
}
catch {
    $insertFailed = $true
    $errorMessage = $_.Exception.Message

    Write-Host ""
    Write-Host "=== INSERT FAILED ===" -ForegroundColor Red

    if ($_.Exception.Response -ne $null) {
        $response   = $_.Exception.Response
        $statusCode = $response.StatusCode.value__
        $statusDesc = $response.StatusDescription

        $errorStatusCode  = $statusCode
        $errorStatusDescr = $statusDesc

        $responseStream = $response.GetResponseStream()
        $reader         = New-Object System.IO.StreamReader($responseStream)
        $responseBody   = $reader.ReadToEnd()
        $reader.Close()

        $errorBody = $responseBody

        Write-Host "HTTP status: $statusCode $statusDesc" -ForegroundColor Yellow
        if (![string]::IsNullOrWhiteSpace($responseBody)) {
            Write-Host "Raw error body from Supabase:" -ForegroundColor Yellow
            $responseBody
        }
        else {
            Write-Host "Raw error body from Supabase: <EMPTY>" -ForegroundColor Yellow
        }
    }
    else {
        Write-Host "No HTTP response body, dumping exception object:" -ForegroundColor Yellow
        $_ | Format-List * -Force
    }

    Write-Host ""
    Write-Host "Exception.Message:" -ForegroundColor Yellow
    $errorMessage
}

# === Always try to fetch schema for public.products ===

Write-Host ""
Write-Host "=== SCHEMA: information_schema.columns for public.products ===" -ForegroundColor Cyan

try {
    $schemaUri = "$supabaseUrl/rest/v1/information_schema.columns" +
                 "?select=column_name,data_type,is_nullable,column_default" +
                 "&table_name=eq.products&table_schema=eq.public"

    $schemaResp = Invoke-RestMethod -Method Get -Uri $schemaUri -Headers $headers -ErrorAction Stop

    # Sort by column name for readability
    $schemaResp | Sort-Object column_name | ConvertTo-Json -Depth 5
}
catch {
    Write-Host "Failed to fetch information_schema.columns:" -ForegroundColor Yellow

    if ($_.Exception.Response -ne $null) {
        $response   = $_.Exception.Response
        $statusCode = $response.StatusCode.value__
        $statusDesc = $response.StatusDescription

        Write-Host "HTTP status: $statusCode $statusDesc" -ForegroundColor Yellow

        $responseStream = $response.GetResponseStream()
        $reader         = New-Object System.IO.StreamReader($responseStream)
        $responseBody   = $reader.ReadToEnd()
        $reader.Close()

        Write-Host "Raw error body:" -ForegroundColor Yellow
        $responseBody
    }
    else {
        $_ | Format-List * -Force
    }
}