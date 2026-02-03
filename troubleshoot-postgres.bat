@echo off
echo === PostgreSQL Health Check Troubleshooting ===
echo.

echo 1. Checking container status...
docker ps -a | findstr postgres
echo.

echo 2. Checking container health...
docker inspect collabsphere-postgres --format="{{.State.Health.Status}}" 2>nul || echo Container not found or no health check configured
echo.

echo 3. Checking PostgreSQL logs (last 50 lines)...
docker logs --tail 50 collabsphere-postgres 2>nul || echo Cannot read logs - container may not exist
echo.

echo 4. Checking port availability...
netstat -an | findstr 5434 || echo Port 5434 is available
echo.

echo 5. Testing database connection...
docker exec collabsphere-postgres psql -U postgres -d collabsphere -c "SELECT version();" 2>nul || echo Cannot connect to database
echo.

echo === Suggested Fixes ===
echo.
echo If container is unhealthy, try these in order:
echo.
echo Fix 1: Restart the container
echo   docker-compose restart postgres
echo.
echo Fix 2: Stop all services and remove volumes (WARNING: deletes data)
echo   docker-compose down -v
echo   docker-compose up -d postgres
echo.
echo Fix 3: Check Docker resources
echo   docker stats collabsphere-postgres
echo.
echo Fix 4: Remove only postgres container and volume
echo   docker-compose stop postgres
echo   docker-compose rm -f postgres
echo   docker volume rm collabsphere_postgres-data
echo   docker-compose up -d postgres
echo.
echo Fix 5: Check if port 5434 is already in use
echo   netstat -ano | findstr :5434
echo   (If in use, change port in docker-compose.yml)
echo.
pause
