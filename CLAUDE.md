# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Architecture Overview

CollabSphere is a microservices-based project management platform built for Project-Based Learning (PBL) environments, featuring project creation, milestone tracking, and AI-powered project planning.

### Technology Stack

**Backend:**
- ASP.NET Core 8.0 Web API (Clean Architecture)
- PostgreSQL 16 with Entity Framework Core 8.0
- Ocelot API Gateway for routing
- Redis for caching
- RabbitMQ for messaging
- AWS Bedrock for AI integration

**Frontend:**
- React 18.2 with TypeScript (TSX)
- Vite for build tooling
- Material-UI (MUI) for components
- React Router v6 for navigation
- Axios for HTTP requests

**Infrastructure:**
- Docker Compose orchestration
- Nginx for frontend serving

### Project Structure

```
CollabSphere/
├── Backend/
│   ├── gateway/                    # Ocelot API Gateway
│   │   ├── Program.cs
│   │   └── ocelot.json            # Route configuration
│   ├── services/
│   │   └── ProjectService/        # Clean Architecture layers
│   │       ├── ProjectService.API/          # Controllers, Program.cs
│   │       ├── ProjectService.Application/  # Services, DTOs, Interfaces
│   │       ├── ProjectService.Domain/       # Entities, Enums
│   │       └── ProjectService.Infrastructure/ # Repositories, DbContext, Migrations
│   └── shared/
│       └── SharedKernel/          # Common models, enums, base entities
├── frontend/
│   └── collabsphere-web/         # React TypeScript app
│       └── src/
│           ├── components/        # Reusable UI components
│           ├── context/          # React Context (Auth, etc.)
│           ├── pages/            # Page components
│           ├── services/         # API service layer
│           └── types/            # TypeScript type definitions
├── docker-compose.yml            # All services orchestration
└── ProjectManagementApp.sln     # Visual Studio solution
```

## Development Commands

### Full Stack Development

```bash
# Start all services with Docker Compose
docker-compose up --build

# Stop all services
docker-compose down

# Rebuild specific service
docker-compose up --build project-service

# View logs for specific service
docker logs collabsphere-project-service
docker logs collabsphere-gateway
docker logs collabsphere-frontend
```

### Backend (.NET)

```bash
# Build entire solution
dotnet build ProjectManagementApp.sln

# Build specific service
dotnet build Backend/services/ProjectService/ProjectService.API/ProjectService.API.csproj

# Run ProjectService locally (requires PostgreSQL running)
dotnet run --project Backend/services/ProjectService/ProjectService.API/ProjectService.API.csproj

# Run Gateway locally
dotnet run --project Backend/gateway/Gateway.csproj

# Create new migration
cd Backend/services/ProjectService/ProjectService.Infrastructure
dotnet ef migrations add <MigrationName> --startup-project ../ProjectService.API/ProjectService.API.csproj

# Apply migrations
dotnet ef database update --startup-project ../ProjectService.API/ProjectService.API.csproj

# Restore packages
dotnet restore
```

### Frontend (React + TypeScript)

```bash
cd frontend/collabsphere-web

# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Key Architectural Patterns

### Clean Architecture (Backend)

The ProjectService follows Clean Architecture with dependency inversion:

- **Domain Layer** (`ProjectService.Domain`): Core entities, enums, domain logic. No dependencies.
- **Application Layer** (`ProjectService.Application`): Business logic, DTOs, service interfaces. Depends only on Domain.
- **Infrastructure Layer** (`ProjectService.Infrastructure`): Data access, external services (AWS Bedrock, Redis). Implements Application interfaces.
- **API Layer** (`ProjectService.API`): Controllers, middleware, dependency injection configuration. Entry point.

### API Gateway Pattern

All client requests flow through the Ocelot Gateway (`http://localhost:5000`), which routes to backend services:
- `/api/projects/*` → ProjectService
- `/api/milestones/*` → ProjectService

Gateway handles:
- JWT authentication validation
- Request routing
- CORS policy
- Rate limiting configuration

### Authentication & Authorization

JWT Bearer tokens are required for all API endpoints. Token claims include:
- `sub`: User ID
- `email`: User email
- `role`: One of `Lecturer`, `HeadDepartment`, `Admin`

Role-based permissions:
- **Lecturer**: Create/update projects, manage milestones, submit for approval
- **HeadDepartment**: Approve/reject projects
- **Admin**: Full access to all operations

### AI Integration (AWS Bedrock)

The `BedrockAIService` in ProjectService.Infrastructure integrates AWS Bedrock for:
- Intelligent milestone generation from project objectives
- Project timeline optimization recommendations

Configuration requires AWS credentials in environment variables:
- `AWS_REGION`
- `AWS_ACCESS_KEY`
- `AWS_SECRET_KEY`

## Service Ports

- **API Gateway**: `http://localhost:5000`
- **ProjectService**: `http://localhost:5003`
- **Frontend**: `http://localhost:3000`
- **PostgreSQL**: `localhost:5434`
- **Redis**: `localhost:6379`
- **RabbitMQ Management**: `http://localhost:15672` (admin/admin123)

## Database Schema

### Key Entities

**Projects**:
- Status workflow: `Pending` → `Approved` | `Denied` → `InProgress` → `Completed`
- Links to SyllabusId, ClassId
- Tracks CreatedBy, ApprovedBy, timestamps
- Soft delete support

**Milestones**:
- Belongs to Project (FK)
- Order-based sequencing
- Completion tracking with timestamps

**ProjectApprovals**:
- Stores approval/rejection history
- Links to ReviewerId
- Captures comments and review timestamp

## Important Notes

### Environment Configuration

Copy `.env.example` to `.env` and configure:
- Database credentials
- JWT secret (must match between Gateway and services)
- AWS Bedrock credentials for AI features
- Redis and RabbitMQ connection strings

### Database Migrations

ProjectService automatically applies migrations on startup (see `Program.cs:128-140`). For new migrations, use EF Core CLI targeting the Infrastructure project.

### Frontend-Backend Communication

Frontend uses `VITE_API_URL` environment variable to configure API gateway endpoint. In Docker, this is set to `http://localhost:5000/api`. When running frontend locally, ensure this points to the running gateway.

### SharedKernel Usage

The `SharedKernel` project contains common types used across services:
- `BaseEntity`: Base class with Id, timestamps, soft delete
- `Result<T>`: Result pattern for error handling
- `PagedResult<T>`: Pagination wrapper
- `ProjectStatus`, `UserRole`: Common enums

When adding new services, reference SharedKernel for consistency.

### Clean Architecture Dependency Rules

Never violate dependency direction:
- Domain → (nothing)
- Application → Domain
- Infrastructure → Application, Domain
- API → Application, Domain, Infrastructure (only in Program.cs for DI)

Controllers should only call Application layer services, never Infrastructure directly.

### Swagger Documentation

ProjectService Swagger UI is available at `http://localhost:5003` (development mode). It includes JWT Bearer authentication configuration - use the "Authorize" button to add your token.
