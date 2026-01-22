# CollabSphere Implementation Guide

This guide provides step-by-step instructions for completing the CollabSphere project implementation.

## 📋 Current Progress

### ✅ Completed
- [x] Project structure setup
- [x] Docker Compose configuration
- [x] Shared Kernel library (BaseEntity, Result, PagedResult, Enums)
- [x] Event Bus infrastructure
- [x] API Gateway (Ocelot) setup
- [x] AuthService project structure
- [x] AuthService Domain entities (User, RefreshToken)
- [x] AuthService Application DTOs

### 🔄 In Progress
- [ ] Complete AuthService implementation
- [ ] Implement remaining microservices
- [ ] Frontend development
- [ ] Testing and deployment

## 🚀 Next Steps for Each Team Member

### Member 1 - AuthService Implementation

#### Step 1: Complete Application Layer

**Create IAuthService interface:**
```csharp
// AuthService.Application/Interfaces/IAuthService.cs
public interface IAuthService
{
    Task<Result<AuthResponse>> RegisterAsync(RegisterRequest request);
    Task<Result<AuthResponse>> LoginAsync(LoginRequest request);
    Task<Result<AuthResponse>> RefreshTokenAsync(string refreshToken);
    Task<Result> LogoutAsync(string refreshToken);
}
```

**Create IUserService interface:**
```csharp
// AuthService.Application/Interfaces/IUserService.cs
public interface IUserService
{
    Task<Result<PagedResult<UserDto>>> GetAllUsersAsync(int pageNumber, int pageSize);
    Task<Result<UserDto>> GetUserByIdAsync(Guid id);
    Task<Result<UserDto>> UpdateUserAsync(Guid id, UpdateUserRequest request);
    Task<Result> DeactivateUserAsync(Guid id);
}
```

**Create IJwtService interface:**
```csharp
// AuthService.Application/Interfaces/IJwtService.cs
public interface IJwtService
{
    string GenerateAccessToken(User user);
    string GenerateRefreshToken();
    ClaimsPrincipal? ValidateToken(string token);
}
```

**Implement services in Application layer**

#### Step 2: Complete Infrastructure Layer

**Create AuthDbContext:**
```csharp
// AuthService.Infrastructure/Data/AuthDbContext.cs
public class AuthDbContext : DbContext
{
    public DbSet<User> Users { get; set; }
    public DbSet<RefreshToken> RefreshTokens { get; set; }
    
    public AuthDbContext(DbContextOptions<AuthDbContext> options) : base(options) { }
    
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // Configure entities
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Email).IsUnique();
            entity.Property(e => e.Email).IsRequired().HasMaxLength(255);
            entity.Property(e => e.FullName).IsRequired().HasMaxLength(255);
        });
        
        modelBuilder.Entity<RefreshToken>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.User)
                  .WithMany(u => u.RefreshTokens)
                  .HasForeignKey(e => e.UserId);
        });
    }
}
```

**Create Repository implementation:**
```csharp
// AuthService.Infrastructure/Repositories/Repository.cs
public class Repository<T> : IRepository<T> where T : BaseEntity
{
    protected readonly AuthDbContext _context;
    protected readonly DbSet<T> _dbSet;
    
    public Repository(AuthDbContext context)
    {
        _context = context;
        _dbSet = context.Set<T>();
    }
    
    // Implement all IRepository methods
}
```

**Create JwtService implementation:**
```csharp
// AuthService.Infrastructure/Services/JwtService.cs
public class JwtService : IJwtService
{
    private readonly IConfiguration _configuration;
    
    public JwtService(IConfiguration configuration)
    {
        _configuration = configuration;
    }
    
    public string GenerateAccessToken(User user)
    {
        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.Role, user.Role.ToString())
        };
        
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["JwtSettings:Secret"]));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        
        var token = new JwtSecurityToken(
            issuer: _configuration["JwtSettings:Issuer"],
            audience: _configuration["JwtSettings:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(int.Parse(_configuration["JwtSettings:ExpiryMinutes"])),
            signingCredentials: creds
        );
        
        return new JwtSecurityTokenHandler().WriteToken(token);
    }
    
    // Implement other methods
}
```

