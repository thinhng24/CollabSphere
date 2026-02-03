@echo off
echo === CollabSphere Startup Script ===
echo.

echo Step 1: Stopping any existing containers...
docker compose down 2>nul
echo.

echo Step 2: Starting infrastructure services (PostgreSQL, Redis, RabbitMQ)...
docker compose up -d postgres redis rabbitmq
echo.

echo Step 3: Waiting for infrastructure to be healthy (60 seconds)...
echo This may take a while on first start...
timeout /t 5 /nobreak >nul
echo [5s ] Checking...
docker compose ps
timeout /t 10 /nobreak >nul
echo [15s] Checking...
docker compose ps
timeout /t 10 /nobreak >nul
echo [25s] Checking...
docker compose ps
timeout /t 10 /nobreak >nul
echo [35s] Checking...
docker compose ps
timeout /t 10 /nobreak >nul
echo [45s] Checking...
docker compose ps
timeout /t 15 /nobreak >nul
echo [60s] Final check...
docker compose ps
echo.

echo Step 4: Checking infrastructure health...
docker inspect collabsphere-postgres --format="PostgreSQL: {{.State.Health.Status}}"
docker inspect collabsphere-redis --format="Redis: {{.State.Health.Status}}"
docker inspect collabsphere-rabbitmq --format="RabbitMQ: {{.State.Health.Status}}"
echo.

set /p continue="Infrastructure ready? Continue to start services? (Y/N): "
if /I not "%continue%"=="Y" (
    echo.
    echo Startup cancelled. Check the infrastructure containers:
    echo   docker compose logs postgres
    echo   docker compose logs redis
    echo   docker compose logs rabbitmq
    pause
    exit /b 1
)
echo.

echo Step 5: Starting API Gateway and Backend Services...
docker compose up -d gateway project-service class-service subject-service team-service evaluation-service
echo.

echo Step 6: Waiting for services to start (30 seconds)...
timeout /t 30 /nobreak
echo.

echo Step 7: Checking all services...
docker compose ps
echo.

echo Step 8: Testing gateway connection...
echo Testing on port 5001...
curl -s -o nul -w "HTTP Status: %%{http_code}\n" http://localhost:5001 2>nul || echo Unable to connect - service may still be starting
echo.
echo Testing on port 5000 (fallback)...
curl -s -o nul -w "HTTP Status: %%{http_code}\n" http://localhost:5000 2>nul || echo Unable to connect on port 5000
echo.

echo === Startup Complete ===
echo.
echo Gateway URL: http://localhost:5001
echo.
echo If services are not responding:
echo 1. Check logs: docker compose logs -f gateway
echo 2. Run diagnostics: .\diagnose-gateway.bat
echo 3. Check individual service logs: docker logs collabsphere-gateway
echo.

echo Current status:
docker compose ps
echo.

echo To view real-time logs:
echo   docker compose logs -f
echo.
pause
