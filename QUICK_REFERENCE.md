# CollabSphere - Quick Reference Guide

## 🚀 Quick Start Commands

### Start Everything
```bash
# Windows
scripts\setup.bat

# Linux/Mac
chmod +x scripts/setup.sh
./scripts/setup.sh
```

### Docker Commands
```bash
# Build and start all services
docker-compose up --build -d

# View logs
docker-compose logs -f [service-name]

# Stop all services
docker-compose down

# Remove everything (including volumes)
docker-compose down -v

# Restart a specific service
docker-compose restart [service-name]
```

### Access Points
- **Frontend:** http://localhost:3000
- **API Gateway:** http://localhost:5000
- **AuthService:** http://localhost:5001
- **AcademicService:** http://localhost:5002
- **ProjectService:** http://localhost:5003
- **TeamService:** http://localhost:5004
- **CommunicationService:** http://localhost:5005
- **RealtimeService:** http://localhost:5006
- **RabbitMQ Management:** http://localhost:15672 (admin/admin123)

## 📁 Project Structure Quick Reference

```
CollabSphere/
├── gateway/                    # API Gateway (Ocelot)
├── shared/
│   ├── SharedKernel/          # Common models, interfaces
│   └── EventBus/              # Event-driven communication
├── services/
│   ├── AuthService/           # Member 1: Auth & Accounts
│   ├── AcademicService/       # Member 2: Subjects/Classes
│   ├── ProjectService/        # Member 3: Projects/Milestones
│   ├── TeamService/           # Member 4: Teams/Workspace
│   ├── CommunicationService/  # Member 5: Chat/Notifications
│   └── RealtimeService/       # Member 6: Video/Whiteboard
└── frontend/
    └── collabsphere-web/      # React Application
```

## 🔧 Development Commands

### .NET Commands
```bash
# Restore packages
dotnet restore

# Build project
dotnet build

# Run project
dotnet run

# Create migration
dotnet ef migrations add MigrationName --project Infrastructure

# Update database
dotnet ef database update --project Infrastructure

# Run tests
dotnet test
```

### React Commands
```bash
# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run build

# Run tests
npm test
```

## 🗄️ Database Quick Reference

### Connection Strings
```
AuthService:        Host=postgres-auth;Port=5432;Database=authdb;Username=postgres;Password=postgres123
AcademicService:    Host=postgres-academic;Port=5432;Database=academicdb;Username=postgres;Password=postgres123
ProjectService:     Host=postgres-project;Port=5432;Database=projectdb;Username=postgres;Password=postgres123
TeamService:        Host=postgres-team;Port=5432;Database=teamdb;Username=postgres;Password=postgres123
CommunicationService: Host=postgres-communication;Port=5432;Database=communicationdb;Username=postgres;Password=postgres123
RealtimeService:    Host=postgres-realtime;Port=5432;Database=realtimedb;Username=postgres;Password=postgres123
```

### PostgreSQL Commands
```bash
# Connect to database
docker exec -it collabsphere-postgres-auth psql -U postgres -d authdb

# List databases
\l

# List tables
\dt

# Describe table
\d table_name

# Exit
\q
```

## 🔐 Authentication Quick Reference

### User Roles
1. **Admin** - Full system access
2. **Staff** - Manage subjects, classes, accounts
3. **HeadDepartment** - Approve projects, assign to classes
4. **Lecturer** - Create projects, manage teams
5. **Student** - Participate in teams, submit work

### JWT Token Example
```json
{
  "sub": "user-id",
  "email": "user@example.com",
  "role": "Lecturer",
  "exp": 1234567890
}
```

### API Authentication
```bash
# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'

# Use token
curl -X GET http://localhost:5000/api/users \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## 📡 API Endpoints Quick Reference

### AuthService
```
POST   /api/auth/register      - Register new user
POST   /api/auth/login         - Login
POST   /api/auth/refresh       - Refresh token
POST   /api/auth/logout        - Logout
GET    /api/users              - Get all users (Admin)
GET    /api/users/{id}         - Get user by ID
PUT    /api/users/{id}         - Update user
DELETE /api/users/{id}         - Deactivate user
```

### AcademicService
```
GET    /api/subjects           - List subjects
POST   /api/subjects           - Create subject
POST   /api/subjects/import    - Import from Excel
GET    /api/syllabus           - List syllabi
POST   /api/syllabus           - Create syllabus
GET    /api/classes            - List classes
POST   /api/classes            - Create class
```

### ProjectService
```
GET    /api/projects           - List projects
POST   /api/projects           - Create project
POST   /api/projects/{id}/submit   - Submit for approval
POST   /api/projects/{id}/approve  - Approve project
GET    /api/milestones         - List milestones
POST   /api/milestones         - Create milestone
```

### TeamService
```
GET    /api/teams              - List teams
POST   /api/teams              - Create team
GET    /api/checkpoints        - List checkpoints
POST   /api/checkpoints        - Create checkpoint
GET    /api/workspace/{teamId} - Get workspace
POST   /api/workspace/cards    - Create card
```

### CommunicationService
```
GET    /api/chat/conversations - List conversations
POST   /api/chat/messages      - Send message
GET    /api/notifications      - Get notifications
POST   /api/resources/upload   - Upload file
```

### RealtimeService
```
GET    /api/meetings           - List meetings
POST   /api/meetings           - Schedule meeting
POST   /api/meetings/{id}/join - Join meeting
GET    /api/whiteboard/{id}    - Get whiteboard data
```

## 🧪 Testing Quick Reference

### Unit Test Example
```csharp
[Fact]
public async Task Login_WithValidCredentials_ReturnsSuccess()
{
    // Arrange
    var service = new AuthService(mockRepo, mockJwt);
    
    // Act
    var result = await service.LoginAsync(request);
    
    // Assert
    Assert.True(result.IsSuccess);
}
```

### Integration Test Example
```csharp
[Fact]
public async Task Login_ReturnsOk()
{
    var response = await _client.PostAsJsonAsync("/api/auth/login", request);
    response.EnsureSuccessStatusCode();
}
```

## 🐛 Debugging Tips

### Check Service Health
```bash
# Check if service is running
docker ps | grep [service-name]