#### Step 3: Create API Controllers

**AuthController:**
```csharp
// AuthService.API/Controllers/AuthController.cs
[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    
    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }
    
    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        var result = await _authService.RegisterAsync(request);
        if (!result.IsSuccess)
            return BadRequest(result);
        return Ok(result);
    }
    
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        var result = await _authService.LoginAsync(request);
        if (!result.IsSuccess)
            return Unauthorized(result);
        return Ok(result);
    }
    
    // Implement other endpoints
}
```

**UsersController:**
```csharp
// AuthService.API/Controllers/UsersController.cs
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class UsersController : ControllerBase
{
    private readonly IUserService _userService;
    
    public UsersController(IUserService userService)
    {
        _userService = userService;
    }
    
    [HttpGet]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetAll([FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 10)
    {
        var result = await _userService.GetAllUsersAsync(pageNumber, pageSize);
        return Ok(result);
    }
    
    // Implement other endpoints
}
```

#### Step 4: Configure Program.cs

```csharp
// AuthService.API/Program.cs
var builder = WebApplication.CreateBuilder(args);

// Add services
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Database
builder.Services.AddDbContext<AuthDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// JWT Authentication
var jwtSettings = builder.Configuration.GetSection("JwtSettings");
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtSettings["Issuer"],
            ValidAudience = jwtSettings["Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings["Secret"]))
        };
    });

// Register services
builder.Services.AddScoped(typeof(IRepository<>), typeof(Repository<>));
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<IJwtService, JwtService>();

// Redis
builder.Services.AddStackExchangeRedisCache(options =>
{
    options.Configuration = builder.Configuration["Redis:ConnectionString"];
});

// CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader();
    });
});

var app = builder.Build();

// Configure middleware
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowAll");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();
```

#### Step 5: Create Migrations

```bash
cd AuthService.API
dotnet ef migrations add InitialCreate --project ../AuthService.Infrastructure
dotnet ef database update --project ../AuthService.Infrastructure
```

#### Step 6: Create Dockerfile

```dockerfile
# AuthService/Dockerfile
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 8080

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY ["services/AuthService/AuthService.API/AuthService.API.csproj", "services/AuthService/AuthService.API/"]
COPY ["services/AuthService/AuthService.Application/AuthService.Application.csproj", "services/AuthService/AuthService.Application/"]
COPY ["services/AuthService/AuthService.Domain/AuthService.Domain.csproj", "services/AuthService/AuthService.Domain/"]
COPY ["services/AuthService/AuthService.Infrastructure/AuthService.Infrastructure.csproj", "services/AuthService/AuthService.Infrastructure/"]
COPY ["shared/SharedKernel/SharedKernel.csproj", "shared/SharedKernel/"]
COPY ["shared/EventBus/EventBus.csproj", "shared/EventBus/"]

RUN dotnet restore "services/AuthService/AuthService.API/AuthService.API.csproj"

COPY services/AuthService/ services/AuthService/
COPY shared/ shared/

WORKDIR "/src/services/AuthService/AuthService.API"
RUN dotnet build "AuthService.API.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "AuthService.API.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "AuthService.API.dll"]
```

#### Step 7: Frontend - Login/Register Pages

**Create Login Component:**
```jsx
// frontend/src/pages/Login.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await authService.login({ email, password });
      localStorage.setItem('accessToken', response.data.accessToken);
      localStorage.setItem('refreshToken', response.data.refreshToken);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div className="login-container">
      <h2>Login to CollabSphere</h2>
      {error && <div className="error">{error}</div>}
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit">Login</button>
      </form>
    </div>
  );
};

export default Login;
```

