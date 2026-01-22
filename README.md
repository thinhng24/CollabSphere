# CollabSphere - Project-Based Learning Management System

CollabSphere is a comprehensive microservices-based platform designed to support Project-Based Learning (PBL) in educational environments. It integrates communication, collaboration, and project management tools into a unified workspace.

## 🏗️ Architecture

### Microservices Architecture
The system follows a microservices architecture with the following services:

1. **AuthService** (Port 5001) - Authentication & User Management
2. **AcademicService** (Port 5002) - Subjects, Syllabus & Classes
3. **ProjectService** (Port 5003) - Projects & Milestones
4. **TeamService** (Port 5004) - Teams, Checkpoints & Workspace
5. **CommunicationService** (Port 5005) - Chat, Notifications & Resources
6. **RealtimeService** (Port 5006) - Video Meetings & Whiteboard

### API Gateway
- **Ocelot Gateway** (Port 5000) - Routes requests to appropriate microservices

### Infrastructure
- **PostgreSQL** - 6 separate databases (one per service)
- **Redis** - Caching and Pub/Sub for notifications
- **RabbitMQ** - Message broker for inter-service communication
- **Docker** - Containerization for all services

## 🚀 Technology Stack

### Backend
- **Framework**: ASP.NET Core 8.0 Web API
- **Database**: PostgreSQL 16
- **ORM**: Entity Framework Core 8.0
- **Authentication**: JWT Bearer Tokens
- **API Gateway**: Ocelot
- **Caching**: Redis (StackExchange.Redis)
- **Message Broker**: RabbitMQ
- **Real-time Communication**: 
  - SignalR (Chat)
  - Socket.IO (Whiteboard)
  - WebRTC (Video/Audio)

### Frontend
- **Framework**: React.js 18
- **State Management**: React Context API
- **Routing**: React Router v6
- **HTTP Client**: Axios
- **UI Library**: Material-UI / Tailwind CSS
- **Real-time**: SignalR Client, Socket.IO Client, WebRTC

### Cloud Services
- **Hosting**: Azure (Backend), AWS (Frontend)
- **File Storage**: Cloudinary
- **AI**: AWS Bedrock
- **Cache**: Upstash Redis (optional)

## 📁 Project Structure

```
CollabSphere/
├── docker-compose.yml          # Orchestrates all services
├── .env.example                # Environment variables template
├── .gitignore                  # Git ignore rules
├── TODO.md                     # Implementation progress tracker
│
├── gateway/                    # API Gateway (Ocelot)
│   ├── Gateway.csproj
│   ├── Program.cs
│   ├── ocelot.json            # Route configuration
│   ├── appsettings.json
│   └── Dockerfile
│
├── shared/                     # Shared libraries
│   ├── SharedKernel/          # Common models, interfaces
│   │   ├── Entities/
│   │   │   └── BaseEntity.cs
│   │   ├── Enums/
│   │   │   ├── UserRole.cs
│   │   │   └── ProjectStatus.cs
│   │   ├── Common/
│   │   │   ├── Result.cs
│   │   │   └── PagedResult.cs
│   │   └── Interfaces/
│   │       ├── IRepository.cs
│   │       └── IUnitOfWork.cs
│   │
│   └── EventBus/              # Event-driven communication
│       ├── Events/
│       │   ├── IntegrationEvent.cs
│       │   └── UserCreatedEvent.cs
│       └── Interfaces/
│           ├── IEventBus.cs
│           └── IIntegrationEventHandler.cs
│
├── services/                   # Microservices
│   ├── AuthService/           # Member 1
│   │   ├── AuthService.sln
│   │   ├── AuthService.API/
│   │   ├── AuthService.Application/
│   │   ├── AuthService.Domain/
│   │   ├── AuthService.Infrastructure/
│   │   └── Dockerfile
│   │
│   ├── AcademicService/       # Member 2
│   ├── ProjectService/        # Member 3
│   ├── TeamService/           # Member 4
│   ├── CommunicationService/  # Member 5
│   └── RealtimeService/       # Member 6
│
└── frontend/                   # React Application
    └── collabsphere-web/
        ├── public/
        ├── src/
        │   ├── components/
        │   ├── pages/
        │   ├── services/
        │   ├── hooks/
        │   ├── context/
        │   └── App.jsx
        ├── package.json
        └── Dockerfile
```

