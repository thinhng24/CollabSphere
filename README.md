# CollabSphere - Project & Milestone Management with AI

CollabSphere is a comprehensive project management platform designed specifically for Project-Based Learning (PBL) environments, focusing on project creation, milestone management, and AI-powered project planning.

## 🎯 Core Features

### Projects & Milestones Management
- **Project Creation & Management**: Lecturers can create, update, and delete projects
- **Approval Workflow**: Head of Department reviews and approves/rejects projects
- **Milestone Tracking**: Create and track project milestones with deadlines
- **AI-Powered Milestone Generation**: AWS Bedrock integration for intelligent milestone suggestions

### Role-Based Access
- **Lecturer**: Create projects, manage milestones, submit for approval
- **Head of Department**: Approve/reject projects, review proposals
- **Admin**: Full system access and management

## 🏗️ Architecture

### Technology Stack

**Backend:**
- ASP.NET Core 8.0 Web API
- PostgreSQL 16 Database
- Entity Framework Core 8.0
- JWT Bearer Authentication
- Redis for Caching
- RabbitMQ for Messaging
- **AWS Bedrock for AI Integration**

**Infrastructure:**
- Docker & Docker Compose
- Ocelot API Gateway
- Clean Architecture Pattern

## 📁 Project Structure

```
CollabSphere/
├── docker-compose.yml          # Container orchestration
├── .env.example                # Environment configuration
├── gateway/                    # API Gateway (Ocelot)
│   ├── Program.cs
│   └── ocelot.json            # Routes configuration
├── shared/                     # Shared libraries
│   ├── SharedKernel/          # Common models
│   └── EventBus/              # Event-driven communication
└── services/
    └── ProjectService/        # Projects & Milestones Service
        ├── ProjectService.API/
        ├── ProjectService.Application/
        ├── ProjectService.Domain/
        └── ProjectService.Infrastructure/
```

## 🚀 Quick Start

### Prerequisites
- Docker Desktop
- .NET 8.0 SDK
- PostgreSQL 16
- AWS Account (for Bedrock AI features)

### Environment Setup

1. **Clone and configure environment:**
```bash
git clone <repository-url>
cd CollabSphere
cp .env.example .env
```

2. **Configure AWS Bedrock credentials in .env:**
```bash
AWS_ACCESS_KEY=your-access-key
AWS_SECRET_KEY=your-secret-key
```

3. **Start with Docker Compose:**
```bash
docker-compose up --build
```

4. **Access the services:**
- API Gateway: http://localhost:5000
- ProjectService: http://localhost:5003
- RabbitMQ Management: http://localhost:15672

## 📊 Database Schema

### Projects Table
- Id (UUID, PK)
- Name, Description, Objectives
- SyllabusId, ClassId
- Status (Pending, Approved, Denied, InProgress, Completed)
- CreatedBy, SubmittedAt, ApprovedAt, ApprovedBy
- RejectionReason
- Timestamps & Soft Delete

### Milestones Table
- Id (UUID, PK)
- ProjectId (FK)
- Title, Description
- DueDate, Order
- IsCompleted, CompletedAt
- Timestamps & Soft Delete

### ProjectApprovals Table
- Id (UUID, PK)
- ProjectId (FK), ReviewerId
- Status (Approved, Denied)
- Comments, ReviewedAt
- Timestamps

## 🔌 API Endpoints

### Projects API (via Gateway: `/api/projects`)
- `GET /api/projects` - List all projects (paginated)
- `GET /api/projects/{id}` - Get project details
- `POST /api/projects` - Create project (Lecturer)
- `PUT /api/projects/{id}` - Update project (Lecturer)
- `DELETE /api/projects/{id}` - Delete project (Lecturer/Admin)
- `POST /api/projects/{id}/submit` - Submit for approval (Lecturer)
- `POST /api/projects/{id}/approve` - Approve project (Head Dept)
- `POST /api/projects/{id}/reject` - Reject project (Head Dept)

### Milestones API (via Gateway: `/api/milestones`)
- `GET /api/milestones/project/{projectId}` - Get milestones by project
- `GET /api/milestones/{id}` - Get milestone details
- `POST /api/milestones` - Create milestone
- `PUT /api/milestones/{id}` - Update milestone
- `DELETE /api/milestones/{id}` - Delete milestone
- `POST /api/milestones/{id}/complete` - Mark as completed

## 🤖 AI Integration (AWS Bedrock)

### Intelligent Milestone Generation
ProjectService integrates AWS Bedrock to automatically generate project milestones based on syllabus content and project objectives.

**Configuration:**
```json
{
  "AWS": {
    "Region": "us-east-1",
    "AccessKey": "your-access-key",
    "SecretKey": "your-secret-key"
  }
}
```

**Usage Example:**
```bash
POST /api/projects/{id}/generate-milestones
{
  "syllabusId": "syllabus-id",
  "numberOfMilestones": 5
}
```

