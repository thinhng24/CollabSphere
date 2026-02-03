#!/bin/bash

echo "=== Port 5000 Usage Check ==="
echo ""

echo "Checking what is using port 5000..."
if command -v lsof &> /dev/null; then
    lsof -i :5000
elif command -v netstat &> /dev/null; then
    netstat -tulnp | grep :5000
elif command -v ss &> /dev/null; then
    ss -tulnp | grep :5000
else
    echo "No port checking tool found (lsof, netstat, or ss)"
    exit 1
fi
echo ""

echo "=== Options ==="
echo ""
echo "To kill the process:"
if command -v lsof &> /dev/null; then
    PID=$(lsof -ti :5000)
    if [ ! -z "$PID" ]; then
        echo "  Found PID: $PID"
        echo "  Run: kill -9 $PID"
        echo ""
        read -p "Do you want to kill this process? (y/n): " kill_choice
        if [[ "$kill_choice" == "y" || "$kill_choice" == "Y" ]]; then
            kill -9 $PID
            echo "Process killed. Port 5000 should now be free."
            echo "Try starting services again: docker compose up -d"
        fi
    else
        echo "  No process found using port 5000"
    fi
else
    echo "  1. Note the PID from above"
    echo "  2. Run: kill -9 [PID]"
fi
echo ""
echo "Or to change CollabSphere to use a different port:"
echo "  Edit docker-compose.yml and change \"5000:8080\" to \"5001:8080\""
echo ""