## 👥 Team Member Responsibilities

### Member 1 - AuthService (Authentication & Accounts)
**Backend:**
- JWT authentication with refresh tokens
- User registration and login
- Role-based authorization (Admin, Staff, Head Dept, Lecturer, Student)
- User account management (CRUD)
- Account activation/deactivation

**Frontend:**
- Login/Register pages
- User profile page
- Admin user management dashboard

**Database Tables:**
- Users
- RefreshTokens

### Member 2 - AcademicService (Subjects, Syllabus & Classes)
**Backend:**
- Subject management APIs
- Syllabus management APIs
- Class management APIs
- Excel file import for bulk creation
- Assign lecturers and students to classes

**Frontend:**
- Subject list and detail pages
- Syllabus management UI
- Class management dashboard
- Staff management interface

**Database Tables:**
- Subjects
- Syllabi
- Classes
- ClassMembers

### Member 3 - ProjectService (Projects & Milestones)
**Backend:**
- Project CRUD operations
- Project approval workflow (Pending → Approved/Denied)
- Milestone management
- AI integration for milestone generation (AWS Bedrock)
- Project assignment to classes

**Frontend:**
- Lecturer: Create/manage projects
- Head Department: Approve/deny projects
- Project detail pages with milestones

**Database Tables:**
- Projects
- Milestones
- ProjectApprovals
- ProjectAssignments

### Member 4 - TeamService (Teams, Checkpoints & Workspace)
**Backend:**
- Team creation and management
- Team member assignment
- Checkpoint management
- Workspace (Cards, Tasks, Subtasks)
- Contribution tracking

**Frontend:**
- Team management dashboard
- Checkpoint submission UI
- Workspace with drag-and-drop (React DnD)
- Sprint board

**Database Tables:**
- Teams
- TeamMembers
- Checkpoints
- WorkspaceCards
- Tasks
- Subtasks

### Member 5 - CommunicationService (Chat, Notifications & Resources)
**Backend:**
- SignalR Hub for real-time chat
- Message persistence
- Resource/file management (Cloudinary)
- Notification system (Redis Pub/Sub)
- Email notifications

**Frontend:**
- Real-time chat UI
- Notification dropdown
- File upload/download
- Resource management

**Database Tables:**
- Messages
- Conversations
- Resources
- Notifications

### Member 6 - RealtimeService (Video Meetings & Whiteboard)
**Backend:**
- WebRTC signaling server
- Socket.IO for whiteboard
- Meeting scheduling
- Screen sharing support

**Frontend:**
- Video meeting UI (WebRTC)
- Interactive whiteboard (Socket.IO)
- Meeting scheduler
- Screen sharing controls

**Database Tables:**
- Meetings
- MeetingParticipants
- WhiteboardSessions
- WhiteboardData

## 🔧 Setup Instructions

### Prerequisites
- Docker Desktop
- .NET 8.0 SDK
- Node.js 18+
- PostgreSQL 16 (optional, for local development)

### Environment Setup

1. **Clone the repository**
```bash
git clone <repository-url>
cd CollabSphere
```

2. **Configure environment variables**
```bash
cp .env.example .env
# Edit .env with your actual credentials
```

3. **Build and run with Docker Compose**
```bash
docker-compose up --build
```

4. **Access the services**
- API Gateway: http://localhost:5000
- Frontend: http://localhost:3000
- RabbitMQ Management: http://localhost:15672 (admin/admin123)

