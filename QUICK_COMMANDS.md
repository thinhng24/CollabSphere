# Quick Docker Commands Reference

## Common Issues - Quick Fixes

### Port Already Allocated (5000)
```bash
# Windows - Check and kill process
.\check-port.bat

# Linux/Mac - Check and kill process
./check-port.sh

# Or change to different port
# Windows
.\change-gateway-port.bat

# Linux/Mac
./change-gateway-port.sh
```

### Network Still in Use
```bash
# Windows
.\fix-network.bat

# Linux/Mac
./fix-network.sh
```

### PostgreSQL Unhealthy
```bash
# Windows
.\fix-postgres.bat

# Linux/Mac
./fix-postgres.sh
```

### Complete Fresh Start
```bash
# Stop everything and remove volumes (deletes data!)
docker compose down -v --remove-orphans

# Remove dangling networks
docker network prune -f

# Start fresh
docker compose up -d
```

## Daily Operations

### Start/Stop Services
```bash
# Start all services
docker compose up -d

# Stop all services (keeps data)
docker compose down

# Stop and remove volumes (deletes data!)
docker compose down -v
```

### View Status and Logs
```bash
# Check status of all containers
docker compose ps

# View logs for all services
docker compose logs -f

# View logs for specific service
docker logs -f collabsphere-postgres
docker logs -f collabsphere-team-service
```

### Restart Services
```bash
# Restart specific service
docker compose restart postgres
docker compose restart team-service

# Restart all services
docker compose restart
```

### Rebuild Services
```bash
# Rebuild specific service
docker compose up -d --build team-service

# Rebuild all services
docker compose up -d --build
```

## Health Checks

### Check Container Health
```bash
# Check all containers
docker compose ps

# Check specific container health
docker inspect collabsphere-postgres --format='{{.State.Health.Status}}'
docker inspect collabsphere-team-service --format='{{.State.Health.Status}}'
```

### Test Database Connection
```bash
# Connect to PostgreSQL
docker exec -it collabsphere-postgres psql -U postgres -d collabsphere

# Run a test query
docker exec collabsphere-postgres psql -U postgres -d collabsphere -c "SELECT version();"
```

### Test Redis
```bash
# Test Redis connection
docker exec collabsphere-redis redis-cli ping
# Should return: PONG
```

### Test RabbitMQ
```bash
# Check RabbitMQ status
docker exec collabsphere-rabbitmq rabbitmq-diagnostics ping
# Should return: Ping succeeded
```

## Cleanup Commands

### Remove Stopped Containers
```bash
docker container prune -f
```

### Remove Unused Networks
```bash
docker network prune -f
```

### Remove Unused Volumes
```bash
# WARNING: This removes ALL unused volumes
docker volume prune -f
```

### Remove Unused Images
```bash
docker image prune -f
```

### Complete System Cleanup
```bash
# WARNING: Removes all unused resources
docker system prune -a -f --volumes
```

## Debugging

### Enter Container Shell
```bash
# PostgreSQL
docker exec -it collabsphere-postgres sh

# Team Service (or any .NET service)
docker exec -it collabsphere-team-service sh

# Gateway
docker exec -it collabsphere-gateway sh
```

### Check Resource Usage
```bash
# All containers
docker stats

# Specific container
docker stats collabsphere-postgres
```

### Inspect Container
```bash
# Full inspection
docker inspect collabsphere-postgres

# Specific info
docker inspect collabsphere-postgres --format='{{.State.Status}}'
docker inspect collabsphere-postgres --format='{{.NetworkSettings.Networks}}'
```

### Check Networks
```bash
# List all networks
docker network ls

# Inspect specific network
docker network inspect collabsphere_collabsphere-network

# See which containers are connected
docker network inspect collabsphere_collabsphere-network -f '{{range .Containers}}{{.Name}} {{end}}'
```

### Check Volumes
```bash
# List all volumes
docker volume ls

# Inspect specific volume
docker volume inspect collabsphere_postgres-data

# See volume size
docker system df -v
```

## Service-Specific Commands

