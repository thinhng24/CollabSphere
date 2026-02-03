# Port Conflict Resolution Guide

## Understanding Port Conflicts

When Docker tries to bind a container port to your host machine, it may fail if another process is already using that port. CollabSphere uses several ports:

| Service | Host Port | Container Port | Purpose |
|---------|-----------|----------------|---------|
| Gateway | 5000 | 8080 | API Gateway (main entry point) |
| Frontend | 3000 | 80 | React web application |
| PostgreSQL | 5434 | 5432 | Database |
| Redis | 6379 | 6379 | Cache |
| RabbitMQ | 5672, 15672 | 5672, 15672 | Message queue |
| PgAdmin | 5050 | 80 | Database admin UI |

## Port 5000 Conflict (Most Common)

### Why Port 5000?

Port 5000 is commonly used by:
- **macOS AirPlay Receiver** (macOS 12+)
- **ASP.NET Core Kestrel** development server
- **Flask** default port
- **Other Docker containers**

### Solution 1: Kill the Process (Quick)

#### Windows
```bash
# Run automated script
.\check-port.bat

# Or manual:
# Find the process
netstat -ano | findstr :5000

# Kill it (replace [PID] with actual PID)
taskkill /PID [PID] /F

# Restart Docker services
docker compose up -d
```

#### Linux/Mac
```bash
# Run automated script
chmod +x check-port.sh
./check-port.sh

# Or manual:
# Find the process
lsof -i :5000

# Kill it (replace [PID] with actual PID)
kill -9 [PID]

# Restart Docker services
docker compose up -d
```

### Solution 2: Change the Port (Recommended)

If you need the other service to keep running on port 5000:

#### Automated
```bash
# Windows
.\change-gateway-port.bat

# Linux/Mac
chmod +x change-gateway-port.sh
./change-gateway-port.sh
```

#### Manual

1. **Edit docker-compose.yml:**
```yaml
# Find the gateway service (around line 78)
gateway:
  ports:
    - "5001:8080"  # Changed from 5000 to 5001
```

2. **Update frontend configuration:**
```bash
# Edit frontend/collabsphere-web/.env
VITE_API_URL=http://localhost:5001/api
```

3. **Update CLAUDE.md documentation:**
```bash
# Edit CLAUDE.md
# Update the "Service Ports" section:
- **API Gateway**: `http://localhost:5001`  # was 5000
```

4. **Restart services:**
```bash
docker compose down
docker compose up -d
```

5. **Access gateway at new URL:**
```bash
http://localhost:5001/api
```

### Solution 3: macOS - Disable AirPlay Receiver

If you're on macOS and don't use AirPlay:

1. Open **System Preferences**
2. Click **Sharing**
3. Uncheck **AirPlay Receiver**
4. Port 5000 is now available
5. Restart Docker services:
```bash
docker compose up -d
```

## Other Port Conflicts

### Frontend Port 3000

If port 3000 is in use (common with React/Node.js dev servers):

**Edit docker-compose.yml:**
```yaml
frontend:
  ports:
    - "3001:80"  # Changed from 3000
```

### PostgreSQL Port 5434

If port 5434 is in use:

**Edit docker-compose.yml:**
```yaml
postgres:
  ports:
    - "5435:5432"  # Changed from 5434
```

**Update all service connection strings:**
```yaml
# In each service's environment
- ConnectionStrings__DefaultConnection=Host=postgres;Port=5432;...
# Note: Container-to-container uses internal port 5432, not host port
```

### Redis Port 6379

**Edit docker-compose.yml:**
```yaml
redis:
  ports:
    - "6380:6379"  # Changed from 6379
```

### RabbitMQ Ports 5672, 15672

**Edit docker-compose.yml:**
```yaml
rabbitmq:
  ports:
    - "5673:5672"    # AMQP port
    - "15673:15672"  # Management UI
```

## Checking All Ports

### Windows
```bash
# Check all CollabSphere ports
netstat -ano | findstr "5000 3000 5434 6379 5672 15672 5050"
```

### Linux/Mac
```bash
# Check all CollabSphere ports
lsof -i :5000,:3000,:5434,:6379,:5672,:15672,:5050
```

## Best Practices

### 1. Check Before Starting
```bash
# Run this before docker compose up
# Windows
.\check-port.bat

