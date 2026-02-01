# ProjectService - Project & Milestone Management

## 🎯 Overview
ProjectService quản lý projects và milestones cho CollabSphere platform. Service này cho phép Lecturers tạo projects, Head Department duyệt projects, và quản lý milestones.

## ✨ Features
- ✅ Project CRUD operations
- ✅ Project approval workflow (Pending → Approved/Denied)
- ✅ Milestone management
- ✅ AI-powered milestone generation (AWS Bedrock)
- ✅ Role-based authorization
- ✅ Project assignment to classes

## 📁 Project Structure
```
ProjectService/
├── ProjectService.API/           # Web API Layer
│   ├── Controllers/
│   │   ├── ProjectsController.cs
│   │   └── MilestonesController.cs
│   ├── Program.cs
│   └── appsettings.json
├── ProjectService.Application/   # Business Logic
│   ├── DTOs/
│   ├── Interfaces/
│   └── Services/
├── ProjectService.Domain/        # Domain Entities
│   └── Entities/
│       ├── Project.cs
│       ├── Milestone.cs
│       └── ProjectApproval.cs
├── ProjectService.Infrastructure/ # Data Access
│   ├── Data/
│   ├── Repositories/
│   └── Services/
└── Dockerfile
```

## 🚀 Quick Start

### Option 1: Sử dụng COMPLETE_CODE.md (Recommended)

1. **Mở file `COMPLETE_CODE.md`** trong thư mục này
2. **Copy từng code block** vào file tương ứng
3. **Tạo các file còn thiếu:**

```bash
# Domain Entities
- ProjectService.Domain/Entities/Milestone.cs
- ProjectService.Domain/Entities/ProjectApproval.cs

# Application Layer
- ProjectService.Application/ProjectService.Application.csproj
- ProjectService.Application/DTOs/ProjectDto.cs
- ProjectService.Application/DTOs/CreateProjectRequest.cs
- ProjectService.Application/DTOs/MilestoneDto.cs
- ProjectService.Application/DTOs/CreateMilestoneRequest.cs
- ProjectService.Application/Interfaces/IProjectService.cs
- ProjectService.Application/Interfaces/IMilestoneService.cs
- ProjectService.Application/Services/ProjectServiceImpl.cs
- ProjectService.Application/Services/MilestoneService.cs

# Infrastructure Layer
- ProjectService.Infrastructure/ProjectService.Infrastructure.csproj
- ProjectService.Infrastructure/Data/ProjectDbContext.cs
- ProjectService.Infrastructure/Repositories/Repository.cs

# API Layer
- ProjectService.API/ProjectService.API.csproj
- ProjectService.API/Controllers/ProjectsController.cs
- ProjectService.API/Controllers/MilestonesController.cs
- ProjectService.API/Program.cs
- ProjectService.API/appsettings.json

# Docker
- Dockerfile
```

4. **Run migrations:**
```bash
cd ProjectService.API
dotnet ef migrations add InitialCreate --project ../ProjectService.Infrastructure
dotnet ef database update --project ../ProjectService.Infrastructure
```

5. **Run service:**
```bash
dotnet run
```

### Option 2: Sử dụng Docker

```bash
# From CollabSphere root
docker-compose up project-service --build
```

## 📊 Database Schema

### Projects Table
- Id (UUID, PK)
- Name (string, required)
- Description (string, required)
- Objectives (string, required)
- SyllabusId (UUID, nullable)
- ClassId (UUID, nullable)
- Status (enum: Pending, Approved, Denied, InProgress, Completed)
- CreatedBy (UUID, required)
- SubmittedAt (datetime, nullable)
- ApprovedAt (datetime, nullable)
- ApprovedBy (UUID, nullable)
- RejectionReason (string, nullable)
- CreatedAt, UpdatedAt, IsDeleted, DeletedAt

### Milestones Table
- Id (UUID, PK)
- ProjectId (UUID, FK, required)
- Title (string, required)
- Description (string, required)
- DueDate (datetime, required)
- Order (int, required)
- IsCompleted (boolean)
- CompletedAt (datetime, nullable)
- CreatedAt, UpdatedAt, IsDeleted, DeletedAt

### ProjectApprovals Table
- Id (UUID, PK)
- ProjectId (UUID, FK, required)
- ReviewerId (UUID, required)
- Status (enum: Approved, Denied)
- Comments (string, nullable)
- ReviewedAt (datetime, required)
- CreatedAt, UpdatedAt, IsDeleted, DeletedAt

## 🔌 API Endpoints

### Projects
- `GET /api/projects` - Get all projects (paginated)
- `GET /api/projects/{id}` - Get project by ID
- `POST /api/projects` - Create project (Lecturer only)
- `PUT /api/projects/{id}` - Update project (Lecturer only)
- `DELETE /api/projects/{id}` - Delete project (Lecturer/Admin)
- `POST /api/projects/{id}/submit` - Submit for approval (Lecturer)
- `POST /api/projects/{id}/approve` - Approve project (Head Dept)
- `POST /api/projects/{id}/reject` - Reject project (Head Dept)

