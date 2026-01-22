# AuthService - Authentication & User Management

## Overview
AuthService handles authentication, authorization, and user management for the CollabSphere platform.

## Features
- ✅ User Registration
- ✅ User Login with JWT
- ✅ Refresh Token mechanism
- ✅ Password change
- ✅ User management (CRUD)
- ✅ Role-based authorization (Admin, Staff, HeadDepartment, Lecturer, Student)
- ✅ Account activation/deactivation

## Architecture
```
AuthService/
├── AuthService.API/           # Web API Layer
│   ├── Controllers/
│   │   ├── AuthController.cs
│   │   └── UsersController.cs
│   ├── Program.cs
│   └── appsettings.json
├── AuthService.Application/   # Business Logic Layer
│   ├── DTOs/
│   ├── Interfaces/
│   └── Services/
├── AuthService.Domain/        # Domain Layer
│   └── Entities/
├── AuthService.Infrastructure/ # Data Access Layer
│   ├── Data/
│   ├── Repositories/
│   └── Services/
└── Dockerfile
```

## Tech Stack
- ASP.NET Core 8.0 Web API
- Entity Framework Core 8.0
- PostgreSQL 16
- JWT Bearer Authentication
- BCrypt for password hashing
- Redis for caching
- Swagger/OpenAPI

## Getting Started

### Prerequisites
- .NET 8.0 SDK
- PostgreSQL 16
- Redis (optional for local dev)

### Run Locally

1. **Update connection string** in `appsettings.json`:
```json
"ConnectionStrings": {
  "DefaultConnection": "Host=localhost;Port=5432;Database=authdb;Username=postgres;Password=your_password"
}
```

2. **Create database migrations**:
```bash
cd AuthService.API
dotnet ef migrations add InitialCreate --project ../AuthService.Infrastructure
```

3. **Run the application**:
```bash
dotnet run
```

4. **Access Swagger UI**:
```
http://localhost:5001
```

### Run with Docker

From the CollabSphere root directory:
```bash
docker-compose up auth-service
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout
- `POST /api/auth/change-password` - Change password (requires auth)

### User Management
- `GET /api/users` - Get all users (Admin only)
- `GET /api/users/{id}` - Get user by ID
- `GET /api/users/email/{email}` - Get user by email
- `PUT /api/users/{id}` - Update user
- `DELETE /api/users/{id}` - Deactivate user (Admin only)
- `POST /api/users/{id}/activate` - Activate user (Admin only)

## Example Requests

### Register
```bash
curl -X POST http://localhost:5001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "Password@123",
    "fullName": "John Doe",
    "phoneNumber": "1234567890",
    "role": 5
  }'
```

### Login
```bash
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@collabsphere.com",
    "password": "Admin@123"
  }'
```

### Get All Users (with token)
```bash
curl -X GET http://localhost:5001/api/users \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Default Admin Account
```
Email: admin@collabsphere.com
Password: Admin@123
Role: Admin
```

## Database Schema

### Users Table
- Id (UUID, PK)
- Email (string, unique)
- PasswordHash (string)
- FullName (string)
- PhoneNumber (string)
- Role (enum: Admin=1, Staff=2, HeadDepartment=3, Lecturer=4, Student=5)
- IsActive (boolean)
- LastLoginAt (datetime)
- CreatedAt (datetime)
- UpdatedAt (datetime)
- IsDeleted (boolean)
- DeletedAt (datetime)

### RefreshTokens Table
- Id (UUID, PK)
- Token (string, unique)
- UserId (UUID, FK)
- ExpiresAt (datetime)
- IsRevoked (boolean)
- RevokedAt (datetime)
- CreatedAt (datetime)

## Security
- Passwords are hashed using BCrypt
- JWT tokens expire after 60 minutes
- Refresh tokens expire after 7 days
- Role-based authorization for protected endpoints
- CORS enabled for development

## Testing

### Unit Tests
```bash
cd AuthService.Tests
dotnet test
```

### Integration Tests
```bash
cd AuthService.IntegrationTests
dotnet test
```

## Troubleshooting

### Database connection failed
- Check PostgreSQL is running
- Verify connection string in appsettings.json
- Ensure database exists

### JWT validation failed
- Check JWT secret matches across services
- Verify token hasn't expired
- Ensure issuer and audience are correct

### Migration errors
```bash
# Drop database and recreate
dotnet ef database drop --project AuthService.Infrastructure
dotnet ef database update --project AuthService.Infrastructure
```

## Next Steps for Team Members

This AuthService is now **complete and ready to use** as a reference for implementing other services:

1. **Member 2 (AcademicService)**: Copy this structure and adapt for subjects/classes
2. **Member 3 (ProjectService)**: Follow the same pattern for projects/milestones
3. **Member 4 (TeamService)**: Use this as template for teams/workspace
4. **Member 5 (CommunicationService)**: Adapt for chat/notifications
5. **Member 6 (RealtimeService)**: Follow pattern for meetings/whiteboard

## Contributing
Follow the clean architecture pattern demonstrated in this service.

## License
MIT