# Linux/Mac
./check-port.sh
```

### 2. Use Non-Standard Ports for Local Development

Consider using ports above 5000 to avoid conflicts:
- Gateway: 5001 instead of 5000
- Frontend: 3001 instead of 3000
- PostgreSQL: 5435 instead of 5434

### 3. Stop Previous Instances
```bash
# Always clean up before starting
docker compose down
docker container prune -f
docker compose up -d
```

### 4. Use Host Network Mode (Linux Only)

For Linux systems, you can use host networking to avoid port mapping:
```yaml
gateway:
  network_mode: "host"
  # Remove ports section
```

**Note:** This doesn't work on Windows/macOS due to Docker Desktop limitations.

## Troubleshooting Workflow

1. **Identify the conflict:**
```bash
docker compose up -d
# Look for "port is already allocated" error
```

2. **Check what's using the port:**
```bash
# Windows
netstat -ano | findstr :[PORT]

# Linux/Mac
lsof -i :[PORT]
```

3. **Decide on solution:**
   - **Option A:** Kill the conflicting process (if it's not needed)
   - **Option B:** Change CollabSphere port (if the other service is needed)
   - **Option C:** Change the other service's port

4. **Apply the fix:**
   - Use automated scripts (recommended)
   - Or manually edit docker-compose.yml

5. **Update related configurations:**
   - Frontend .env file
   - Documentation
   - API client code

6. **Restart services:**
```bash
docker compose down
docker compose up -d
```

7. **Verify:**
```bash
docker compose ps
# All services should be "Up" or "Up (healthy)"
```

## Common Scenarios

### Scenario 1: Running Multiple CollabSphere Instances

If you need to run multiple instances (e.g., for testing):

**Instance 1 (ports.env):**
```
GATEWAY_PORT=5000
FRONTEND_PORT=3000
POSTGRES_PORT=5434
```

**Instance 2 (ports-instance2.env):**
```
GATEWAY_PORT=5001
FRONTEND_PORT=3001
POSTGRES_PORT=5435
```

**Use environment variables in docker-compose.yml:**
```yaml
gateway:
  ports:
    - "${GATEWAY_PORT:-5000}:8080"
```

**Start instance 2:**
```bash
export GATEWAY_PORT=5001
export FRONTEND_PORT=3001
export POSTGRES_PORT=5435
docker compose up -d
```

### Scenario 2: Development + Production on Same Machine

**Development:** Use default ports (5000, 3000, 5434)
**Production:** Use different ports (5100, 3100, 5534)

Create `docker-compose.prod.yml` with different ports and run:
```bash
docker compose -f docker-compose.prod.yml up -d
```

### Scenario 3: Port Already in Use by System Service

If a system service uses the port (e.g., Windows SQL Server on 5432):
- Don't kill system services
- Change CollabSphere ports instead
- Document the change in your team

## Prevention

### 1. Document Your Ports

Create a `.env` file:
```bash
# .env
GATEWAY_PORT=5001
FRONTEND_PORT=3001
POSTGRES_PORT=5435
REDIS_PORT=6380
RABBITMQ_PORT=5673
RABBITMQ_MGMT_PORT=15673
PGADMIN_PORT=5051
```

Use in docker-compose.yml:
```yaml
gateway:
  ports:
    - "${GATEWAY_PORT}:8080"
```

### 2. Team Standards

Agree on ports with your team:
- Document in README.md
- Share .env.example
- Update onboarding docs

### 3. Regular Cleanup

```bash
# Weekly cleanup
docker compose down
docker system prune -f
docker compose up -d
```

## Need Help?

If port conflicts persist:
1. Check logs: `docker compose logs gateway`
2. Verify no zombie processes: `docker ps -a`
3. Check system services: `services.msc` (Windows) or `systemctl` (Linux)
4. Consult DOCKER_TROUBLESHOOTING.md
5. Use QUICK_COMMANDS.md reference

## Summary

**Quick fixes:**
- `.\check-port.bat` or `./check-port.sh` - Identify and kill process
- `.\change-gateway-port.bat` or `./change-gateway-port.sh` - Change port
- `docker compose down && docker compose up -d` - Restart services

**Best practice:** Use non-standard ports (5001+ instead of 5000) to avoid common conflicts.
