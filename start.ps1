# ============================================================
#  KAI App Launcher — starts Ollama + AI Agent + Next.js
#  Usage:  .\start.ps1
# ============================================================

$ErrorActionPreference = "Stop"
$Root = $PSScriptRoot

Write-Host ""
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "       KAI Nuvari App Launcher v1.0           " -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host ""

# ── 1. Ensure Ollama is running ────────────────────────────
Write-Host ">> Checking Ollama..." -ForegroundColor Yellow
try {
    Invoke-RestMethod "http://localhost:11434/api/tags" -TimeoutSec 3 | Out-Null
    Write-Host "   OK Ollama already running." -ForegroundColor Green
} catch {
    Write-Host "   Starting Ollama in background..." -ForegroundColor Yellow
    Start-Process -FilePath "ollama" -ArgumentList "serve" -WindowStyle Minimized
    $waited = 0
    do {
        Start-Sleep -Seconds 2; $waited += 2
        try {
            Invoke-RestMethod "http://localhost:11434/api/tags" -TimeoutSec 2 | Out-Null
            break
        } catch {
            # retry
        }
    } while ($waited -lt 30)
    Write-Host "   OK Ollama started." -ForegroundColor Green
}

# ── 2. Ensure required models are pulled ───────────────────
Write-Host ">> Verifying Ollama models..." -ForegroundColor Yellow
$models = (Invoke-RestMethod "http://localhost:11434/api/tags").models.name
foreach ($m in @("qwen3:0.6b", "nomic-embed-text")) {
    if ($models -contains $m) {
        Write-Host "   OK $m" -ForegroundColor Green
    } else {
        Write-Host "   Pulling $m (first-time only)..." -ForegroundColor Yellow
        ollama pull $m
        Write-Host "   OK $m pulled." -ForegroundColor Green
    }
}

# ── 3. Set up Python venv if needed ────────────────────────
$AgentDir = Join-Path $Root "ai-agent"
$VenvPy   = Join-Path $AgentDir ".venv\Scripts\python.exe"
$VenvPip  = Join-Path $AgentDir ".venv\Scripts\pip.exe"

Write-Host ">> Python environment..." -ForegroundColor Yellow
if (-not (Test-Path $VenvPy)) {
    Write-Host "   Creating virtual environment..." -ForegroundColor Yellow
    py -m venv (Join-Path $AgentDir ".venv")
    Write-Host "   OK venv created." -ForegroundColor Green
}
Write-Host "   Installing / updating dependencies..." -ForegroundColor Yellow
& $VenvPip install -q -r (Join-Path $AgentDir "requirements.txt") --upgrade
Write-Host "   OK Dependencies ready." -ForegroundColor Green

# ── 4. Launch AI Agent in new window ─────────────────────
Write-Host ">> Starting KAI AI Agent on port 8000..." -ForegroundColor Yellow
$agentCmd = "Set-Location '$AgentDir'; & '$VenvPy' -m uvicorn server:app --host 127.0.0.1 --port 8000 --reload"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $agentCmd -WindowStyle Normal

# Wait up to 90s for agent to be healthy
Write-Host "   Waiting for agent to start (index build may take a minute)..." -ForegroundColor Yellow
$waited = 0
do {
    Start-Sleep -Seconds 3; $waited += 3
    try {
        $h = Invoke-RestMethod "http://127.0.0.1:8000/health" -TimeoutSec 2
        Write-Host "   OK AI Agent running — model: $($h.model)" -ForegroundColor Green
        break
    } catch {
        # retry
    }
} while ($waited -lt 90)
if ($waited -ge 90) {
    Write-Host "   WARNING: Agent did not respond in 90s — check the AI Agent window." -ForegroundColor Red
}

# ── 5. Launch Next.js frontend in new window ──────────────
Write-Host ">> Starting Next.js frontend on port 3000..." -ForegroundColor Yellow
$FrontendDir = Join-Path $Root "avax-frontend"
$frontCmd = "Set-Location '$FrontendDir'; npm run dev"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $frontCmd -WindowStyle Normal

Write-Host ""
Write-Host "===============================================" -ForegroundColor Green
Write-Host "  All services launched!                      " -ForegroundColor Green
Write-Host "  Frontend : http://localhost:3000            " -ForegroundColor Green
Write-Host "  AI Agent : http://127.0.0.1:8000/health     " -ForegroundColor Green
Write-Host "  Ollama   : http://localhost:11434           " -ForegroundColor Green
Write-Host "===============================================" -ForegroundColor Green
Write-Host ""
Write-Host "Close individual windows to stop each service." -ForegroundColor Gray
