# Gateway Not Responding Troubleshooting Guide

## Symptom
```
curl: Unable to connect to the remote server
http://localhost:5001
```

## Automated Diagnosis

Run the diagnostic script first:

```bash
# Windows
.\diagnose-gateway.bat

# Linux/Mac
chmod +x diagnose-gateway.sh
./diagnose-gateway.sh
```

This will check:
- Docker daemon status
- Container status
- Health checks
- Port mappings
- Dependencies
- Recent logs

## Common Issues and Fixes

### Issue 1: Gateway Container Not Started

**Symptoms:**
- Container doesn't appear in `docker compose ps`
- `docker inspect collabsphere-gateway` returns "not found"

**Fix:**
```bash
# Start all services
docker compose up -d

# Or start just gateway
docker compose up -d gateway

# Check status
docker compose ps
```

### Issue 2: Gateway Container Exited

**Symptoms:**
- Container status shows "Exited (1)" or similar
- Container exists but not running

**Check logs:**
```bash
docker logs collabsphere-gateway
```

**Common causes:**

#### A. Dependencies Not Healthy

**Symptom in logs:**
```
Waiting for dependencies...
```

**Fix:**
```bash
# Check dependency health
docker compose ps

# Restart dependencies
docker compose restart postgres redis

# Wait for them to be healthy
sleep 60

# Restart gateway
docker compose restart gateway
```

#### B. Port Binding Error

**Symptom in logs:**
```
Failed to bind to address http://+:8080
Port already in use
```

**Fix:**
```bash
# Check if another container is using the port
docker ps

# Stop all containers
docker compose down

# Start fresh
docker compose up -d
```

#### C. Configuration Error

**Symptom in logs:**
```
Missing configuration
Invalid JWT secret
```

**Fix:**
Check docker-compose.yml environment variables (lines 85-90):
```yaml
environment:
  - ASPNETCORE_ENVIRONMENT=Development
  - ASPNETCORE_URLS=http://+:8080
  - JwtSettings__Secret=CollabSphere-Super-Secret-Key-For-JWT-Token-Generation-Min-32-Chars
  - JwtSettings__Issuer=CollabSphere
  - JwtSettings__Audience=CollabSphereUsers
```

#### D. Build Error

**Symptom in logs:**
```
Runtime error
Assembly not found
```

**Fix:**
```bash
# Rebuild the container
docker compose build gateway

# Start it
docker compose up -d gateway
```

### Issue 3: Gateway Running But Not Responding

**Symptoms:**
- Container status shows "Up"
- But curl/browser can't connect

**Check port mapping:**
```bash
docker port collabsphere-gateway
# Should show: 8080/tcp -> 0.0.0.0:5001
```

**Check if gateway is listening inside container:**
```bash
# Enter the container
docker exec -it collabsphere-gateway sh

# Check if process is listening (inside container)
netstat -tuln | grep 8080
# or
curl http://localhost:8080
```

**Fix A: Port mismatch**
If gateway is listening on a different port, update docker-compose.yml:
```yaml
ports:
  - "5001:8080"  # Ensure this matches ASPNETCORE_URLS
environment:
  - ASPNETCORE_URLS=http://+:8080  # Must match internal port
```

**Fix B: Still starting up**
ASP.NET Core can take 10-30 seconds to start:
```bash
# Watch logs until you see "Application started"
docker logs -f collabsphere-gateway

# Look for:
# Now listening on: http://[::]:8080
# Application started
```

### Issue 4: Dependencies Unhealthy

**Symptoms:**
- Gateway keeps restarting
- Logs show connection errors to PostgreSQL or Redis

**Check dependencies:**
```bash
docker compose ps

# Check specific health
docker inspect collabsphere-postgres --format='{{.State.Health.Status}}'
docker inspect collabsphere-redis --format='{{.State.Health.Status}}'
```

**Fix:**
```bash
# Use the startup script that ensures proper order
# Windows
.\start-services.bat

# Linux/Mac
./start-services.sh
```

Or manually:
```bash
# Stop everything
docker compose down

# Start infrastructure first
docker compose up -d postgres redis rabbitmq

# Wait for healthy (60 seconds)
sleep 60

# Verify they're healthy
docker compose ps

# Then start services
docker compose up -d
```

### Issue 5: Network Issues

**Symptoms:**
- Container running but isolated
- Can't reach other containers

**Check network:**
```bash
# List networks
docker network ls

# Inspect CollabSphere network
docker network inspect collabsphere_collabsphere-network

# Check which containers are connected
docker network inspect collabsphere_collabsphere-network -f '{{range .Containers}}{{.Name}} {{end}}'
```

**Fix:**
```bash
# Recreate network
docker compose down
docker network prune -f
docker compose up -d
```

### Issue 6: Wrong Port

**Symptoms:**
- Testing port 5001 but gateway is on 5000 (or vice versa)

**Check docker-compose.yml:**
```bash
# Windows
findstr /n "5000\|5001" docker-compose.yml

# Linux/Mac
grep -n "5000\|5001" docker-compose.yml
```

**Check actual port:**
```bash
docker port collabsphere-gateway
```

**Fix:**
Update your curl command to use the correct port:
```bash
# If gateway is on 5000
curl http://localhost:5000

# If gateway is on 5001
curl http://localhost:5001
```

## Step-by-Step Troubleshooting Workflow

### Step 1: Check Docker

```bash
docker info
# If error: Start Docker Desktop
```

### Step 2: Check Containers

