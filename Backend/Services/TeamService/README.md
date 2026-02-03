# TeamService

The TeamService is the most complex microservice in CollabSphere, responsible for managing teams, checkpoints, workspaces, and team milestone tracking in the Project-Based Learning environment.

## Architecture

This service follows Clean Architecture principles with four layers:

### Domain Layer (`TeamService.Domain`)
- **Entities**: Team, TeamMember, TeamMilestone, MilestoneQuestion, MilestoneAnswer, Checkpoint, CheckpointAssignment, CheckpointSubmission, Workspace
- **Enums**: TeamMilestoneStatus (NotStarted, InProgress, Completed), CheckpointStatus (Open, InProgress, Submitted, Completed)
- **Dependencies**: SharedKernel only

### Application Layer (`TeamService.Application`)
- **DTOs**: TeamDto, CheckpointDto, WorkspaceDto, TeamMilestoneDto, and their create/update variants
- **Interfaces**: ITeamService, ICheckpointService, IWorkspaceService, ITeamMilestoneService
- **Service Implementations**: Business logic for all team-related operations
- **Dependencies**: Domain, SharedKernel, EF Core

### Infrastructure Layer (`TeamService.Infrastructure`)
- **DbContext**: TeamDbContext with all entity configurations
- **Repositories**: Repository<T>, GenericRepository<T> for join tables
- **Database**: PostgreSQL with EF Core migrations
- **Dependencies**: Application, Domain, SharedKernel, EF Core, Npgsql

### API Layer (`TeamService.API`)
- **Controllers**: TeamsController, CheckpointsController, WorkspacesController, TeamMilestonesController
- **Authentication**: JWT Bearer token validation
- **Authorization**: Role-based access control (Lecturer, HeadDepartment, Admin)
- **Documentation**: Swagger/OpenAPI
- **Health Checks**: PostgreSQL health monitoring
- **Dependencies**: Application, Infrastructure

## Database Schema

### Teams
- **Primary Key**: Id (Guid)
- **Properties**: Name, ClassId, ProjectId (nullable), LeaderId
- **Relationships**:
  - Has many TeamMembers (cascade delete)
  - Has many TeamMilestones (cascade delete)
  - Has many Checkpoints (cascade delete)
  - Has one Workspace (cascade delete)

### TeamMembers (Join Table)
- **Composite Key**: TeamId + StudentId
- **Properties**: JoinedAt, ContributionPercentage
- **Relationships**: Belongs to Team

### TeamMilestones
- **Primary Key**: Id (Guid)
- **Properties**: TeamId, MilestoneId, Status, CompletedAt, MarkedBy
- **Unique Index**: TeamId + MilestoneId
- **Relationships**: Belongs to Team

### MilestoneQuestions
- **Primary Key**: Id (Guid)
- **Properties**: MilestoneId, Question, Order, CreatedBy
- **Relationships**: Has many MilestoneAnswers (cascade delete)

### MilestoneAnswers
- **Primary Key**: Id (Guid)
- **Properties**: QuestionId, TeamId, StudentId, Answer, SubmittedAt
- **Relationships**: Belongs to Question and Team

### Checkpoints
- **Primary Key**: Id (Guid)
- **Properties**: TeamId, Name, Description, DueDate, Status, CreatedBy
- **Relationships**:
  - Belongs to Team
  - Has many CheckpointAssignments (cascade delete)
  - Has many CheckpointSubmissions (cascade delete)

### CheckpointAssignments (Join Table)
- **Composite Key**: CheckpointId + StudentId
- **Relationships**: Belongs to Checkpoint

### CheckpointSubmissions
- **Primary Key**: Id (Guid)
- **Properties**: CheckpointId, TeamId, FileUrl, Description, SubmittedAt, SubmittedBy
- **Relationships**: Belongs to Checkpoint and Team

### Workspaces
- **Primary Key**: Id (Guid)
- **Properties**: TeamId, Cards (JSON string)
- **Unique Index**: TeamId
- **Relationships**: Belongs to Team (one-to-one)

## API Endpoints

