@echo off
echo ========================================
echo CollabSphere Setup Script (Windows)
echo ========================================
echo.

REM Check if Docker is installed
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker is not installed. Please install Docker Desktop first.
    pause
    exit /b 1
)
echo [OK] Docker is installed

REM Check if Docker Compose is installed
docker-compose --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker Compose is not installed. Please install Docker Compose first.
    pause
    exit /b 1
)
echo [OK] Docker Compose is installed

REM Create .env file if it doesn't exist
if not exist .env (
    echo [INFO] Creating .env file from .env.example...
    copy .env.example .env
    echo [OK] .env file created. Please update it with your actual credentials.
) else (
    echo [OK] .env file already exists
)

echo.
echo What would you like to do?
echo 1) Build and start all services
echo 2) Start all services (without building)
echo 3) Stop all services
echo 4) View logs
echo 5) Clean up (remove containers and volumes)
echo 6) Exit
echo.
set /p choice="Enter your choice (1-6): "

if "%choice%"=="1" goto build_start
if "%choice%"=="2" goto start
if "%choice%"=="3" goto stop
if "%choice%"=="4" goto logs
if "%choice%"=="5" goto cleanup
if "%choice%"=="6" goto exit
goto invalid

:build_start
echo [INFO] Building and starting all services...
docker-compose up --build -d
echo [OK] All services are running!
echo.
echo Access points:
echo - API Gateway: http://localhost:5000
echo - Frontend: http://localhost:3000
echo - RabbitMQ Management: http://localhost:15672 (admin/admin123)
echo.
echo To view logs: docker-compose logs -f
goto end

:start
echo [INFO] Starting all services...
docker-compose up -d
echo [OK] All services are running!
goto end

:stop
echo [INFO] Stopping all services...
docker-compose down
echo [OK] All services stopped
goto end

:logs
echo [INFO] Viewing logs (Ctrl+C to exit)...
docker-compose logs -f
goto end

:cleanup
echo [WARNING] This will remove all containers and volumes. Are you sure? (Y/N)
set /p confirm=""
if /i "%confirm%"=="Y" (
    echo [INFO] Cleaning up...
    docker-compose down -v
    echo [OK] Cleanup complete
) else (
    echo [INFO] Cancelled
)
goto end

:invalid
echo [ERROR] Invalid choice
goto end

:exit
echo Goodbye!
exit /b 0

:end
echo.
pause
