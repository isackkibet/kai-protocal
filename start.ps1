# ============================================================
#  KAI Unified Ecosystem Launcher
#  Starts AI Agent + KAI Nuvari App + SIHU Hub + Oloolua Hub
#  Usage:  .\start.ps1
# ============================================================

$ErrorActionPreference = "Stop"
$Root = $PSScriptRoot

Write-Host ""
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "     KAI Ecosystem & Dual Hubs Launcher v2.0   " -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host ""

# -- 1. Check Python environment ----------------------------
Write-Host ">> Python environment..." -ForegroundColor Yellow
$PythonExe = "python"
try {
    & $PythonExe -c "import fastapi, uvicorn; print('   OK FastAPI ready')"
} catch {
    Write-Host "   Installing FastAPI and dependencies..." -ForegroundColor Yellow
    & $PythonExe -m pip install -q -r (Join-Path $Root "requirements.txt")
}

# -- 2. Check for .env / GROQ_API_KEY -------------------------
Write-Host ">> Checking environment..." -ForegroundColor Yellow
$envFile = Join-Path $Root ".env"
if (Test-Path $envFile) {
    $envContent = Get-Content $envFile -Raw
    if ($envContent -match "GROQ_API_KEY=(.+)") {
        $key = $Matches[1].Trim()
        if ($key -and $key -ne "" -and $key -ne "your_groq_api_key_here") {
            Write-Host "   OK GROQ_API_KEY is configured." -ForegroundColor Green
        } else {
            Write-Host "   NOTE: Groq key not set (Needle local engine will run by default)." -ForegroundColor Gray
        }
    }
}

# -- 3. Launch AI Agent on port 8000 -------------------------
Write-Host ">> [1/4] Starting KAI AI Agent on port 8000..." -ForegroundColor Yellow
$agentCmd = "Set-Location '$Root'; python -m uvicorn server:app --host 127.0.0.1 --port 8000 --reload"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $agentCmd -WindowStyle Normal

# -- 4. Launch KAI Nuvari Main App on port 3000 --------------
Write-Host ">> [2/4] Starting KAI Nuvari App on port 3000..." -ForegroundColor Yellow
$FrontendDir = Join-Path $Root "avax-frontend"
$frontCmd = "Set-Location '$FrontendDir'; npm run dev"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $frontCmd -WindowStyle Normal

# -- 5. Launch SIHU News Hub on port 3001 --------------------
Write-Host ">> [3/4] Starting SIHU News Hub on port 3001..." -ForegroundColor Yellow
$SihuDir = Join-Path $Root "SIHU.COM"
$sihuCmd = "Set-Location '$SihuDir'; npx next dev -p 3001"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $sihuCmd -WindowStyle Normal

# -- 6. Launch Oloolua Conservation Hub on port 3002 ---------
Write-Host ">> [4/4] Starting Oloolua Conservation Hub on port 3002..." -ForegroundColor Yellow
$OlooluaDir = Join-Path $Root "oloolua-youth-guardians"
$olooluaCmd = "Set-Location '$OlooluaDir'; npx next dev -p 3002"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $olooluaCmd -WindowStyle Normal

# Health Check
Write-Host "   Waiting for services to become responsive..." -ForegroundColor Yellow
Start-Sleep -Seconds 4

Write-Host ""
Write-Host "===============================================" -ForegroundColor Green
Write-Host "  All Ecosystem Services & Hubs Running!       " -ForegroundColor Green
Write-Host "===============================================" -ForegroundColor Green
Write-Host "  * Main KAI App       : http://localhost:3000 " -ForegroundColor Cyan
Write-Host "    - SIHU News Hub    : http://localhost:3000/hub" -ForegroundColor White
Write-Host "    - Conservation Hub : http://localhost:3000/conservation" -ForegroundColor White
Write-Host "  * SIHU Portal        : http://localhost:3001 " -ForegroundColor Cyan
Write-Host "  * Oloolua Hub        : http://localhost:3002 " -ForegroundColor Cyan
Write-Host "  * AI Agent Backend   : http://127.0.0.1:8000 " -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Green
Write-Host ""
Write-Host "Close individual windows to stop each service." -ForegroundColor Gray
