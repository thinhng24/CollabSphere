@echo off
echo === Change Gateway Port ===
echo.
echo Current gateway port: 5000
echo.
echo Recommended alternative ports:
echo   1. Port 5001 (recommended)
echo   2. Port 8000
echo   3. Port 3001
echo   4. Custom port
echo.

set /p choice="Select option (1-4): "

if "%choice%"=="1" set newport=5001
if "%choice%"=="2" set newport=8000
if "%choice%"=="3" set newport=3001
if "%choice%"=="4" (
    set /p newport="Enter custom port number: "
)

if not defined newport (
    echo Invalid choice
    pause
    exit /b 1
)

echo.
echo Changing gateway port from 5000 to %newport%...
echo.

REM Backup original file
copy docker-compose.yml docker-compose.yml.backup.%date:~-4,4%%date:~-10,2%%date:~-7,2%_%time:~0,2%%time:~3,2%%time:~6,2%

REM Change the port using PowerShell
powershell -Command "(Get-Content docker-compose.yml) -replace '\"5000:8080\"', '\"%newport%:8080\"' | Set-Content docker-compose.yml"

echo.
echo Port changed successfully!
echo.
echo Backup saved as: docker-compose.yml.backup.*
echo.
echo Now restart services:
echo   docker compose down
echo   docker compose up -d
echo.
echo Gateway will be available at: http://localhost:%newport%
echo.
echo IMPORTANT: Update frontend VITE_API_URL to use port %newport%
echo   File: frontend/collabsphere-web/.env
echo   Change: VITE_API_URL=http://localhost:%newport%/api
echo.
pause