### Local Development (Without Docker)

1. **Start PostgreSQL and Redis**
```bash
# Using Docker
docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=postgres123 postgres:16-alpine
docker run -d -p 6379:6379 redis:7-alpine
docker run -d -p 5672:5672 -p 15672:15672 rabbitmq:3-management-alpine
```

2. **Run each microservice**
```bash
cd services/AuthService/AuthService.API
dotnet run
```

3. **Run frontend**
```bash
cd frontend/collabsphere-web
npm install
npm start
```

## 📊 Database Schema

### AuthService Database (authdb)
```sql
Users (Id, Email, PasswordHash, FullName, PhoneNumber, Role, IsActive, LastLoginAt, CreatedAt, UpdatedAt)
RefreshTokens (Id, Token, UserId, ExpiresAt, IsRevoked, RevokedAt, CreatedAt)
```

### AcademicService Database (academicdb)
```sql
Subjects (Id, Code, Name, Description, Credits, CreatedAt, UpdatedAt)
Syllabi (Id, SubjectId, Version, Content, Objectives, CreatedAt, UpdatedAt)
Classes (Id, SubjectId, Code, Name, Semester, Year, LecturerId, CreatedAt, UpdatedAt)
ClassMembers (Id, ClassId, UserId, Role, JoinedAt)
```

### ProjectService Database (projectdb)
```sql
Projects (Id, Name, Description, Objectives, SyllabusId, Status, CreatedBy, CreatedAt, UpdatedAt)
Milestones (Id, ProjectId, Title, Description, DueDate, Order, CreatedAt, UpdatedAt)
ProjectApprovals (Id, ProjectId, ReviewerId, Status, Comments, ReviewedAt)
ProjectAssignments (Id, ProjectId, ClassId, AssignedBy, AssignedAt)
```

### TeamService Database (teamdb)
```sql
Teams (Id, Name, ProjectId, ClassId, LeaderId, CreatedAt, UpdatedAt)
TeamMembers (Id, TeamId, UserId, Role, ContributionPercentage, JoinedAt)
Checkpoints (Id, TeamId, Title, Description, DueDate, Status, CreatedAt, UpdatedAt)
WorkspaceCards (Id, TeamId, Title, Description, Status, Order, CreatedAt, UpdatedAt)
Tasks (Id, CardId, Title, Description, AssignedTo, Status, Priority, DueDate, CreatedAt)
Subtasks (Id, TaskId, Title, IsCompleted, CreatedAt)
```

### CommunicationService Database (communicationdb)
```sql
Conversations (Id, Type, Name, CreatedAt, UpdatedAt)
Messages (Id, ConversationId, SenderId, Content, Type, CreatedAt)
Resources (Id, Name, Type, Url, Size, UploadedBy, EntityType, EntityId, CreatedAt)
Notifications (Id, UserId, Type, Title, Content, IsRead, CreatedAt)
```

### RealtimeService Database (realtimedb)
```sql
Meetings (Id, Title, Description, ScheduledAt, Duration, HostId, TeamId, Status, CreatedAt)
MeetingParticipants (Id, MeetingId, UserId, JoinedAt, LeftAt)
WhiteboardSessions (Id, MeetingId, CreatedBy, CreatedAt)
WhiteboardData (Id, SessionId, Type, Data, CreatedAt)
```

## 🔐 Authentication & Authorization

### JWT Token Structure
```json
{
  "sub": "user-id",
  "email": "user@example.com",
  "role": "Lecturer",
  "exp": 1234567890
}
```

### Role Hierarchy
1. **Admin** - Full system access
2. **Staff** - Manage subjects, classes, accounts
3. **HeadDepartment** - Approve projects, assign to classes
4. **Lecturer** - Create projects, manage teams
5. **Student** - Participate in teams, submit work

## 📝 API Endpoints