```bash
docker compose ps

# Expected output:
# NAME                          STATUS
# collabsphere-gateway          Up
# collabsphere-postgres         Up (healthy)
# collabsphere-redis            Up (healthy)
# ...
```

### Step 3: Check Gateway Logs

```bash
docker logs --tail 50 collabsphere-gateway

# Look for:
# ✓ "Application started"
# ✓ "Now listening on: http://[::]:8080"
# ✗ Exceptions or errors
```

### Step 4: Check Dependencies

```bash
# PostgreSQL
docker inspect collabsphere-postgres --format='{{.State.Health.Status}}'
# Should be: healthy

# Redis
docker inspect collabsphere-redis --format='{{.State.Health.Status}}'
# Should be: healthy
```

### Step 5: Check Port

```bash
docker port collabsphere-gateway
# Should show: 8080/tcp -> 0.0.0.0:5001
```

### Step 6: Test Connection

```bash
# From host
curl http://localhost:5001

# From inside container
docker exec collabsphere-gateway curl http://localhost:8080
```

### Step 7: Check Firewall

```bash
# Windows: Check if Windows Firewall is blocking
# Settings → Windows Security → Firewall & network protection

# Linux: Check iptables
sudo iptables -L
```

## Quick Fixes (Try in Order)

### Fix 1: Simple Restart
```bash
docker compose restart gateway
sleep 20
curl http://localhost:5001
```

### Fix 2: Full Restart
```bash
docker compose down
docker compose up -d
sleep 60
curl http://localhost:5001
```

### Fix 3: Rebuild
```bash
docker compose build gateway
docker compose up -d gateway
sleep 30
curl http://localhost:5001
```

### Fix 4: Clean Start (Preserves Data)
```bash
docker compose down
docker network prune -f
docker compose up -d
sleep 60
curl http://localhost:5001
```

### Fix 5: Nuclear Option (Deletes Data)
```bash
docker compose down -v
docker system prune -a -f
docker compose up -d --build
sleep 90
curl http://localhost:5001
```

## Automated Startup (Recommended)

Use the startup script to ensure proper initialization:

```bash
# Windows
.\start-services.bat

# Linux/Mac
chmod +x start-services.sh
./start-services.sh
```

This script:
1. Stops existing containers
2. Starts infrastructure (PostgreSQL, Redis, RabbitMQ)
3. Waits for them to be healthy
4. Starts backend services and gateway
5. Tests connectivity
6. Shows status

## Expected Logs (Healthy Gateway)

When gateway is working correctly, logs should show:

```
info: Microsoft.Hosting.Lifetime[0]
      Now listening on: http://[::]:8080
info: Microsoft.Hosting.Lifetime[0]
      Application started. Press Ctrl+C to shut down.
info: Microsoft.Hosting.Lifetime[0]
      Hosting environment: Development
```

## Verification Checklist

- [ ] Docker Desktop is running
- [ ] `docker compose ps` shows all containers "Up"
- [ ] PostgreSQL shows "Up (healthy)"
- [ ] Redis shows "Up (healthy)"
- [ ] Gateway shows "Up"
- [ ] `docker port collabsphere-gateway` shows correct mapping
- [ ] Gateway logs show "Application started"
- [ ] `curl http://localhost:5001` succeeds

## Still Not Working?

If you've tried everything above:

1. **Check system requirements:**
   - Docker Desktop 20.10+
   - 8GB RAM available
   - 20GB free disk space

2. **Check Docker resources:**
   - Docker Desktop → Settings → Resources
   - Increase memory to 6GB+
   - Increase CPUs to 4+

3. **Collect diagnostic info:**
```bash
# Windows
.\diagnose-gateway.bat > gateway-diagnostics.txt

# Linux/Mac
./diagnose-gateway.sh > gateway-diagnostics.txt
```

4. **Check other guides:**
   - `DOCKER_TROUBLESHOOTING.md`
   - `PORT_CONFLICT_GUIDE.md`
   - `QUICK_COMMANDS.md`

## Common Error Messages

### "Connection refused"
- Gateway not started yet
- Wrong port
- Firewall blocking

### "Connection timeout"
- Gateway not responding
- Network isolated
- Container crashed

### "502 Bad Gateway"
- Gateway started but backend services down
- Check backend service logs

### "404 Not Found"
- Gateway is working!
- But route doesn't exist
- Check Ocelot configuration

## Testing Individual Components

### Test PostgreSQL
```bash
docker exec collabsphere-postgres psql -U postgres -c "SELECT 1;"
```

### Test Redis
```bash
docker exec collabsphere-redis redis-cli ping
# Should return: PONG
```

### Test Gateway Health (if endpoint exists)
```bash
curl http://localhost:5001/health
```

### Test Backend Service
```bash
curl http://localhost:5001/api/projects
# Should return JSON or 401 Unauthorized (means it's working)
```

## Prevention

To avoid these issues:

1. **Always use the startup script**
   ```bash
   ./start-services.bat  # Windows
   ./start-services.sh   # Linux/Mac
   ```

2. **Check status before assuming it's ready**
   ```bash
   docker compose ps
   ```

3. **Wait for health checks**
   - PostgreSQL: 40 seconds
   - Redis: 10 seconds
   - Gateway: 20-30 seconds

4. **Check logs if something seems wrong**
   ```bash
   docker compose logs -f
   ```

5. **Graceful shutdown**
   ```bash
   docker compose down  # Not docker kill
   ```
