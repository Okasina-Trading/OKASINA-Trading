@echo off
REM JARVIS Tier 1 Health Monitor - 5 Minute Loop
REM Run this to start autonomous monitoring

echo Starting JARVIS Tier 1 Health Monitor...
echo Checking every 5 minutes
echo Press Ctrl+C to stop
echo.

:loop
    echo [%date% %time%] Running health check...
    node scripts\jarvis-tier1-health.js
    
    if %ERRORLEVEL% NEQ 0 (
        echo [WARNING] Health check detected issues
    )
    
    echo Waiting 5 minutes...
    timeout /t 300 /nobreak >nul
    goto loop
