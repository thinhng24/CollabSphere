# CollabSphere - Project Summary

## 📊 Project Overview

**Project Name:** CollabSphere (COSRE)  
**Type:** Project-Based Learning Management System  
**Architecture:** Microservices with Docker  
**Team Size:** 6 Members  
**Duration:** 8 Weeks  

## 🎯 Project Objectives

CollabSphere aims to provide a unified platform for managing team projects in Project-Based Learning environments by:

1. **Integrating Multiple Tools** - Combining communication, collaboration, and project management into one seamless workspace
2. **Supporting Real-time Collaboration** - Enabling video meetings, chat, whiteboard, and document editing
3. **Facilitating Project Tracking** - Providing transparent progress monitoring and contribution assessment
4. **Enhancing Learning Experience** - Promoting teamwork, problem-solving, and practical skill development

## 🏗️ System Architecture

### Microservices (6 Services)

```
┌─────────────────────────────────────────────────────────────┐
│                      API Gateway (Ocelot)                    │
│                     Port 5000 - Entry Point                  │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
┌───────▼────────┐   ┌───────▼────────┐   ┌───────▼────────┐
│  AuthService   │   │ AcademicService│   │ ProjectService │
│   Port 5001    │   │   Port 5002    │   │   Port 5003    │
│   Member 1     │   │   Member 2     │   │   Member 3     │
└────────────────┘   └────────────────┘   └────────────────┘
        │                     │                     │
┌───────▼────────┐   ┌───────▼────────┐   ┌───────▼────────┐
│  TeamService   │   │ Communication  │   │ RealtimeService│
│   Port 5004    │   │    Service     │   │   Port 5006    │
│   Member 4     │   │   Port 5005    │   │   Member 6     │
└────────────────┘   │   Member 5     │   └────────────────┘
                     └────────────────┘
```

### Infrastructure Components

```
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ PostgreSQL   │  │    Redis     │  │  RabbitMQ    │
│ (6 databases)│  │  (Caching)   │  │ (Messaging)  │
└──────────────┘  └──────────────┘  └──────────────┘
```

### Frontend

```
┌─────────────────────────────────────────────────────────────┐
│                    React.js Application                      │
│                        Port 3000                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  Admin   │  │  Staff   │  │Head Dept │  │ Lecturer │   │
│  │    UI    │  │    UI    │  │    UI    │  │    UI    │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│                    ┌──────────┐                             │
│                    │ Student  │                             │
│                    │    UI    │                             │
│                    └──────────┘                             │
└─────────────────────────────────────────────────────────────┘
```

## 👥 Team Structure & Responsibilities

### Member 1 - Authentication & Accounts
**Backend:**
- JWT authentication with refresh tokens
- User registration and login
- Role-based authorization (5 roles)
- Account management (CRUD)
- Account activation/deactivation

**Frontend:**
- Login/Register pages
- User profile page
- Admin user management dashboard

**Technologies:**
- ASP.NET Core Web API
- Entity Framework Core
- JWT Bearer Authentication
- BCrypt for password hashing

---

### Member 2 - Academic Management
**Backend:**
- Subject management
- Syllabus management
- Class management
- Excel file import (EPPlus)
- Lecturer/Student assignment

**Frontend:**
- Subject list and detail pages
- Syllabus management UI
- Class management dashboard
- Staff management interface

**Technologies:**
- ASP.NET Core Web API
- Entity Framework Core
- EPPlus (Excel processing)

---

### Member 3 - Project Management
**Backend:**
- Project CRUD operations
- Approval workflow (Pending → Approved/Denied)
- Milestone management
- AI integration (AWS Bedrock)
- Project assignment

**Frontend:**
- Project creation/management
- Approval workflow UI
- Milestone management
- AI-assisted project planning

**Technologies:**
- ASP.NET Core Web API
- Entity Framework Core
- AWS Bedrock SDK

---

### Member 4 - Team & Workspace
**Backend:**
- Team creation and management
- Checkpoint management
- Workspace (Cards, Tasks, Subtasks)
- Contribution tracking
- Sprint management

**Frontend:**
- Team management dashboard
- Checkpoint submission UI
- Workspace with drag-and-drop
- Sprint board (Kanban style)

**Technologies:**
- ASP.NET Core Web API
- Entity Framework Core
- React DnD (drag-and-drop)

---

### Member 5 - Communication
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

**Technologies:**
- ASP.NET Core Web API
- SignalR
- Cloudinary SDK
- Redis
- SMTP (Email)

---

### Member 6 - Real-time Features
**Backend:**
- WebRTC signaling server
- Socket.IO for whiteboard
- Meeting scheduling
- Screen sharing support

**Frontend:**
- Video meeting UI (WebRTC)
- Interactive whiteboard
- Meeting scheduler
- Screen sharing controls

**Technologies:**
- ASP.NET Core Web API
- WebRTC
- Socket.IO
- Simple-peer

---

## 📅 8-Week Timeline

### Week 1-2: Analysis & Design
- [x] Requirements analysis
- [x] System architecture design
- [x] Database schema design
- [x] Create project structure
- [x] Setup Docker environment
- [x] Create Jira board
- [x] Setup GitHub repository

### Week 3-4: Backend Development
- [ ] Implement all 6 microservices
- [ ] Create database migrations
- [ ] Implement API endpoints
- [ ] Setup API Gateway
- [ ] Implement authentication
- [ ] Create frontend skeleton