### AuthService (via Gateway: /api/auth, /api/users)
- POST /api/auth/register - Register new user
- POST /api/auth/login - Login
- POST /api/auth/refresh - Refresh token
- POST /api/auth/logout - Logout
- GET /api/users - Get all users (Admin)
- GET /api/users/{id} - Get user by ID
- PUT /api/users/{id} - Update user
- DELETE /api/users/{id} - Deactivate user (Admin)

### AcademicService (via Gateway: /api/subjects, /api/syllabus, /api/classes)
- GET /api/subjects - List subjects
- POST /api/subjects - Create subject
- POST /api/subjects/import - Import from Excel
- GET /api/syllabus - List syllabi
- POST /api/syllabus - Create syllabus
- GET /api/classes - List classes
- POST /api/classes - Create class
- POST /api/classes/{id}/members - Add members

### ProjectService (via Gateway: /api/projects, /api/milestones)
- GET /api/projects - List projects
- POST /api/projects - Create project
- POST /api/projects/{id}/submit - Submit for approval
- POST /api/projects/{id}/approve - Approve project (Head Dept)
- POST /api/projects/{id}/deny - Deny project (Head Dept)
- GET /api/milestones - List milestones
- POST /api/milestones - Create milestone

### TeamService (via Gateway: /api/teams, /api/checkpoints, /api/workspace)
- GET /api/teams - List teams
- POST /api/teams - Create team
- POST /api/teams/{id}/members - Add members
- GET /api/checkpoints - List checkpoints
- POST /api/checkpoints - Create checkpoint
- GET /api/workspace/{teamId} - Get workspace
- POST /api/workspace/cards - Create card

### CommunicationService (via Gateway: /api/chat, /api/notifications, /api/resources)
- GET /api/chat/conversations - List conversations
- POST /api/chat/messages - Send message
- GET /api/notifications - Get notifications
- PUT /api/notifications/{id}/read - Mark as read
- POST /api/resources/upload - Upload file
- GET /api/resources - List resources

### RealtimeService (via Gateway: /api/meetings, /api/whiteboard)
- GET /api/meetings - List meetings
- POST /api/meetings - Schedule meeting
- POST /api/meetings/{id}/join - Join meeting
- GET /api/whiteboard/{sessionId} - Get whiteboard data
- POST /api/whiteboard - Create whiteboard session

## 🧪 Testing

### Unit Tests
```bash
cd services/AuthService
dotnet test
```

### Integration Tests
```bash
docker-compose -f docker-compose.test.yml up
```

### E2E Tests (Frontend)
```bash
cd frontend/collabsphere-web
npm run test:e2e
```

## 📦 Deployment

### Docker Deployment
```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Azure Deployment (Backend)
```bash
az login
az acr build --registry collabsphere --image authservice:latest ./services/AuthService
az container create --resource-group collabsphere-rg --name authservice --image collabsphere.azurecr.io/authservice:latest
```

### AWS Deployment (Frontend)
```bash
cd frontend/collabsphere-web
npm run build
aws s3 sync build/ s3://collabsphere-frontend
aws cloudfront create-invalidation --distribution-id XXX --paths "/*"
```

## 📚 Documentation

- [API Documentation](./docs/api.md) - Swagger/OpenAPI specs
- [Architecture Diagram](./docs/architecture.md) - System design
- [Database Schema](./docs/database.md) - ER diagrams
- [User Manual](./docs/user-manual.md) - End-user guide
- [Developer Guide](./docs/developer-guide.md) - Setup and contribution

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Write tests
4. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 👨‍💻 Team

- **Member 1**: Authentication & Accounts
- **Member 2**: Academic Management
- **Member 3**: Project Management
- **Member 4**: Team & Workspace
- **Member 5**: Communication
- **Member 6**: Real-time Features

## 📞 Support

For issues and questions, please create an issue in the repository.

---

**CollabSphere** - Empowering Project-Based Learning 🚀