**Create Auth Service:**
```javascript
// frontend/src/services/authService.js
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_GATEWAY_URL || 'http://localhost:5000';

const authService = {
  login: (credentials) => {
    return axios.post(`${API_URL}/api/auth/login`, credentials);
  },
  
  register: (userData) => {
    return axios.post(`${API_URL}/api/auth/register`, userData);
  },
  
  logout: () => {
    const refreshToken = localStorage.getItem('refreshToken');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    return axios.post(`${API_URL}/api/auth/logout`, { refreshToken });
  },
  
  refreshToken: () => {
    const refreshToken = localStorage.getItem('refreshToken');
    return axios.post(`${API_URL}/api/auth/refresh`, { refreshToken });
  }
};

export default authService;
```

---

### Member 2 - AcademicService Implementation

Follow similar structure as AuthService:

1. **Create Domain Entities:**
   - Subject
   - Syllabus
   - Class
   - ClassMember

2. **Create Application DTOs:**
   - SubjectDto, CreateSubjectRequest
   - SyllabusDto, CreateSyllabusRequest
   - ClassDto, CreateClassRequest
   - ImportRequest (for Excel import)

3. **Create Services:**
   - ISubjectService, SubjectService
   - ISyllabusService, SyllabusService
   - IClassService, ClassService
   - IImportService, ImportService (using EPPlus for Excel)

4. **Create Controllers:**
   - SubjectsController
   - SyllabusController
   - ClassesController

5. **Frontend:**
   - Subject management pages
   - Syllabus management pages
   - Class management dashboard
   - Excel import UI

---

### Member 3 - ProjectService Implementation

1. **Create Domain Entities:**
   - Project
   - Milestone
   - ProjectApproval
   - ProjectAssignment

2. **Create Application DTOs:**
   - ProjectDto, CreateProjectRequest
   - MilestoneDto, CreateMilestoneRequest
   - ApprovalRequest

3. **Create Services:**
   - IProjectService, ProjectService
   - IMilestoneService, MilestoneService
   - IAIService, AIService (AWS Bedrock integration)

4. **Create Controllers:**
   - ProjectsController
   - MilestonesController

5. **Frontend:**
   - Project creation/management pages
   - Milestone management
   - Approval workflow UI (Head Dept)

---

### Member 4 - TeamService Implementation

1. **Create Domain Entities:**
   - Team
   - TeamMember
   - Checkpoint
   - WorkspaceCard
   - Task
   - Subtask

2. **Create Application DTOs:**
   - TeamDto, CreateTeamRequest
   - CheckpointDto, CreateCheckpointRequest
   - WorkspaceDto, CardDto, TaskDto

3. **Create Services:**
   - ITeamService, TeamService
   - ICheckpointService, CheckpointService
   - IWorkspaceService, WorkspaceService

4. **Create Controllers:**
   - TeamsController
   - CheckpointsController
   - WorkspaceController

5. **Frontend:**
   - Team management dashboard
   - Checkpoint submission UI
   - Workspace with drag-and-drop (React DnD)
   - Sprint board

---

### Member 5 - CommunicationService Implementation

1. **Create Domain Entities:**
   - Conversation
   - Message
   - Resource
   - Notification

2. **Create SignalR Hub:**
   - ChatHub (for real-time messaging)

3. **Create Services:**
   - IChatService, ChatService
   - INotificationService, NotificationService
   - IResourceService, ResourceService (Cloudinary integration)
   - IEmailService, EmailService

4. **Create Controllers:**
   - ChatController
   - NotificationsController
   - ResourcesController

5. **Frontend:**
   - Real-time chat UI (SignalR client)
   - Notification dropdown
   - File upload/download
   - Resource management

---

### Member 6 - RealtimeService Implementation

1. **Create Domain Entities:**
   - Meeting
   - MeetingParticipant
   - WhiteboardSession
   - WhiteboardData

