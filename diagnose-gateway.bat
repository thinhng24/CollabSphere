@echo off
echo === Gateway Service Diagnostics ===
echo.

echo [1/8] Checking Docker daemon...
docker info >nul 2>&1
if errorlevel 1 (
    echo ERROR: Docker is not running!
    echo Please start Docker Desktop and try again.
    pause
    exit /b 1
) else (
    echo OK: Docker is running
)
echo.

echo [2/8] Checking all container status...
docker compose ps
echo.

echo [3/8] Checking gateway container specifically...
docker ps -a | findstr gateway
echo.

echo [4/8] Checking gateway container health...
docker inspect collabsphere-gateway --format="Status: {{.State.Status}} | Health: {{.State.Health.Status}}" 2>nul || echo Container not found or no health check
echo.

echo [5/8] Checking port configuration...
docker port collabsphere-gateway 2>nul || echo Container not running or no port mapping
echo.

echo [6/8] Checking dependency services (PostgreSQL, Redis)...
docker inspect collabsphere-postgres --format="Postgres Health: {{.State.Health.Status}}" 2>nul || echo PostgreSQL container not found
docker inspect collabsphere-redis --format="Redis Health: {{.State.Health.Status}}" 2>nul || echo Redis container not found
echo.

echo [7/8] Gateway container logs (last 30 lines)...
echo ================================================
docker logs --tail 30 collabsphere-gateway 2>nul || echo Cannot read logs - container may not exist or not started
echo ================================================
echo.

echo [8/8] Checking what ports are actually in use...
netstat -ano | findstr ":5000 :5001 :8080" | findstr LISTENING
echo.

echo === Diagnosis Complete ===
echo.

REM Provide recommendations based on container state
FOR /F "tokens=*" %%i IN ('docker inspect collabsphere-gateway --format="{{.State.Status}}" 2^>nul') DO SET GATEWAY_STATE=%%i

if "%GATEWAY_STATE%"=="" (
    echo ISSUE: Gateway container does not exist
    echo.
    echo SOLUTION: Build and start the container
    echo   docker compose up -d --build gateway
) else if "%GATEWAY_STATE%"=="exited" (
    echo ISSUE: Gateway container exited
    echo.
    echo SOLUTION: Check logs above for errors, then try:
    echo   docker compose restart gateway
    echo   OR
    echo   docker compose up -d gateway
) else if "%GATEWAY_STATE%"=="running" (
    echo STATUS: Gateway container is running
    echo.
    echo If still cannot connect, check:
    echo 1. Check logs above for binding errors
    echo 2. Verify port mapping with: docker port collabsphere-gateway
    echo 3. Check if dependencies are healthy
    echo 4. Wait 10-20 seconds for startup
    echo.
    echo Try accessing:
    echo   http://localhost:5001
    echo   http://localhost:5000
)
echo.

echo Run this command to see real-time logs:
echo   docker logs -f collabsphere-gateway
echo.
pause
