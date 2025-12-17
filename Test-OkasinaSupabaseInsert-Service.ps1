# Test-OkasinaSupabaseInsert-Service.ps1
# Safe: does NOT touch any project files. Only calls Supabase using whichever
# SUPABASE URL + SERVICE key exist in your env after loading .env-main.

# 1) Load your main env file
. 'F:\tweakops\Load-DotEnv.ps1' -EnvFilePath 'F:\secrets\.env-main'

function Short-Value {
    param([string]$val)
    if (-not $val) { return "" }
    if ($val.Length -le 8) { return $val }
    return $val.Substring(0,4) + "..." + $val.Substring($val.Length - 4, 4)
}

Write-Host ">>> Listing SUPABASE-related environment variables after loading .env-main:" -ForegroundColor Cyan
$allSupabaseEnv = Get-ChildItem Env: | Where-Object { $_.Name -like "*SUPABASE*" }

if (-not $allSupabaseEnv) {
    Write-Host ">>> No SUPABASE-related env vars found. Check F:\secrets\.env-main." -ForegroundColor Red
    exit 1
}

$allSupabaseEnv | Sort-Object Name | ForEach-Object {
    $short = Short-Value $_.Value
    Write-Host ("- {0} = {1}" -f $_.Name, $short)
}

# Prefer vars that clearly look like URL + SERVICE key
$supabaseUrlVar = $allSupabaseEnv | Where-Object { $_.Name -match "SUPABASE_URL" } | Select-Object -First 1
$serviceKeyVar  = $allSupabaseEnv | Where-Object { $_.Name -match "SUPABASE_SERVICE" } | Select-Object -First 1

if (-not $supabaseUrlVar) {
    Write-Host "`n>>> ERROR: Could not find any env var with name matching *SUPABASE_URL*." -ForegroundColor Red
    exit 1
}

if (-not $serviceKeyVar) {
    Write-Host "`n>>> ERROR: Could not find any env var with name matching *SUPABASE_SERVICE*." -ForegroundColor Red
    exit 1
}

$supabaseUrl = $supabaseUrlVar.Value
$serviceKey  = $serviceKeyVar.Value

Write-Host "`n>>> Using URL var: $($supabaseUrlVar.Name) = $(Short-Value $supabaseUrl)" -ForegroundColor Yellow
Write-Host ">>> Using SERVICE key var: $($serviceKeyVar.Name) = $(Short-Value $serviceKey)" -ForegroundColor Yellow

if (-not $supabaseUrl -or -not $serviceKey) {
    Write-Host ">>> ERROR: Selected URL or SERVICE key value is empty." -ForegroundColor Red
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

try {
    $uri  = "$supabaseUrl/rest/v1/$table"
    $resp = Invoke-RestMethod -Method Post -Uri $uri `
        -Headers $headers -Body $bodyJson -ErrorAction Stop

    Write-Host ""
    Write-Host "=== INSERT SUCCEEDED ===" -ForegroundColor Green
    $resp | ConvertTo-Json -Depth 10
}
catch {
    Write-Host ""
    Write-Host "=== INSERT FAILED ===" -ForegroundColor Red

    if ($_.Exception.Response -ne $null) {
        $response   = $_.Exception.Response
        $statusCode = $response.StatusCode.value__
        $statusDesc = $response.StatusDescription

        Write-Host "HTTP status: $statusCode $statusDesc" -ForegroundColor Yellow

        $responseStream = $response.GetResponseStream()
        $reader         = New-Object System.IO.StreamReader($responseStream)
        $responseBody   = $reader.ReadToEnd()
        $reader.Close()

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
    $_.Exception.Message
}

Write-Host ""
Write-Host "=== SCHEMA: information_schema.columns for public.products ===" -ForegroundColor Cyan

try {
    $schemaUri = "$supabaseUrl/rest/v1/information_schema.columns" +
                 "?select=column_name,data_type,is_nullable,column_default" +
                 "&table_name=eq.products&table_schema=eq.public"

    $schemaResp = Invoke-RestMethod -Method Get -Uri $schemaUri -Headers $headers -ErrorAction Stop

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
