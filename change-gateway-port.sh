#!/bin/bash

echo "=== Change Gateway Port ==="
echo ""
echo "Current gateway port: 5000"
echo ""
echo "Recommended alternative ports:"
echo "  1. Port 5001 (recommended)"
echo "  2. Port 8000"
echo "  3. Port 3001"
echo "  4. Custom port"
echo ""

read -p "Select option (1-4): " choice

case $choice in
    1) newport=5001 ;;
    2) newport=8000 ;;
    3) newport=3001 ;;
    4) read -p "Enter custom port number: " newport ;;
    *) echo "Invalid choice"; exit 1 ;;
esac

echo ""
echo "Changing gateway port from 5000 to $newport..."
echo ""

# Backup original file
cp docker-compose.yml "docker-compose.yml.backup.$(date +%Y%m%d_%H%M%S)"

# Change the port using sed
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    sed -i '' "s/\"5000:8080\"/\"$newport:8080\"/g" docker-compose.yml
else
    # Linux
    sed -i "s/\"5000:8080\"/\"$newport:8080\"/g" docker-compose.yml
fi

echo ""
echo "Port changed successfully!"
echo ""
echo "Backup saved as: docker-compose.yml.backup.*"
echo ""
echo "Now restart services:"
echo "  docker compose down"
echo "  docker compose up -d"
echo ""
echo "Gateway will be available at: http://localhost:$newport"
echo ""
echo "IMPORTANT: Update frontend VITE_API_URL to use port $newport"
echo "  File: frontend/collabsphere-web/.env"
echo "  Change: VITE_API_URL=http://localhost:$newport/api"
echo ""
