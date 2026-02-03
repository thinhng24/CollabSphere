# Docker Troubleshooting Guide

## Common Docker Compose Issues

### Issue: "Port is already allocated"

**Error Message:**
```
Bind for 0.0.0.0:5000 failed: port is already allocated
```

**Cause:** Another process is already using port 5000. Common culprits:
- Previous Docker container still running
- ASP.NET Core development server
- AirPlay Receiver on macOS
- Another web server or application

**Quick Fix Option 1: Find and Kill the Process**

**Windows:**
```bash
.\check-port.bat
# Follow the prompts to kill the process
```

**Linux/Mac:**
```bash
chmod +x check-port.sh
./check-port.sh
# Follow the prompts to kill the process
```

**Manual:**
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID [PID] /F

# Linux/Mac
lsof -i :5000
kill -9 [PID]
```

**Quick Fix Option 2: Change Gateway Port (Recommended)**

**Windows:**
```bash
.\change-gateway-port.bat
# Follow prompts to select new port
```

**Linux/Mac:**
```bash
chmod +x change-gateway-port.sh
./change-gateway-port.sh
# Follow prompts to select new port
```

**Manual Port Change:**
```yaml
# Edit docker-compose.yml
# Change line 84 from:
    ports:
      - "5000:8080"
# To:
    ports:
      - "5001:8080"  # or any available port
```

**Important:** After changing the port, update frontend configuration:
```bash
# Edit frontend/collabsphere-web/.env
VITE_API_URL=http://localhost:5001/api  # use your new port
```

**macOS Specific - Disable AirPlay Receiver:**
If port 5000 is used by AirPlay:
1. System Preferences → Sharing
2. Uncheck "AirPlay Receiver"

---

## Common Docker Compose Issues

### Issue: "Network still in use"

**Error Message:**
```
! Network collabsphere_collabsphere-network Resource is still in use
```

**Quick Fix:**

**Windows:**
```bash
.\fix-network.bat
```

**Linux/Mac:**
```bash
chmod +x fix-network.sh
./fix-network.sh
```

**Manual Fix:**
```bash
# Stop all containers
docker-compose down

# Remove orphan containers
docker compose down --remove-orphans

# Force remove containers using the network
docker ps -aq --filter "network=collabsphere_collabsphere-network" | xargs docker rm -f

# Remove the network
docker network rm collabsphere_collabsphere-network

# Restart services
docker-compose up -d
```

### Issue: "version attribute is obsolete"

**Error Message:**
```
WARN: the attribute `version` is obsolete, it will be ignored
```

**Fix:** This has been fixed in the latest docker-compose.yml. The obsolete `version: '3.8'` line has been removed. Docker Compose v2+ doesn't require this attribute.

**If you still see this warning:** Update your docker-compose.yml by removing the first line that says `version: '3.8'`.

---

## PostgreSQL Container Unhealthy

### Quick Fix

**Windows:**
```bash
# Run the automated fix script
.\fix-postgres.bat
```

**Linux/Mac:**
```bash
# Make script executable
chmod +x troubleshoot-postgres.sh

# Run troubleshooting script
./troubleshoot-postgres.sh
```

### Manual Troubleshooting Steps

#### Step 1: Check Container Status

```bash
# View all containers
docker-compose ps

# Check specific container
docker ps -a | grep postgres
```

#### Step 2: View Logs

```bash
# View real-time logs
docker logs -f collabsphere-postgres

# View last 50 lines
docker logs --tail 50 collabsphere-postgres
```

#### Step 3: Check Health Status

```bash
# Check health check status
docker inspect collabsphere-postgres --format='{{.State.Health.Status}}'

# View health check logs
docker inspect collabsphere-postgres --format='{{range .State.Health.Log}}{{.Output}}{{end}}'
```

#### Step 4: Test Database Connection

```bash
# Try connecting to the database
docker exec -it collabsphere-postgres psql -U postgres -d collabsphere

