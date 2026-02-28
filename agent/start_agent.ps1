# Taliq Agent Auto-Restart Wrapper
# Usage: powershell -File start_agent.ps1

$AgentDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$Python = Join-Path $AgentDir ".venv\Scripts\python.exe"
$Script = Join-Path $AgentDir "agent.py"
$MaxRestarts = 50
$RestartDelay = 5

Set-Location $AgentDir

for ($i = 1; $i -le $MaxRestarts; $i++) {
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Write-Host "[$timestamp] Starting Taliq agent (attempt $i/$MaxRestarts)..."

    # Kill existing on port 8081
    Get-NetTCPConnection -LocalPort 8081 -ErrorAction SilentlyContinue |
        ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }
    Start-Sleep 1

    & $Python $Script start 2>&1 | Tee-Object -FilePath "agent_out.log" -Append

    $exitCode = $LASTEXITCODE
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Write-Host "[$timestamp] Agent exited with code $exitCode"

    if ($exitCode -eq 0) {
        Write-Host "Clean exit. Not restarting."
        break
    }

    Write-Host "Restarting in ${RestartDelay}s..."
    Start-Sleep $RestartDelay
}

Write-Host "Max restarts reached or clean exit."
