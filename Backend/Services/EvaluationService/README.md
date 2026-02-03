# EvaluationService

Evaluation Management Service for CollabSphere - handles team, member, milestone answer, and checkpoint evaluations.

## Architecture

Clean Architecture with four layers:

- **Domain**: Entities and enums
- **Application**: Business logic, DTOs, service interfaces
- **Infrastructure**: Data access, repositories, DbContext
- **API**: Controllers, middleware, dependency injection

## Entities

### TeamEvaluation
- Evaluates entire team performance
- Fields: TeamId, EvaluatorId, EvaluatorType (Lecturer/Peer), Score, Comments, EvaluatedAt

### MemberEvaluation
- Evaluates individual team member performance
- Fields: TeamId, EvaluatedStudentId, EvaluatorId, EvaluatorType (Lecturer/Peer), Score, Comments, EvaluatedAt

### MilestoneAnswerEvaluation
- Evaluates milestone answer submissions
- Fields: MilestoneAnswerId, EvaluatorId, EvaluatorType (Lecturer/Peer), Score, Feedback, EvaluatedAt

### CheckpointEvaluation
- Evaluates checkpoint submissions (lecturer only)
- Fields: CheckpointSubmissionId, EvaluatorId, Score, Feedback, EvaluatedAt

## API Endpoints

### Team Evaluations
- `POST /api/evaluations/team` - Create team evaluation (Lecturer, Student)
- `GET /api/evaluations/team/{id}` - Get team evaluation by ID
- `GET /api/evaluations/team/by-team/{teamId}` - Get all evaluations for a team
- `GET /api/evaluations/team/by-evaluator/{evaluatorId}` - Get evaluations by evaluator
- `PUT /api/evaluations/team/{id}` - Update team evaluation (Lecturer, Student)
- `DELETE /api/evaluations/team/{id}` - Delete team evaluation (Lecturer, Admin)

### Member Evaluations
- `POST /api/evaluations/member` - Create member evaluation (Lecturer, Student)
- `GET /api/evaluations/member/{id}` - Get member evaluation by ID
- `GET /api/evaluations/member/by-team/{teamId}` - Get all member evaluations for a team
- `GET /api/evaluations/member/by-student/{studentId}` - Get evaluations for a student
- `GET /api/evaluations/member/by-evaluator/{evaluatorId}` - Get evaluations by evaluator
- `PUT /api/evaluations/member/{id}` - Update member evaluation (Lecturer, Student)
- `DELETE /api/evaluations/member/{id}` - Delete member evaluation (Lecturer, Admin)

### Milestone Answer Evaluations
- `POST /api/evaluations/milestone-answer` - Create milestone answer evaluation (Lecturer, Student)
- `GET /api/evaluations/milestone-answer/{id}` - Get evaluation by ID
- `GET /api/evaluations/milestone-answer/by-answer/{milestoneAnswerId}` - Get evaluations for an answer
- `GET /api/evaluations/milestone-answer/by-evaluator/{evaluatorId}` - Get evaluations by evaluator
- `PUT /api/evaluations/milestone-answer/{id}` - Update evaluation (Lecturer, Student)
- `DELETE /api/evaluations/milestone-answer/{id}` - Delete evaluation (Lecturer, Admin)

### Checkpoint Evaluations
- `POST /api/evaluations/checkpoint` - Create checkpoint evaluation (Lecturer only)
- `GET /api/evaluations/checkpoint/{id}` - Get evaluation by ID
- `GET /api/evaluations/checkpoint/by-submission/{checkpointSubmissionId}` - Get evaluations for a submission
- `GET /api/evaluations/checkpoint/by-evaluator/{evaluatorId}` - Get evaluations by evaluator
- `PUT /api/evaluations/checkpoint/{id}` - Update evaluation (Lecturer only)
- `DELETE /api/evaluations/checkpoint/{id}` - Delete evaluation (Lecturer, Admin)

## Configuration

### Database
- PostgreSQL database: `collabsphere_evaluation`
- Connection string in `appsettings.json`

### JWT Authentication
- Uses shared JWT configuration
- Required claims: sub (user ID), role

### Port
- API runs on port 5009
- Docker exposes port 8080 internally

## Development Commands

```bash
# Build the service
dotnet build Backend/services/EvaluationService/EvaluationService.API/EvaluationService.API.csproj

# Run locally
dotnet run --project Backend/services/EvaluationService/EvaluationService.API/EvaluationService.API.csproj

# Create migration
cd Backend/services/EvaluationService/EvaluationService.Infrastructure
dotnet ef migrations add <MigrationName> --startup-project ../EvaluationService.API/EvaluationService.API.csproj

# Apply migrations
dotnet ef database update --startup-project ../EvaluationService.API/EvaluationService.API.csproj

# Run with Docker
docker-compose up --build evaluation-service
```

## Authorization Rules

- **Lecturer Role**: Can create, update, and delete all evaluation types
- **Student Role**: Can create and update peer evaluations (team, member, milestone answer)
- **Admin Role**: Can delete any evaluation
- **Checkpoint Evaluations**: Lecturer role only

## Dependencies

- SharedKernel for common entities and result patterns
- PostgreSQL for data storage
- Redis for caching
- JWT Bearer authentication