### PostgreSQL
```bash
# View logs
docker logs -f collabsphere-postgres

# Connect to database
docker exec -it collabsphere-postgres psql -U postgres -d collabsphere

# Create backup
docker exec collabsphere-postgres pg_dump -U postgres collabsphere > backup.sql

# Restore backup
cat backup.sql | docker exec -i collabsphere-postgres psql -U postgres -d collabsphere
```

### Team Service
```bash
# View logs
docker logs -f collabsphere-team-service

# Restart
docker compose restart team-service

# Rebuild and restart
docker compose up -d --build team-service

# Check health endpoint
curl http://localhost:5000/api/teams/health
```

### Gateway
```bash
# View logs
docker logs -f collabsphere-gateway

# Restart
docker compose restart gateway

# Check routes
curl http://localhost:5000/api
```

## Troubleshooting Workflows

### Service Won't Start
```bash
# 1. Check logs
docker logs collabsphere-team-service

# 2. Check dependencies are healthy
docker compose ps

# 3. Restart dependencies first
docker compose restart postgres redis rabbitmq

# 4. Wait for health checks
sleep 30

# 5. Restart the service
docker compose restart team-service
```

### Database Connection Issues
```bash
# 1. Check PostgreSQL is running
docker ps | grep postgres

# 2. Check PostgreSQL is healthy
docker inspect collabsphere-postgres --format='{{.State.Health.Status}}'

# 3. Test connection
docker exec collabsphere-postgres psql -U postgres -c "SELECT 1;"

# 4. Check service can reach PostgreSQL
docker exec collabsphere-team-service ping postgres

# 5. Verify connection string in logs
docker logs collabsphere-team-service | grep -i connection
```

### Port Already in Use
```bash
# Check which process is using the port
# Windows
netstat -ano | findstr :5000

# Linux/Mac
lsof -i :5000

# Kill the process or change port in docker-compose.yml
```

### Out of Disk Space
```bash
# Check Docker disk usage
docker system df

# Clean up
docker system prune -a -f --volumes

# Check again
docker system df
```

## Development Workflow

### After Code Changes
```bash
# Rebuild and restart affected service
docker compose up -d --build team-service

# Watch logs
docker logs -f collabsphere-team-service
```

### Reset Everything
```bash
# Complete reset (deletes all data)
docker compose down -v --remove-orphans
docker system prune -a -f
docker compose up -d

# Wait for services to be healthy
sleep 60
docker compose ps
```

### Apply Database Migrations
```bash
# Migrations run automatically on service startup
# To force re-run, restart the service
docker compose restart team-service

# Check migration logs
docker logs collabsphere-team-service | grep -i migration
```

## Performance Optimization

### Check Resource Limits
```bash
# Check current usage
docker stats --no-stream

# Update docker-compose.yml to add limits:
# deploy:
#   resources:
#     limits:
#       cpus: '2.0'
#       memory: 2G
```

### Check Image Sizes
```bash
# List images with sizes
docker images

# Check specific service image
docker images | grep team-service
```

### Optimize Builds
```bash
# Build with no cache
docker compose build --no-cache team-service

# Pull latest base images
docker compose pull
```

## Useful Aliases (Optional)

Add to your `.bashrc` or `.zshrc`:

```bash
# Docker Compose shortcuts
alias dcu='docker compose up -d'
alias dcd='docker compose down'
alias dcl='docker compose logs -f'
alias dcr='docker compose restart'
alias dcp='docker compose ps'

# Docker shortcuts
alias dps='docker ps'
alias dlogs='docker logs -f'
alias dexec='docker exec -it'
alias dstats='docker stats'

# Cleanup shortcuts
alias dclean='docker system prune -f'
alias dcleanall='docker system prune -a -f --volumes'
```

For Windows PowerShell, add to your profile:

```powershell
# Docker Compose shortcuts
function dcu { docker compose up -d }
function dcd { docker compose down }
function dcl { docker compose logs -f }
function dcr { docker compose restart }
function dcp { docker compose ps }
```