### Week 5-6: Integration & Core Features
- [ ] Frontend-Backend integration
- [ ] Implement main features
- [ ] Real-time communication setup
- [ ] File upload/download
- [ ] Testing (Unit & Integration)

### Week 7: Polish & Advanced Features
- [ ] UI/UX improvements
- [ ] AI integration (AWS Bedrock)
- [ ] Real-time features (WebRTC, Socket.IO)
- [ ] Notification system
- [ ] Performance optimization
- [ ] Security hardening

### Week 8: Deployment & Documentation
- [ ] Bug fixes
- [ ] Deploy to Azure/AWS
- [ ] Write documentation
- [ ] Create user manual
- [ ] Prepare demo
- [ ] Final presentation

## 🛠️ Technology Stack Summary

### Backend
- **Framework:** ASP.NET Core 8.0 Web API
- **Database:** PostgreSQL 16
- **ORM:** Entity Framework Core 8.0
- **Authentication:** JWT Bearer Tokens
- **API Gateway:** Ocelot
- **Caching:** Redis
- **Message Broker:** RabbitMQ
- **Real-time:** SignalR, Socket.IO, WebRTC

### Frontend
- **Framework:** React.js 18
- **State Management:** React Context API
- **Routing:** React Router v6
- **HTTP Client:** Axios
- **UI Library:** Material-UI / Tailwind CSS
- **Real-time:** SignalR Client, Socket.IO Client

### DevOps
- **Containerization:** Docker
- **Orchestration:** Docker Compose
- **CI/CD:** GitHub Actions (optional)
- **Hosting:** Azure (Backend), AWS (Frontend)

### Cloud Services
- **File Storage:** Cloudinary
- **AI:** AWS Bedrock
- **Cache:** Upstash Redis (optional)

## 📊 Database Overview

### Total: 6 Databases (One per microservice)

1. **authdb** - Users, RefreshTokens
2. **academicdb** - Subjects, Syllabi, Classes, ClassMembers
3. **projectdb** - Projects, Milestones, ProjectApprovals, ProjectAssignments
4. **teamdb** - Teams, TeamMembers, Checkpoints, WorkspaceCards, Tasks, Subtasks
5. **communicationdb** - Conversations, Messages, Resources, Notifications
6. **realtimedb** - Meetings, MeetingParticipants, WhiteboardSessions, WhiteboardData

**Total Tables:** ~25 tables across all databases

## 🔐 Security Features

1. **Authentication:**
   - JWT access tokens (60 min expiry)
   - Refresh tokens (7 days expiry)
   - Password hashing (BCrypt)

2. **Authorization:**
   - Role-based access control (5 roles)
   - Resource-based authorization
   - API Gateway authentication

3. **Data Protection:**
   - HTTPS/TLS encryption
   - SQL injection prevention (EF Core)
   - XSS protection
   - CORS configuration

4. **API Security:**
   - Rate limiting
   - Request validation
   - Error handling
   - Logging and monitoring

## 📈 Key Features Summary

### For Admin
- View all system accounts
- Deactivate user accounts
- View system reports
- Dashboard with statistics

### For Staff
- Import subjects, syllabi, classes (Excel)
- Manage lecturer/student accounts
- Assign lecturers and students to classes
- View all academic data

### For Head Department
- View all classes and projects
- Approve/deny pending projects
- Update approved projects
- Assign projects to classes

### For Lecturer
- Create and manage projects
- Submit projects for approval
- Create and manage teams
- Monitor team progress
- Evaluate students
- Manage resources
- Conduct meetings

### For Student
- View assigned classes and teams
- Participate in team activities
- Submit checkpoints
- Answer milestone questions
- Collaborate in workspace
- Attend meetings
- Evaluate peers

## 🎯 Success Criteria

1. **Functionality:** All required features implemented and working
2. **Performance:** System handles 100+ concurrent users
3. **Reliability:** 99% uptime, proper error handling
4. **Usability:** Intuitive UI/UX, responsive design
5. **Security:** No critical vulnerabilities
6. **Documentation:** Complete technical and user documentation
7. **Testing:** 80%+ code coverage
8. **Deployment:** Successfully deployed to cloud

## 📦 Deliverables

1. **Source Code:**
   - Backend (6 microservices)
   - Frontend (React application)
   - Shared libraries
   - Docker configuration

2. **Documentation:**
   - User Requirements Document
   - Software Requirement Specification
   - Architecture Design Document
   - Detail Design Document
   - System Implementation Document
   - Testing Document
   - Installation Guide
   - User Manual

3. **Deployment:**
   - Docker images
   - Deployment scripts
   - Cloud deployment (Azure/AWS)

4. **Presentation:**
   - Demo video
   - Presentation slides
   - Final report

## 🚀 Getting Started

### Quick Start (3 Steps)

1. **Clone and Setup:**
```bash
git clone <repository-url>
cd CollabSphere
cp .env.example .env
# Edit .env with your credentials
```

2. **Run with Docker:**
```bash
docker-compose up --build -d
```

3. **Access the Application:**
- Frontend: http://localhost:3000
- API Gateway: http://localhost:5000
- RabbitMQ: http://localhost:15672

### For Detailed Instructions
- See [README.md](./README.md) for complete documentation
- See [IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md) for development guide
- See [TODO.md](./TODO.md) for progress tracking

## 📞 Contact & Support

For questions or issues:
1. Check the documentation files
2. Review the implementation guide
3. Create an issue in the repository
4. Contact team members

---

**CollabSphere** - Transforming Project-Based Learning Through Technology 🚀

*Last Updated: January 2024*