### Milestones
- `GET /api/milestones/project/{projectId}` - Get milestones by project
- `GET /api/milestones/{id}` - Get milestone by ID
- `POST /api/milestones` - Create milestone
- `PUT /api/milestones/{id}` - Update milestone
- `DELETE /api/milestones/{id}` - Delete milestone
- `POST /api/milestones/{id}/complete` - Mark as completed

## 📝 Example Requests

### Create Project (Lecturer)
```bash
curl -X POST http://localhost:5003/api/projects \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "E-Commerce Website",
    "description": "Build a full-stack e-commerce platform",
    "objectives": "Learn React, Node.js, MongoDB, Payment Integration",
    "syllabusId": "00000000-0000-0000-0000-000000000001",
    "classId": "00000000-0000-0000-0000-000000000002"
  }'
```

### Approve Project (Head Department)
```bash
curl -X POST http://localhost:5003/api/projects/{id}/approve \
  -H "Authorization: Bearer HEAD_DEPT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "comments": "Great project proposal. Approved!"
  }'
```

### Create Milestone
```bash
curl -X POST http://localhost:5003/api/milestones \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "project-id-here",
    "title": "Setup Development Environment",
    "description": "Install Node.js, React, MongoDB",
    "dueDate": "2024-02-15T00:00:00Z",
    "order": 1
  }'
```

## 🤖 AI Integration (AWS Bedrock)

ProjectService tích hợp AWS Bedrock để tự động generate milestones từ syllabus:

```csharp
// Example: Generate milestones using AI
POST /api/projects/{id}/generate-milestones
{
  "syllabusId": "syllabus-id",
  "numberOfMilestones": 5
}
```

AI sẽ phân tích syllabus và tạo milestones phù hợp với objectives của project.

## 🔐 Authorization

### Lecturer
- Create, update, delete own projects
- Submit projects for approval
- Manage milestones

### Head Department
- View all projects
- Approve/reject projects
- View project history

### Student
- View assigned projects
- View milestones
- Track progress

### Admin
- Full access to all operations

## 🧪 Testing

### Unit Tests
```bash
cd ProjectService.Tests
dotnet test
```

### Integration Tests
```bash
cd ProjectService.IntegrationTests
dotnet test
```

### Manual Testing with Swagger
```
http://localhost:5003
```

## 🐛 Troubleshooting

### Database connection failed
```bash
# Check PostgreSQL is running
docker ps | grep postgres-project

# Restart database
docker restart collabsphere-postgres-project
```

### Migration errors
```bash
# Drop and recreate database
dotnet ef database drop --project ProjectService.Infrastructure --force
dotnet ef database update --project ProjectService.Infrastructure
```

### Port already in use
```bash
# Windows
netstat -ano | findstr :5003
taskkill /PID <PID> /F

# Linux/Mac
lsof -i :5003
kill -9 <PID>
```

## 📚 Implementation Steps

### Step 1: Copy Code from COMPLETE_CODE.md
Mở file `COMPLETE_CODE.md` và copy từng code block vào file tương ứng.

### Step 2: Build Solution
```bash
cd ProjectService.API
dotnet build
```

### Step 3: Create Migrations
```bash
dotnet ef migrations add InitialCreate --project ../ProjectService.Infrastructure
```

### Step 4: Update Database
```bash
dotnet ef database update --project ../ProjectService.Infrastructure
```

### Step 5: Run Service
```bash
dotnet run
```

### Step 6: Test APIs
Mở Swagger UI tại `http://localhost:5003`

## 🔗 Dependencies

- ASP.NET Core 8.0
- Entity Framework Core 8.0
- PostgreSQL 16
- JWT Authentication
- Redis (caching)
- RabbitMQ (messaging)
- AWS Bedrock (AI)

## 📖 Related Documentation

- [AuthService](../AuthService/README.md) - Authentication reference
- [IMPLEMENTATION_GUIDE.md](../../IMPLEMENTATION_GUIDE.md) - Complete guide
- [COMPLETE_CODE.md](./COMPLETE_CODE.md) - All source code

## 🎓 Learning Resources

ProjectService follows the same Clean Architecture pattern as AuthService:
1. **Domain Layer**: Entities (Project, Milestone, ProjectApproval)
2. **Application Layer**: Business logic, DTOs, Interfaces
3. **Infrastructure Layer**: Database, Repositories
4. **API Layer**: Controllers, Program.cs

## ✅ Checklist

- [ ] Copy all code from COMPLETE_CODE.md
- [ ] Build solution successfully
- [ ] Create and run migrations
- [ ] Test all API endpoints
- [ ] Verify authorization works
- [ ] Test project approval workflow
- [ ] Test milestone management
- [ ] Deploy with Docker

## 🚀 Next Steps

1. **Complete implementation** using COMPLETE_CODE.md
2. **Test thoroughly** with Swagger
3. **Integrate with frontend** (React)
4. **Add AI milestone generation** (AWS Bedrock)
5. **Deploy to production**

## 📞 Support

- Check COMPLETE_CODE.md for all source code
- Review AuthService as reference
- See IMPLEMENTATION_GUIDE.md for patterns
- Ask team members for help

---

**Status**: 📝 Ready for implementation
**Priority**: High (Member 3)
**Estimated Time**: 4-6 hours

**Quick Start**: Open `COMPLETE_CODE.md` and start copying code! 🚀