### Teams (`/api/teams`)
- `GET /` - Get all teams
- `GET /{id}` - Get team by ID
- `GET /class/{classId}` - Get teams by class
- `GET /project/{projectId}` - Get teams by project
- `GET /student/{studentId}` - Get team by student
- `POST /` - Create team (Lecturer+)
- `PUT /{id}` - Update team (Lecturer+)
- `DELETE /{id}` - Delete team (Lecturer+)
- `POST /{id}/members` - Add team members (Lecturer+)
- `DELETE /{teamId}/members/{studentId}` - Remove team member (Lecturer+)
- `PUT /{teamId}/members/contribution` - Update contribution percentage (Lecturer+)

### Checkpoints (`/api/checkpoints`)
- `GET /{id}` - Get checkpoint by ID
- `GET /team/{teamId}` - Get checkpoints by team
- `POST /` - Create checkpoint (Lecturer+)
- `PUT /{id}` - Update checkpoint (Lecturer+)
- `DELETE /{id}` - Delete checkpoint (Lecturer+)
- `POST /submit?teamId={teamId}` - Submit checkpoint
- `GET /{id}/submissions` - Get checkpoint submissions

### Workspaces (`/api/workspaces`)
- `GET /team/{teamId}` - Get workspace by team (auto-creates if not exists)
- `PUT /team/{teamId}` - Update workspace cards
- `POST /team/{teamId}` - Create workspace

### Team Milestones (`/api/teammilestones`)
- `GET /{id}` - Get team milestone by ID
- `GET /team/{teamId}` - Get team milestones by team
- `GET /milestone/{milestoneId}` - Get team milestones by milestone
- `POST /` - Create team milestone (Lecturer+)
- `PUT /{id}` - Update team milestone status (Lecturer+)
- `DELETE /{id}` - Delete team milestone (Lecturer+)
- `POST /questions` - Create milestone question (Lecturer+)
- `GET /questions/milestone/{milestoneId}` - Get questions by milestone
- `DELETE /questions/{id}` - Delete question (Lecturer+)
- `POST /answers` - Submit milestone answer
- `GET /answers/team/{teamId}/question/{questionId}` - Get answers by team and question

## Running the Service

### Standalone (Development)
```bash
# Navigate to API project
cd Backend/services/TeamService/TeamService.API

# Run migrations
dotnet ef database update --project ../TeamService.Infrastructure/TeamService.Infrastructure.csproj

# Run the service
dotnet run
```

### With Docker Compose
```bash
# From repository root
docker-compose up team-service --build
```

## Configuration

### Environment Variables
- `ConnectionStrings__DefaultConnection` - PostgreSQL connection string
- `JwtSettings__Secret` - JWT secret key (min 32 chars)
- `JwtSettings__Issuer` - JWT issuer
- `JwtSettings__Audience` - JWT audience
- `Redis__ConnectionString` - Redis connection string

### Database
- **Database Name**: `collabsphere_team`
- **Port**: 5434 (local), 5432 (Docker)

### Service
- **Port**: 5008 (local), 8080 (Docker)
- **Health Check**: `/health`
- **Swagger**: Available at root `/` in development mode

## Development

### Creating Migrations
```bash
cd Backend/services/TeamService/TeamService.Infrastructure
dotnet ef migrations add <MigrationName> --startup-project ../TeamService.API/TeamService.API.csproj
```

### Applying Migrations
Migrations are applied automatically on service startup. To apply manually:
```bash
cd Backend/services/TeamService/TeamService.Infrastructure
dotnet ef database update --startup-project ../TeamService.API/TeamService.API.csproj
```

## Testing

Access Swagger UI at `http://localhost:5008` (standalone) or through the API Gateway at `http://localhost:5000/api/teams`, etc.

Use the "Authorize" button in Swagger to add your JWT Bearer token for authenticated requests.

## Dependencies

- ASP.NET Core 8.0
- Entity Framework Core 8.0
- PostgreSQL (Npgsql)
- JWT Bearer Authentication
- Redis (StackExchange.Redis)
- Swagger/OpenAPI
- SharedKernel (internal)
