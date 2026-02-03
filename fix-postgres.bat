@echo off
echo === PostgreSQL Container Quick Fix ===
echo.
echo This script will attempt to fix the unhealthy PostgreSQL container.
echo.

set /p choice="Choose fix option (1=Restart, 2=Recreate, 3=Clean Start): "

if "%choice%"=="1" (
    echo.
    echo [Fix 1] Restarting PostgreSQL container...
    docker-compose restart postgres
    echo.
    echo Waiting for PostgreSQL to be healthy (up to 60 seconds)...
    timeout /t 60 /nobreak
    docker inspect collabsphere-postgres --format="{{.State.Health.Status}}"
    echo.
    echo If still unhealthy, run this script again and try option 2.
)

if "%choice%"=="2" (
    echo.
    echo [Fix 2] Recreating PostgreSQL container (preserves data)...
    docker-compose stop postgres
    docker-compose rm -f postgres
    docker-compose up -d postgres
    echo.
    echo Waiting for PostgreSQL to be healthy (up to 60 seconds)...
    timeout /t 60 /nobreak
    docker inspect collabsphere-postgres --format="{{.State.Health.Status}}"
    echo.
    echo If still unhealthy, run this script again and try option 3.
)

if "%choice%"=="3" (
    echo.
    echo WARNING: This will delete ALL PostgreSQL data!
    set /p confirm="Are you sure? Type YES to continue: "
    if /I "%confirm%"=="YES" (
        echo.
        echo [Fix 3] Clean start - removing container and volume...
        echo Stopping all containers...
        docker-compose down
        echo.
        echo Removing orphan containers and networks...
        docker compose down --remove-orphans
        docker volume rm collabsphere_postgres-data 2>nul
        docker network rm collabsphere_collabsphere-network 2>nul
        echo.
        echo Starting fresh PostgreSQL container...
        docker-compose up -d postgres
        echo.
        echo Waiting for PostgreSQL to be healthy (up to 60 seconds)...
        timeout /t 60 /nobreak
        docker inspect collabsphere-postgres --format="{{.State.Health.Status}}"
        echo.
        echo PostgreSQL should now be healthy. Starting other services...
        docker-compose up -d
    ) else (
        echo.
        echo Fix 3 cancelled.
    )
)

echo.
echo === Fix Complete ===
echo Check the container status with: docker-compose ps
echo View logs with: docker logs collabsphere-postgres
echo.
pause
