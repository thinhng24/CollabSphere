#!/bin/bash

echo "=== PostgreSQL Health Check Troubleshooting ==="
echo ""

echo "1. Checking container status..."
docker ps -a | grep postgres

echo ""
echo "2. Checking container health..."
docker inspect collabsphere-postgres --format='{{.State.Health.Status}}' 2>/dev/null || echo "Container not found or no health check configured"

echo ""
echo "3. Checking PostgreSQL logs (last 50 lines)..."
docker logs --tail 50 collabsphere-postgres 2>/dev/null || echo "Cannot read logs - container may not exist"

echo ""
echo "4. Checking port availability..."
if command -v netstat &> /dev/null; then
    netstat -an | grep 5434 || echo "Port 5434 is available"
elif command -v ss &> /dev/null; then
    ss -tuln | grep 5434 || echo "Port 5434 is available"
else
    echo "Cannot check port (netstat/ss not available)"
fi

echo ""
echo "5. Testing database connection..."
docker exec collabsphere-postgres psql -U postgres -d collabsphere -c "SELECT version();" 2>/dev/null || echo "Cannot connect to database"

echo ""
echo "=== Suggested Fixes ==="
echo ""
echo "If container is unhealthy, try these in order:"
echo ""
echo "Fix 1: Restart the container"
echo "  docker-compose restart postgres"
echo ""
echo "Fix 2: Stop all services and remove volumes (WARNING: deletes data)"
echo "  docker-compose down -v"
echo "  docker-compose up -d postgres"
echo ""
echo "Fix 3: Check Docker resources"
echo "  docker stats collabsphere-postgres"
echo ""
echo "Fix 4: Remove only postgres container and volume"
echo "  docker-compose stop postgres"
echo "  docker-compose rm -f postgres"
echo "  docker volume rm collabsphere_postgres-data"
echo "  docker-compose up -d postgres"
echo ""
echo "Fix 5: Check Docker daemon logs"
echo "  docker logs --since 10m collabsphere-postgres"