The AI analyzes the syllabus and project objectives to create contextually relevant milestones with appropriate timelines and dependencies.

## 🎓 User Workflows

### Lecturer Workflow
1. Create a new project with objectives
2. Add milestones manually or use AI generation
3. Submit project for approval
4. Manage milestones after approval

### Head of Department Workflow
1. Review pending projects
2. Approve or reject with comments
3. Monitor project progress across department

## 🔐 Authentication & Authorization

### JWT Token Structure
```json
{
  "sub": "user-id",
  "email": "user@example.com",
  "role": "Lecturer|HeadDepartment|Admin",
  "exp": 1234567890
}
```

### Role Permissions

| Action | Lecturer | Head Dept | Admin |
|--------|----------|-----------|-------|
| Create Project | ✅ | ❌ | ✅ |
| Submit Project | ✅ | ❌ | ✅ |
| Approve Project | ❌ | ✅ | ✅ |
| Reject Project | ❌ | ✅ | ✅ |
| Manage Milestones | ✅ | ❌ | ✅ |

## 📝 Example Requests

### Create Project (Lecturer)
```bash
curl -X POST http://localhost:5000/api/projects \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "E-Commerce Platform",
    "description": "Build a full-stack e-commerce platform",
    "objectives": "Learn React, Node.js, MongoDB, Payment Integration",
    "syllabusId": "00000000-0000-0000-0000-000000000001",
    "classId": "00000000-0000-0000-0000-000000000002"
  }'
```

### Approve Project (Head Department)
```bash
curl -X POST http://localhost:5000/api/projects/{id}/approve \
  -H "Authorization: Bearer HEAD_DEPT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "comments": "Excellent project proposal. Approved!"
  }'
```

### Generate Milestones with AI
```bash
curl -X POST http://localhost:5000/api/projects/{id}/generate-milestones \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "syllabusId": "syllabus-id",
    "numberOfMilestones": 5
  }'
```

## 🐳 Docker Deployment

### Development
```bash
docker-compose up --build
```

### Production
```bash
docker-compose -f docker-compose.prod.yml up -d
```

## 🧪 Testing

### Manual Testing with Swagger
Access Swagger UI at:
- ProjectService: http://localhost:5003

### Test Project Approval Workflow
1. Create project as Lecturer
2. Submit for approval
3. Approve as Head Department
4. Add milestones
5. Track progress

## 🔧 Configuration

### Environment Variables
```env
# Database
POSTGRES_DB=projectdb
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres123

# JWT
JWT_SECRET=YourSuperSecretKeyForJWTTokenGeneration123456789
JWT_ISSUER=CollabSphere
JWT_AUDIENCE=CollabSphereUsers

# Redis
REDIS_CONNECTION=redis:6379

# RabbitMQ
RABBITMQ_HOST=rabbitmq
RABBITMQ_USER=admin
RABBITMQ_PASSWORD=admin123

# AWS Bedrock
AWS_REGION=us-east-1
AWS_ACCESS_KEY=your-access-key
AWS_SECRET_KEY=your-secret-key
```

## 📚 Documentation

For detailed implementation information, see:
- [ProjectService README](./services/ProjectService/README.md) - Service overview
- [Implementation Complete](./services/ProjectService/IMPLEMENTATION_COMPLETE.md) - Full implementation details

## 🔮 Future Enhancements

### AI Features (AWS Bedrock)
- ✅ Project structure ready for AI integration
- ⏳ Milestone auto-generation from syllabus
- ⏳ Project timeline optimization
- ⏳ Risk analysis and recommendations
- ⏳ Progress prediction and insights

### Additional Features
- Project templates
- Milestone dependencies and critical path
- Progress analytics dashboard
- Automated notifications
- File attachments and resources

## 🐛 Troubleshooting

### Database Connection Issues
```bash
# Check PostgreSQL container
docker ps | grep postgres-project

# Restart database
docker restart collabsphere-postgres-project
```

### AWS Bedrock Connection
```bash
# Verify credentials
aws bedrock list-foundation-models --region us-east-1

# Test connection
aws bedrock invoke-model --model-id amazon.titan-text-express-v1 --region us-east-1
```

### Port Conflicts
```bash
# Windows
netstat -ano | findstr :5003
taskkill /PID <PID> /F

# Linux/Mac
lsof -i :5003
kill -9 <PID>
```

## 📞 Support

For issues and questions:
- Check service logs: `docker logs collabsphere-project-service`
- Review [ProjectService Documentation](./services/ProjectService/README.md)
- Verify environment configuration in `.env`

## 📄 License

This project is licensed under the MIT License.

---

**CollabSphere** - Empowering Project-Based Learning with AI 🚀

**Focus Areas:**
- ✅ Projects & Milestones Management
- ✅ Lecturer/Head Department UI & Workflows
- ✅ AI Bedrock Integration (AWS)
