# Taliq Agent Watchdog — auto-restart on crash
# Usage: powershell -File start_agent.ps1
# Logs: agent_watchdog.log

$AgentDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $AgentDir

$LogFile = Join-Path $AgentDir "agent_watchdog.log"
$MaxRestarts = 50
$RestartDelay = 5
$CrashWindow = 60  # seconds - if crashes within this window, increment fast-crash counter
$MaxFastCrashes = 5  # give up after this many rapid crashes

function Log($msg) {
    $ts = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $line = "[$ts] $msg"
    Write-Host $line
    Add-Content -Path $LogFile -Value $line
}

# Kill existing agent on port 8081
Get-NetTCPConnection -LocalPort 8081 -ErrorAction SilentlyContinue | ForEach-Object {
    Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
}
Start-Sleep 2

Log "=== Taliq Agent Watchdog Starting ==="
Log "Max restarts: $MaxRestarts | Restart delay: ${RestartDelay}s | Max fast crashes: $MaxFastCrashes"

$restartCount = 0
$fastCrashCount = 0

while ($restartCount -lt $MaxRestarts) {
    $restartCount++
    Log "Starting agent (attempt $restartCount/$MaxRestarts)..."
    
    $startTime = Get-Date
    $stdOut = Join-Path $AgentDir "agent_stdout.log"
    $stdErr = Join-Path $AgentDir "agent_stderr.log"
    
    $proc = Start-Process -FilePath "python" -ArgumentList "agent.py", "start" `
        -WorkingDirectory $AgentDir `
        -RedirectStandardOutput $stdOut `
        -RedirectStandardError $stdErr `
        -NoNewWindow -PassThru
    
    Log "Agent PID: $($proc.Id)"
    
    # Wait for process to exit
    $proc.WaitForExit()
    $exitCode = $proc.ExitCode
    $runTime = (Get-Date) - $startTime
    
    Log "Agent exited with code $exitCode after $([math]::Round($runTime.TotalSeconds))s"
    
    # Check for fast crash
    if ($runTime.TotalSeconds -lt $CrashWindow) {
        $fastCrashCount++
        Log "FAST CRASH #$fastCrashCount (ran < ${CrashWindow}s)"
        if ($fastCrashCount -ge $MaxFastCrashes) {
            Log "ERROR: $MaxFastCrashes fast crashes in a row. Giving up. Check agent_stderr.log"
            Log "Last stderr:"
            Get-Content $stdErr -Tail 20 | ForEach-Object { Log "  $_" }
            break
        }
        $delay = $RestartDelay * $fastCrashCount  # exponential backoff
        Log "Waiting ${delay}s before restart (backoff)..."
        Start-Sleep $delay
    } else {
        $fastCrashCount = 0  # reset if it ran for a while
        Log "Restarting in ${RestartDelay}s..."
        Start-Sleep $RestartDelay
    }
    
    # Clean up port
    Get-NetTCPConnection -LocalPort 8081 -ErrorAction SilentlyContinue | ForEach-Object {
        Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
    }
    Start-Sleep 1
}

Log "=== Watchdog stopped after $restartCount attempts ==="