# View service logs
docker logs collabsphere-[service-name]

# Check service health endpoint
curl http://localhost:5001/health
```

### Common Issues

**Issue: Port already in use**
```bash
# Find process using port
netstat -ano | findstr :5000  # Windows
lsof -i :5000                 # Linux/Mac

# Kill process
taskkill /PID [PID] /F        # Windows
kill -9 [PID]                 # Linux/Mac
```

**Issue: Database connection failed**
```bash
# Check PostgreSQL is running
docker ps | grep postgres

# Restart PostgreSQL
docker restart collabsphere-postgres-auth
```

**Issue: Cannot connect to RabbitMQ**
```bash
# Check RabbitMQ is running
docker ps | grep rabbitmq

# Restart RabbitMQ
docker restart collabsphere-rabbitmq
```

## 📦 Package Management

### NuGet Packages (Backend)
```bash
# Add package
dotnet add package PackageName

# Update package
dotnet add package PackageName --version X.X.X

# Remove package
dotnet remove package PackageName

# List packages
dotnet list package
```

### NPM Packages (Frontend)
```bash
# Add package
npm install package-name

# Add dev dependency
npm install --save-dev package-name

# Update package
npm update package-name

# Remove package
npm uninstall package-name

# List packages
npm list
```

## 🔄 Git Workflow

### Branch Naming
```
feature/member1-auth-service
feature/member2-academic-service
bugfix/fix-login-issue
hotfix/critical-security-patch
```

### Common Commands
```bash
# Create and switch to new branch
git checkout -b feature/member1-auth-service

# Stage changes
git add .

# Commit changes
git commit -m "feat: implement user authentication"

# Push to remote
git push origin feature/member1-auth-service

# Pull latest changes
git pull origin main

# Merge branch
git merge feature/member1-auth-service
```

### Commit Message Convention
```
feat: Add new feature
fix: Fix bug
docs: Update documentation
style: Format code
refactor: Refactor code
test: Add tests
chore: Update dependencies
```

## 📊 Monitoring & Logs

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f auth-service

# Last 100 lines
docker-compose logs --tail=100 auth-service

# Since timestamp
docker-compose logs --since 2024-01-01T00:00:00 auth-service
```

### Resource Usage
```bash
# View resource usage
docker stats

# View specific service
docker stats collabsphere-auth-service
```

## 🚀 Deployment Quick Reference

### Build for Production
```bash
# Build all services
docker-compose -f docker-compose.prod.yml build

# Push to registry
docker tag collabsphere-authservice:latest registry.example.com/authservice:v1.0.0
docker push registry.example.com/authservice:v1.0.0
```

### Environment Variables
```bash
# Development
export ASPNETCORE_ENVIRONMENT=Development

# Production
export ASPNETCORE_ENVIRONMENT=Production
```

## 📚 Useful Links

- [ASP.NET Core Docs](https://docs.microsoft.com/en-us/aspnet/core/)
- [Entity Framework Core](https://docs.microsoft.com/en-us/ef/core/)
- [React Documentation](https://react.dev/)
- [Docker Documentation](https://docs.docker.com/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [SignalR Documentation](https://docs.microsoft.com/en-us/aspnet/core/signalr/)

## 🆘 Emergency Contacts

- **Technical Lead:** [Name]
- **Backend Team:** Member 1-6
- **Frontend Team:** [Names]
- **DevOps:** [Name]

## 📝 Notes

- Always pull latest changes before starting work
- Run tests before committing
- Update documentation when adding features
- Follow coding standards and conventions
- Use meaningful commit messages
- Review code before merging

---

**Last Updated:** January 2024  
**Version:** 1.0.0
