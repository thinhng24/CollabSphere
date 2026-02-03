#!/bin/bash

echo "=== Docker Network Cleanup ==="
echo ""
echo "This script will fix the 'Network still in use' error."
echo ""

echo "Step 1: Listing containers using the network..."
docker network inspect collabsphere_collabsphere-network -f "{{range .Containers}}{{.Name}} {{end}}" 2>/dev/null
echo ""

echo "Step 2: Stopping all containers..."
docker-compose down
echo ""

echo "Step 3: Finding and removing orphan containers..."
docker compose down --remove-orphans
echo ""

echo "Step 4: Force removing any remaining containers..."
for container in $(docker ps -aq --filter "network=collabsphere_collabsphere-network"); do
    echo "Removing container $container"
    docker rm -f "$container"
done
echo ""

echo "Step 5: Removing the network..."
docker network rm collabsphere_collabsphere-network 2>/dev/null
echo ""

echo "Step 6: Verifying network is removed..."
if docker network ls | grep -q collabsphere; then
    echo "Network still exists, trying prune..."
    docker network prune -f
else
    echo "Network successfully removed!"
fi
echo ""

echo "Step 7: Restarting services..."
docker-compose up -d
echo ""

echo "=== Cleanup Complete ==="
echo ""
echo "Check status with: docker-compose ps"
echo "Check networks with: docker network ls"
echo ""