# Or run a simple query
docker exec collabsphere-postgres psql -U postgres -d collabsphere -c "SELECT 1;"
```

### Common Issues and Solutions

#### Issue 1: Container Stuck in "starting" State

**Cause:** PostgreSQL is taking too long to initialize.

**Solution:**
```bash
# Wait longer (60-90 seconds) for first-time initialization
# Or check logs for errors
docker logs collabsphere-postgres
```

**Applied Fix in docker-compose.yml:**
- Increased `start_period` to 40s
- Increased `retries` to 10
- Added `shm_size: 128mb` for better performance

#### Issue 2: Port Already in Use

**Cause:** Port 5434 is already occupied by another process.

**Check:**
```bash
# Windows
netstat -ano | findstr :5434

# Linux/Mac
lsof -i :5434
```

**Solution:**
```bash
# Option A: Kill the process using the port
# Windows: taskkill /PID <PID> /F
# Linux: kill -9 <PID>

# Option B: Change port in docker-compose.yml
# Change "5434:5432" to "5435:5432" or another available port
```

#### Issue 3: Corrupted Volume

**Cause:** Previous database volume is corrupted.

**Solution:**
```bash
# Stop all services
docker-compose down

# Remove the volume (WARNING: deletes all data)
docker volume rm collabsphere_postgres-data

# Start fresh
docker-compose up -d
```

#### Issue 4: Insufficient Resources

**Cause:** Docker doesn't have enough memory/CPU.

**Check:**
```bash
docker stats collabsphere-postgres
```

**Solution:**
- Increase Docker Desktop memory limit (Settings → Resources)
- Recommended: At least 4GB RAM for the entire stack

#### Issue 5: Network Issues

**Cause:** Docker network conflicts.

**Solution:**
```bash
# Remove network
docker network rm collabsphere-network

# Recreate services
docker-compose up -d
```

### Complete Reset (Nuclear Option)

**WARNING: This deletes ALL data!**

```bash
# Stop all containers
docker-compose down

# Remove all volumes
docker-compose down -v

# Remove unused resources
docker system prune -a

# Start fresh
docker-compose up -d
```

### Health Check Configuration

The PostgreSQL health check now uses:
- **Test Command:** `pg_isready -U postgres -d collabsphere`
- **Interval:** 10 seconds
- **Timeout:** 10 seconds
- **Retries:** 10 (total wait: up to 100 seconds)
- **Start Period:** 40 seconds (grace period before health checks count)

### After Fixing PostgreSQL

Once PostgreSQL is healthy, start the dependent services:

```bash
# Check if postgres is healthy
docker inspect collabsphere-postgres --format='{{.State.Health.Status}}'

# If healthy, start all services
docker-compose up -d

# Monitor startup
docker-compose logs -f
```

### Verification

```bash
# Check all services are running
docker-compose ps

# Test PostgreSQL connection
docker exec collabsphere-postgres psql -U postgres -d collabsphere -c "SELECT version();"

# Check service logs
docker-compose logs gateway
docker-compose logs project-service
docker-compose logs team-service
```

### Useful Commands

```bash
# View all container statuses
docker-compose ps

# Follow logs for all services
docker-compose logs -f

# Restart a specific service
docker-compose restart postgres

# Rebuild a specific service
docker-compose up -d --build team-service

# Stop all services
docker-compose down

# Stop and remove volumes
docker-compose down -v

# View resource usage
docker stats
```

### Getting Help

If the issue persists:

1. Run the troubleshooting script: `.\troubleshoot-postgres.bat`
2. Capture the output
3. Check the logs: `docker logs collabsphere-postgres`
4. Share the output for further assistance

### Prevention

To avoid future issues:

1. **Graceful Shutdown:** Always use `docker-compose down` instead of `docker kill`
2. **Regular Cleanup:** Run `docker system prune` weekly
3. **Monitor Resources:** Keep an eye on disk space and memory
4. **Backup Volumes:** Use `docker volume` commands to backup important data
