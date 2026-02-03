#!/bin/bash

echo "=== Gateway Service Diagnostics ==="
echo ""

echo "[1/8] Checking Docker daemon..."
if docker info >/dev/null 2>&1; then
    echo "✓ OK: Docker is running"
else
    echo "✗ ERROR: Docker is not running!"
    echo "Please start Docker and try again."
    exit 1
fi
echo ""

echo "[2/8] Checking all container status..."
docker compose ps
echo ""

echo "[3/8] Checking gateway container specifically..."
docker ps -a | grep gateway
echo ""

echo "[4/8] Checking gateway container health..."
docker inspect collabsphere-gateway --format="Status: {{.State.Status}} | Health: {{.State.Health.Status}}" 2>/dev/null || echo "Container not found or no health check"
echo ""

echo "[5/8] Checking port configuration..."
docker port collabsphere-gateway 2>/dev/null || echo "Container not running or no port mapping"
echo ""

echo "[6/8] Checking dependency services (PostgreSQL, Redis)..."
docker inspect collabsphere-postgres --format="Postgres Health: {{.State.Health.Status}}" 2>/dev/null || echo "PostgreSQL container not found"
docker inspect collabsphere-redis --format="Redis Health: {{.State.Health.Status}}" 2>/dev/null || echo "Redis container not found"
echo ""

echo "[7/8] Gateway container logs (last 30 lines)..."
echo "================================================"
docker logs --tail 30 collabsphere-gateway 2>/dev/null || echo "Cannot read logs - container may not exist or not started"
echo "================================================"
echo ""

echo "[8/8] Checking what ports are actually in use..."
if command -v lsof &> /dev/null; then
    lsof -i :5000,:5001,:8080 | grep LISTEN
elif command -v netstat &> /dev/null; then
    netstat -tuln | grep -E ":(5000|5001|8080)"
elif command -v ss &> /dev/null; then
    ss -tuln | grep -E ":(5000|5001|8080)"
fi
echo ""

echo "=== Diagnosis Complete ==="
echo ""

# Provide recommendations based on container state
GATEWAY_STATE=$(docker inspect collabsphere-gateway --format="{{.State.Status}}" 2>/dev/null)

if [ -z "$GATEWAY_STATE" ]; then
    echo "ISSUE: Gateway container does not exist"
    echo ""
    echo "SOLUTION: Build and start the container"
    echo "  docker compose up -d --build gateway"
elif [ "$GATEWAY_STATE" = "exited" ]; then
    echo "ISSUE: Gateway container exited"
    echo ""
    echo "SOLUTION: Check logs above for errors, then try:"
    echo "  docker compose restart gateway"
    echo "  OR"
    echo "  docker compose up -d gateway"
elif [ "$GATEWAY_STATE" = "running" ]; then
    echo "✓ STATUS: Gateway container is running"
    echo ""
    echo "If still cannot connect, check:"
    echo "1. Check logs above for binding errors"
    echo "2. Verify port mapping with: docker port collabsphere-gateway"
    echo "3. Check if dependencies are healthy"
    echo "4. Wait 10-20 seconds for startup"
    echo ""
    echo "Try accessing:"
    echo "  http://localhost:5001"
    echo "  http://localhost:5000"
fi
echo ""

echo "Run this command to see real-time logs:"
echo "  docker logs -f collabsphere-gateway"
echo ""
