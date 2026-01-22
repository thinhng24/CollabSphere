# 🚀 Getting Started with CollabSphere

## Quick Start (5 minutes)

### Option 1: Run with Docker (Recommended)

1. **Clone and navigate to project**
```bash
cd CollabSphere
```

2. **Copy environment file**
```bash
cp .env.example .env
```

3. **Start all services**
```bash
# Windows
scripts\setup.bat

# Linux/Mac
chmod +x scripts/setup.sh
./scripts/setup.sh
```

4. **Access the services**
- AuthService Swagger: http://localhost:5001
- API Gateway: http://localhost:5000
- RabbitMQ Management: http://localhost:15672 (admin/admin123)

### Option 2: Run Locally (Development)

**Prerequisites:**
- .NET 8.0 SDK
- PostgreSQL 16
- Redis
- Node.js 18+

**Steps:**

1. **Start infrastructure**
```bash
docker-compose up postgres-auth redis rabbitmq -d
```

2. **Run AuthService**
```bash
cd services/AuthService/AuthService.API
dotnet ef migrations add InitialCreate --project ../AuthService.Infrastructure
dotnet ef database update --project ../AuthService.Infrastructure
dotnet run
```

3. **Access Swagger**
```
http://localhost:5001
```

## Test the API

### 1. Login with default admin account
```bash
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@collabsphere.com",
    "password": "Admin@123"
  }'
```

**Response:**
```json
{
  "isSuccess": true,
  "data": {
    "accessToken": "eyJhbGc...",
    "refreshToken": "abc123...",
    "user": {
      "id": "00000000-0000-0000-0000-000000000001",
      "email": "admin@collabsphere.com",
      "fullName": "System Administrator",
      "role": 1,
      "isActive": true
    }
  }
}
```

### 2. Register a new user
```bash
curl -X POST http://localhost:5001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "lecturer@example.com",
    "password": "Password@123",
    "fullName": "John Lecturer",
    "phoneNumber": "1234567890",
    "role": 4
  }'
```

### 3. Get all users (requires admin token)
```bash
curl -X GET http://localhost:5001/api/users \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Project Structure

```
CollabSphere/
├── gateway/                    # API Gateway (Ocelot) ✅
├── shared/                     # Shared libraries ✅
│   ├── SharedKernel/
│   └── EventBus/
├── services/
│   ├── AuthService/           # ✅ COMPLETE - Use as reference
│   ├── AcademicService/       # 📝 To implement (Member 2)
│   ├── ProjectService/        # 📝 To implement (Member 3)
│   ├── TeamService/           # 📝 To implement (Member 4)
│   ├── CommunicationService/  # 📝 To implement (Member 5)
│   └── RealtimeService/       # 📝 To implement (Member 6)
└── frontend/                   # 📝 React app (To implement)
```

## What's Included

### ✅ Ready to Use
1. **Complete AuthService**
   - User registration & login
   - JWT authentication
   - Role-based authorization
   - User management APIs
   - Swagger documentation

2. **Infrastructure**
   - Docker Compose setup
   - PostgreSQL databases (6)
   - Redis for caching
   - RabbitMQ for messaging
   - API Gateway with routing

3. **Shared Libraries**
   - SharedKernel (common models, interfaces)
   - EventBus (inter-service communication)

4. **Documentation**
   - README.md - Complete overview
   - IMPLEMENTATION_GUIDE.md - Step-by-step coding guide
   - PROJECT_SUMMARY.md - Project details
   - QUICK_REFERENCE.md - Commands & troubleshooting
   - TODO.md - Progress tracker

### 📝 To Implement
- 5 remaining microservices (Members 2-6)
- React frontend
- Integration tests
- Deployment scripts

## Next Steps for Team

### For Member 1 (AuthService - Complete!)
✅ Your service is done! Help others if needed.

### For Members 2-6
1. **Study AuthService structure**
   ```bash
   cd services/AuthService
   # Review the 4-layer architecture
   ```

2. **Copy the pattern**
   - Use AuthService as template
   - Adapt for your domain (subjects, projects, teams, etc.)
   - Follow same Clean Architecture

3. **Implement your service**
   - Create entities
   - Create DTOs
   - Implement services
   - Create controllers
   - Add to docker-compose.yml

4. **Reference materials**
   - `IMPLEMENTATION_GUIDE.md` - Has code examples for all services
   - `services/AuthService/README.md` - Detailed AuthService docs
   - `QUICK_REFERENCE.md` - Quick commands

## Common Commands

### Docker
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f auth-service

# Stop all services
docker-compose down

# Rebuild and start
docker-compose up --build
```

### .NET
```bash
# Restore packages
dotnet restore

# Build
dotnet build

# Run
dotnet run

# Create migration
dotnet ef migrations add MigrationName --project Infrastructure

# Update database
dotnet ef database update --project Infrastructure
```

### Testing
```bash
# Run tests
dotnet test

# With coverage
dotnet test /p:CollectCoverage=true
```

## Troubleshooting

### Port already in use
```bash
# Windows
netstat -ano | findstr :5001
taskkill /PID <PID> /F

# Linux/Mac
lsof -i :5001
kill -9 <PID>
```

### Database connection failed
```bash
# Check PostgreSQL is running
docker ps | grep postgres

# Restart PostgreSQL
docker restart collabsphere-postgres-auth
```

### Cannot build Docker image
```bash
# Clean Docker cache
docker system prune -a

# Rebuild
docker-compose build --no-cache
```

## Resources

- **Main README**: Complete project overview
- **Implementation Guide**: Step-by-step coding instructions
- **Quick Reference**: Commands and API endpoints
- **AuthService README**: Detailed service documentation

## Support

- Check documentation files first
- Review AuthService code as reference
- Create issues for bugs
- Ask team members for help

## Default Credentials

**Admin Account:**
- Email: `admin@collabsphere.com`
- Password: `Admin@123`
- Role: Admin

## API Endpoints

### AuthService (http://localhost:5001)
- POST `/api/auth/register` - Register
- POST `/api/auth/login` - Login
- POST `/api/auth/refresh` - Refresh token
- POST `/api/auth/logout` - Logout
- GET `/api/users` - Get all users (Admin)
- GET `/api/users/{id}` - Get user by ID
- PUT `/api/users/{id}` - Update user
- DELETE `/api/users/{id}` - Deactivate user (Admin)

### API Gateway (http://localhost:5000)
All services accessible through gateway with `/api/` prefix

## Success Criteria

✅ AuthService running and accessible
✅ Can login with admin account
✅ Can register new users
✅ Swagger UI working
✅ Database migrations applied
✅ Docker containers healthy

---

**Ready to start? Run `docker-compose up` and access http://localhost:5001** 🚀