2. **Create SignalR Hub:**
   - MeetingHub (WebRTC signaling)

3. **Create Socket.IO Server:**
   - WhiteboardServer (for collaborative whiteboard)

4. **Create Services:**
   - IMeetingService, MeetingService
   - IWhiteboardService, WhiteboardService

5. **Create Controllers:**
   - MeetingsController
   - WhiteboardController

6. **Frontend:**
   - Video meeting UI (WebRTC)
   - Interactive whiteboard (Socket.IO)
   - Meeting scheduler
   - Screen sharing controls

---

## 🧪 Testing Strategy

### Unit Tests
```csharp
// Example: AuthService.Tests/Services/AuthServiceTests.cs
public class AuthServiceTests
{
    [Fact]
    public async Task Login_WithValidCredentials_ReturnsAuthResponse()
    {
        // Arrange
        var mockRepo = new Mock<IRepository<User>>();
        var mockJwtService = new Mock<IJwtService>();
        var authService = new AuthService(mockRepo.Object, mockJwtService.Object);
        
        // Act
        var result = await authService.LoginAsync(new LoginRequest 
        { 
            Email = "test@example.com", 
            Password = "password123" 
        });
        
        // Assert
        Assert.True(result.IsSuccess);
        Assert.NotNull(result.Data);
    }
}
```

### Integration Tests
```csharp
// Example: AuthService.IntegrationTests/AuthControllerTests.cs
public class AuthControllerTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client;
    
    public AuthControllerTests(WebApplicationFactory<Program> factory)
    {
        _client = factory.CreateClient();
    }
    
    [Fact]
    public async Task Login_ReturnsOk()
    {
        var response = await _client.PostAsJsonAsync("/api/auth/login", new 
        { 
            Email = "test@example.com", 
            Password = "password123" 
        });
        
        response.EnsureSuccessStatusCode();
    }
}
```

---

## 📦 Deployment Checklist

### Pre-Deployment
- [ ] All unit tests passing
- [ ] Integration tests passing
- [ ] Code review completed
- [ ] Documentation updated
- [ ] Environment variables configured
- [ ] Database migrations ready

### Docker Deployment
```bash
# Build all services
docker-compose build

# Run all services
docker-compose up -d

# Check logs
docker-compose logs -f

# Stop all services
docker-compose down
```

### Production Deployment
```bash
# Tag images
docker tag collabsphere-authservice:latest registry.example.com/authservice:v1.0.0

# Push to registry
docker push registry.example.com/authservice:v1.0.0

# Deploy to Kubernetes/Azure/AWS
kubectl apply -f k8s/deployment.yml
```

---

## 📚 Additional Resources

- [ASP.NET Core Documentation](https://docs.microsoft.com/en-us/aspnet/core/)
- [Entity Framework Core](https://docs.microsoft.com/en-us/ef/core/)
- [React Documentation](https://react.dev/)
- [Docker Documentation](https://docs.docker.com/)
- [Ocelot Documentation](https://ocelot.readthedocs.io/)
- [SignalR Documentation](https://docs.microsoft.com/en-us/aspnet/core/signalr/)
- [WebRTC Documentation](https://webrtc.org/)

---

## 🆘 Troubleshooting

### Common Issues

**Issue: Database connection failed**
```bash
# Check PostgreSQL is running
docker ps | grep postgres

# Check connection string in appsettings.json
# Ensure host, port, database name, username, and password are correct
```

**Issue: JWT token validation failed**
```bash
# Ensure JWT secret is the same in all services
# Check token expiry time
# Verify issuer and audience match
```

**Issue: CORS errors in frontend**
```bash
# Add CORS policy in each service
# Ensure API Gateway allows CORS
# Check frontend API URL configuration
```

---

## 📞 Support

For questions or issues:
1. Check this implementation guide
2. Review the main README.md
3. Check existing issues in the repository
4. Create a new issue with detailed description

---

**Good luck with the implementation! 🚀**
