# ProjectService - Complete Implementation Code

Copy và paste code dưới đây vào các file tương ứng.

## Domain Layer

### Entities/Milestone.cs
```csharp
using SharedKernel.Entities;

namespace ProjectService.Domain.Entities;

public class Milestone : BaseEntity
{
    public Guid ProjectId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public DateTime DueDate { get; set; }
    public int Order { get; set; }
    public bool IsCompleted { get; set; } = false;
    public DateTime? CompletedAt { get; set; }
    
    // Navigation
    public Project Project { get; set; } = null!;
}
```

### Entities/ProjectApproval.cs
```csharp
using SharedKernel.Entities;
using SharedKernel.Enums;

namespace ProjectService.Domain.Entities;

public class ProjectApproval : BaseEntity
{
    public Guid ProjectId { get; set; }
    public Guid ReviewerId { get; set; }
    public ProjectStatus Status { get; set; }
    public string? Comments { get; set; }
    public DateTime ReviewedAt { get; set; } = DateTime.UtcNow;
    
    // Navigation
    public Project Project { get; set; } = null!;
}
```

## Application Layer

### Application.csproj
```xml
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <TargetFramework>net8.0</TargetFramework>
    <ImplicitUsings>enable</ImplicitUsings>
    <Nullable>enable</Nullable>
  </PropertyGroup>

  <ItemGroup>
    <PackageReference Include="AutoMapper" Version="12.0.1" />
    <PackageReference Include="FluentValidation" Version="11.9.0" />
    <PackageReference Include="MediatR" Version="12.2.0" />
  </ItemGroup>

  <ItemGroup>
    <ProjectReference Include="..\ProjectService.Domain\ProjectService.Domain.csproj" />
    <ProjectReference Include="..\..\..\shared\SharedKernel\SharedKernel.csproj" />
    <ProjectReference Include="..\..\..\shared\EventBus\EventBus.csproj" />
  </ItemGroup>
</Project>
```

### DTOs/ProjectDto.cs
```csharp
using SharedKernel.Enums;

namespace ProjectService.Application.DTOs;

public class ProjectDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Objectives { get; set; } = string.Empty;
    public Guid? SyllabusId { get; set; }
    public Guid? ClassId { get; set; }
    public ProjectStatus Status { get; set; }
    public Guid CreatedBy { get; set; }
    public DateTime CreatedAt { get; set; }
    public List<MilestoneDto> Milestones { get; set; } = new();
}
```

### DTOs/CreateProjectRequest.cs
```csharp
namespace ProjectService.Application.DTOs;

public class CreateProjectRequest
{
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Objectives { get; set; } = string.Empty;
    public Guid? SyllabusId { get; set; }
    public Guid? ClassId { get; set; }
}
```

### DTOs/MilestoneDto.cs
```csharp
namespace ProjectService.Application.DTOs;

public class MilestoneDto
{
    public Guid Id { get; set; }
    public Guid ProjectId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public DateTime DueDate { get; set; }
    public int Order { get; set; }
    public bool IsCompleted { get; set; }
}
```

### DTOs/CreateMilestoneRequest.cs
```csharp
namespace ProjectService.Application.DTOs;

public class CreateMilestoneRequest
{
    public Guid ProjectId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public DateTime DueDate { get; set; }
    public int Order { get; set; }
}
```

### Interfaces/IProjectService.cs
```csharp
using ProjectService.Application.DTOs;
using SharedKernel.Common;
using SharedKernel.Enums;

namespace ProjectService.Application.Interfaces;

public interface IProjectService
{
    Task<Result<PagedResult<ProjectDto>>> GetAllProjectsAsync(int pageNumber, int pageSize);
    Task<Result<ProjectDto>> GetProjectByIdAsync(Guid id);
    Task<Result<ProjectDto>> CreateProjectAsync(CreateProjectRequest request, Guid userId);
    Task<Result<ProjectDto>> UpdateProjectAsync(Guid id, UpdateProjectRequest request);
    Task<Result> DeleteProjectAsync(Guid id);
    Task<Result> SubmitForApprovalAsync(Guid id);
    Task<Result> ApproveProjectAsync(Guid id, Guid reviewerId, string? comments);
    Task<Result> RejectProjectAsync(Guid id, Guid reviewerId, string reason);
}
```

### Interfaces/IMilestoneService.cs
```csharp
using ProjectService.Application.DTOs;
using SharedKernel.Common;

namespace ProjectService.Application.Interfaces;

public interface IMilestoneService
{
    Task<Result<List<MilestoneDto>>> GetMilestonesByProjectIdAsync(Guid projectId);
    Task<Result<MilestoneDto>> GetMilestoneByIdAsync(Guid id);
    Task<Result<MilestoneDto>> CreateMilestoneAsync(CreateMilestoneRequest request);
    Task<Result<MilestoneDto>> UpdateMilestoneAsync(Guid id, UpdateMilestoneRequest request);
    Task<Result> DeleteMilestoneAsync(Guid id);
    Task<Result> CompleteMilestoneAsync(Guid id);
}
```

### Services/ProjectServiceImpl.cs
```csharp
using Microsoft.EntityFrameworkCore;
using ProjectService.Application.DTOs;
using ProjectService.Application.Interfaces;
using ProjectService.Domain.Entities;
using SharedKernel.Common;
using SharedKernel.Enums;
using SharedKernel.Interfaces;

namespace ProjectService.Application.Services;

public class ProjectServiceImpl : IProjectService
{
    private readonly IRepository<Project> _projectRepository;
    private readonly IRepository<ProjectApproval> _approvalRepository;

    public ProjectServiceImpl(
        IRepository<Project> projectRepository,
        IRepository<ProjectApproval> approvalRepository)
    {
        _projectRepository = projectRepository;
        _approvalRepository = approvalRepository;
    }

    public async Task<Result<PagedResult<ProjectDto>>> GetAllProjectsAsync(int pageNumber, int pageSize)
    {
        var query = _projectRepository.GetAll()
            .Include(p => p.Milestones)
            .Where(p => !p.IsDeleted);
            
        var totalCount = await query.CountAsync();

        var projects = await query
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .Select(p => new ProjectDto
            {
                Id = p.Id,
                Name = p.Name,
                Description = p.Description,
                Objectives = p.Objectives,
                SyllabusId = p.SyllabusId,
                ClassId = p.ClassId,
                Status = p.Status,
                CreatedBy = p.CreatedBy,
                CreatedAt = p.CreatedAt,
                Milestones = p.Milestones.Select(m => new MilestoneDto
                {
                    Id = m.Id,
                    ProjectId = m.ProjectId,
                    Title = m.Title,
                    Description = m.Description,
                    DueDate = m.DueDate,
                    Order = m.Order,
                    IsCompleted = m.IsCompleted
                }).ToList()
            })
            .ToListAsync();

        var pagedResult = new PagedResult<ProjectDto>
        {
            Items = projects,
            TotalCount = totalCount,
            PageNumber = pageNumber,
            PageSize = pageSize
        };

        return Result<PagedResult<ProjectDto>>.Success(pagedResult);
    }

    public async Task<Result<ProjectDto>> GetProjectByIdAsync(Guid id)
    {
        var project = await _projectRepository.GetAll()
            .Include(p => p.Milestones)
            .FirstOrDefaultAsync(p => p.Id == id && !p.IsDeleted);

        if (project == null)
            return Result<ProjectDto>.Failure("Project not found");

        var projectDto = new ProjectDto
        {
            Id = project.Id,
            Name = project.Name,
            Description = project.Description,
            Objectives = project.Objectives,
            SyllabusId = project.SyllabusId,
            ClassId = project.ClassId,
            Status = project.Status,
            CreatedBy = project.CreatedBy,
            CreatedAt = project.CreatedAt,
            Milestones = project.Milestones.Select(m => new MilestoneDto
            {
                Id = m.Id,
                ProjectId = m.ProjectId,
                Title = m.Title,
                Description = m.Description,
                DueDate = m.DueDate,
                Order = m.Order,
                IsCompleted = m.IsCompleted
            }).ToList()
        };

        return Result<ProjectDto>.Success(projectDto);
    }

    public async Task<Result<ProjectDto>> CreateProjectAsync(CreateProjectRequest request, Guid userId)
    {
        var project = new Project
        {
            Name = request.Name,
            Description = request.Description,
            Objectives = request.Objectives,
            SyllabusId = request.SyllabusId,
            ClassId = request.ClassId,
            Status = ProjectStatus.Pending,
            CreatedBy = userId
        };

        await _projectRepository.AddAsync(project);

        var projectDto = new ProjectDto
        {
            Id = project.Id,
            Name = project.Name,
            Description = project.Description,
            Objectives = project.Objectives,
            SyllabusId = project.SyllabusId,
            ClassId = project.ClassId,
            Status = project.Status,
            CreatedBy = project.CreatedBy,
            CreatedAt = project.CreatedAt
        };

        return Result<ProjectDto>.Success(projectDto);
    }

    public async Task<Result<ProjectDto>> UpdateProjectAsync(Guid id, UpdateProjectRequest request)
    {
        var project = await _projectRepository.GetByIdAsync(id);

        if (project == null)
            return Result<ProjectDto>.Failure("Project not found");

        if (project.Status == ProjectStatus.Approved)
            return Result<ProjectDto>.Failure("Cannot update approved project");

        project.Name = request.Name ?? project.Name;
        project.Description = request.Description ?? project.Description;
        project.Objectives = request.Objectives ?? project.Objectives;
        project.UpdatedAt = DateTime.UtcNow;

        await _projectRepository.UpdateAsync(project);

        var projectDto = new ProjectDto
        {
            Id = project.Id,
            Name = project.Name,
            Description = project.Description,
            Objectives = project.Objectives,
            Status = project.Status,
            CreatedBy = project.CreatedBy,
            CreatedAt = project.CreatedAt
        };

        return Result<ProjectDto>.Success(projectDto);
    }

    public async Task<Result> DeleteProjectAsync(Guid id)
    {
        var project = await _projectRepository.GetByIdAsync(id);

        if (project == null)
            return Result.Failure("Project not found");

        await _projectRepository.DeleteAsync(id);
        return Result.Success();
    }

    public async Task<Result> SubmitForApprovalAsync(Guid id)
    {
        var project = await _projectRepository.GetByIdAsync(id);

        if (project == null)
            return Result.Failure("Project not found");

        if (project.Status != ProjectStatus.Pending)
            return Result.Failure("Project is not in pending status");

        project.Status = ProjectStatus.Pending;
        project.SubmittedAt = DateTime.UtcNow;
        await _projectRepository.UpdateAsync(project);

        return Result.Success();
    }

    public async Task<Result> ApproveProjectAsync(Guid id, Guid reviewerId, string? comments)
    {
        var project = await _projectRepository.GetByIdAsync(id);

        if (project == null)
            return Result.Failure("Project not found");

        project.Status = ProjectStatus.Approved;
        project.ApprovedAt = DateTime.UtcNow;
        project.ApprovedBy = reviewerId;
        await _projectRepository.UpdateAsync(project);

        var approval = new ProjectApproval
        {
            ProjectId = id,
            ReviewerId = reviewerId,
            Status = ProjectStatus.Approved,
            Comments = comments,
            ReviewedAt = DateTime.UtcNow
        };

        await _approvalRepository.AddAsync(approval);

        return Result.Success();
    }

    public async Task<Result> RejectProjectAsync(Guid id, Guid reviewerId, string reason)
    {
        var project = await _projectRepository.GetByIdAsync(id);

        if (project == null)
            return Result.Failure("Project not found");

        project.Status = ProjectStatus.Denied;
        project.RejectionReason = reason;
        await _projectRepository.UpdateAsync(project);

        var approval = new ProjectApproval
        {
            ProjectId = id,
            ReviewerId = reviewerId,
            Status = ProjectStatus.Denied,
            Comments = reason,
            ReviewedAt = DateTime.UtcNow
        };

        await _approvalRepository.AddAsync(approval);

        return Result.Success();
    }
}
```

## Infrastructure Layer

### Infrastructure.csproj
```xml
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <TargetFramework>net8.0</TargetFramework>
    <ImplicitUsings>enable</ImplicitUsings>
    <Nullable>enable</Nullable>
  </PropertyGroup>

  <ItemGroup>
    <PackageReference Include="Microsoft.EntityFrameworkCore" Version="8.0.0" />
    <PackageReference Include="Microsoft.EntityFrameworkCore.Design" Version="8.0.0" />
    <PackageReference Include="Npgsql.EntityFrameworkCore.PostgreSQL" Version="8.0.0" />
  </ItemGroup>

  <ItemGroup>
    <ProjectReference Include="..\ProjectService.Domain\ProjectService.Domain.csproj" />
    <ProjectReference Include="..\ProjectService.Application\ProjectService.Application.csproj" />
    <ProjectReference Include="..\..\..\shared\SharedKernel\SharedKernel.csproj" />
  </ItemGroup>
</Project>
```

### Data/ProjectDbContext.cs
```csharp
using Microsoft.EntityFrameworkCore;
using ProjectService.Domain.Entities;

namespace ProjectService.Infrastructure.Data;

public class ProjectDbContext : DbContext
{
    public DbSet<Project> Projects { get; set; }
    public DbSet<Milestone> Milestones { get; set; }
    public DbSet<ProjectApproval> ProjectApprovals { get; set; }

    public ProjectDbContext(DbContextOptions<ProjectDbContext> options) : base(options)
    {
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Project>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(255);
            entity.Property(e => e.Description).IsRequired();
            entity.Property(e => e.Objectives).IsRequired();
            entity.Property(e => e.Status).IsRequired();
            entity.Property(e => e.CreatedBy).IsRequired();

            entity.HasMany(e => e.Milestones)
                .WithOne(m => m.Project)
                .HasForeignKey(m => m.ProjectId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasMany(e => e.Approvals)
                .WithOne(a => a.Project)
                .HasForeignKey(a => a.ProjectId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Milestone>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Title).IsRequired().HasMaxLength(255);
            entity.Property(e => e.Description).IsRequired();
            entity.Property(e => e.DueDate).IsRequired();
            entity.Property(e => e.Order).IsRequired();
        });

        modelBuilder.Entity<ProjectApproval>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Status).IsRequired();
            entity.Property(e => e.ReviewedAt).IsRequired();
        });
    }
}
```

### Repositories/Repository.cs
```csharp
using Microsoft.EntityFrameworkCore;
using ProjectService.Infrastructure.Data;
using SharedKernel.Entities;
using SharedKernel.Interfaces;

namespace ProjectService.Infrastructure.Repositories;

public class Repository<T> : IRepository<T> where T : BaseEntity
{
    protected readonly ProjectDbContext _context;
    protected readonly DbSet<T> _dbSet;

    public Repository(ProjectDbContext context)
    {
        _context = context;
        _dbSet = context.Set<T>();
    }

    public async Task<T?> GetByIdAsync(Guid id)
    {
        return await _dbSet.FirstOrDefaultAsync(e => e.Id == id && !e.IsDeleted);
    }

    public IQueryable<T> GetAll()
    {
        return _dbSet.Where(e => !e.IsDeleted);
    }

    public async Task<T> AddAsync(T entity)
    {
        await _dbSet.AddAsync(entity);
        await _context.SaveChangesAsync();
        return entity;
    }

    public async Task<T> UpdateAsync(T entity)
    {
        entity.UpdatedAt = DateTime.UtcNow;
        _dbSet.Update(entity);
        await _context.SaveChangesAsync();
        return entity;
    }

    public async Task DeleteAsync(Guid id)
    {
        var entity = await GetByIdAsync(id);
        if (entity != null)
        {
            entity.IsDeleted = true;
            entity.DeletedAt = DateTime.UtcNow;
            await UpdateAsync(entity);
        }
    }

    public async Task<bool> ExistsAsync(Guid id)
    {
        return await _dbSet.AnyAsync(e => e.Id == id && !e.IsDeleted);
    }
}
```

## API Layer

### API.csproj
```xml
<Project Sdk="Microsoft.NET.Sdk.Web">
  <PropertyGroup>
    <TargetFramework>net8.0</TargetFramework>
    <Nullable>enable</Nullable>
    <ImplicitUsings>enable</ImplicitUsings>
  </PropertyGroup>

  <ItemGroup>
    <PackageReference Include="Microsoft.AspNetCore.Authentication.JwtBearer" Version="8.0.0" />
    <PackageReference Include="Microsoft.EntityFrameworkCore.Design" Version="8.0.0" />
    <PackageReference Include="Swashbuckle.AspNetCore" Version="6.5.0" />
    <PackageReference Include="StackExchange.Redis" Version="2.7.10" />
  </ItemGroup>

  <ItemGroup>
    <ProjectReference Include="..\ProjectService.Application\ProjectService.Application.csproj" />
    <ProjectReference Include="..\ProjectService.Infrastructure\ProjectService.Infrastructure.csproj" />
  </ItemGroup>
</Project>
```

### Controllers/ProjectsController.cs
```csharp
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ProjectService.Application.DTOs;
using ProjectService.Application.Interfaces;
using System.Security.Claims;

namespace ProjectService.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ProjectsController : ControllerBase
{
    private readonly IProjectService _projectService;

    public ProjectsController(IProjectService projectService)
    {
        _projectService = projectService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 10)
    {
        var result = await _projectService.GetAllProjectsAsync(pageNumber, pageSize);
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var result = await _projectService.GetProjectByIdAsync(id);
        if (!result.IsSuccess)
            return NotFound(result);
        return Ok(result);
    }

    [HttpPost]
    [Authorize(Roles = "Lecturer")]
    public async Task<IActionResult> Create([FromBody] CreateProjectRequest request)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        if (userIdClaim == null)
            return Unauthorized();

        var userId = Guid.Parse(userIdClaim.Value);
        var result = await _projectService.CreateProjectAsync(request, userId);

        if (!result.IsSuccess)
            return BadRequest(result);

        return CreatedAtAction(nameof(GetById), new { id = result.Data!.Id }, result);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Lecturer")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateProjectRequest request)
    {
        var result = await _projectService.UpdateProjectAsync(id, request);
        if (!result.IsSuccess)
            return BadRequest(result);
        return Ok(result);
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Lecturer,Admin")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var result = await _projectService.DeleteProjectAsync(id);
        if (!result.IsSuccess)
            return BadRequest(result);
        return Ok(result);
    }

    [HttpPost("{id}/submit")]
    [Authorize(Roles = "Lecturer")]
    public async Task<IActionResult> Submit(Guid id)
    {
        var result = await _projectService.SubmitForApprovalAsync(id);
        if (!result.IsSuccess)
            return BadRequest(result);
        return Ok(result);
    }

    [HttpPost("{id}/approve")]
    [Authorize(Roles = "HeadDepartment")]
    public async Task<IActionResult> Approve(Guid id, [FromBody] ApprovalRequest request)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        if (userIdClaim == null)
            return Unauthorized();

        var reviewerId = Guid.Parse(userIdClaim.Value);
        var result = await _projectService.ApproveProjectAsync(id, reviewerId, request.Comments);

        if (!result.IsSuccess)
            return BadRequest(result);
        return Ok(result);
    }

    [HttpPost("{id}/reject")]
    [Authorize(Roles = "HeadDepartment")]
    public async Task<IActionResult> Reject(Guid id, [FromBody] RejectionRequest request)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        if (userIdClaim == null)
            return Unauthorized();

        var reviewerId = Guid.Parse(userIdClaim.Value);
        var result = await _projectService.RejectProjectAsync(id, reviewerId, request.Reason);

        if (!result.IsSuccess)
            return BadRequest(result);
        return Ok(result);
    }
}

public class ApprovalRequest
{
    public string? Comments { get; set; }
}

public class RejectionRequest
{
    public string Reason { get; set; } = string.Empty;
}

public class UpdateProjectRequest
{
    public string? Name { get; set; }
    public string? Description { get; set; }
    public string? Objectives { get; set; }
}
```

### Program.cs
```csharp
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using ProjectService.Application.Interfaces;
using ProjectService.Application.Services;
using ProjectService.Infrastructure.Data;
using ProjectService.Infrastructure.Repositories;
using SharedKernel.Interfaces;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo 
    { 
        Title = "ProjectService API", 
        Version = "v1",
        Description = "Project and Milestone Management Service"
    });
    
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });
    
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

builder.Services.AddDbContext<ProjectDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

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
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings["Secret"]!)),
            ClockSkew = TimeSpan.Zero
        };
    });

builder.Services.AddAuthorization();

builder.Services.AddScoped(typeof(IRepository<>), typeof(Repository<>));
builder.Services.AddScoped<IProjectService, ProjectServiceImpl>();
builder.Services.AddScoped<IMilestoneService, MilestoneService>();

builder.Services.AddStackExchangeRedisCache(options =>
{
    options.Configuration = builder.Configuration["Redis:ConnectionString"];
});

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader();
    });
});

builder.Services.AddHealthChecks()
    .AddNpgSql(builder.Configuration.GetConnectionString("DefaultConnection")!);

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "ProjectService API V1");
        c.RoutePrefix = string.Empty;
    });
}

app.UseCors("AllowAll");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.MapHealthChecks("/health");

using (var scope = app.Services.CreateScope())
{
    try
    {
        var dbContext = scope.ServiceProvider.GetRequiredService<ProjectDbContext>();
        dbContext.Database.Migrate();
        Console.WriteLine("✅ Database migrated successfully");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"❌ Error migrating database: {ex.Message}");
    }
}

Console.WriteLine("🚀 ProjectService is running...");
app.Run();
```

### appsettings.json
```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  },
  "AllowedHosts": "*",
  "ConnectionStrings": {
    "DefaultConnection": "Host=postgres-project;Port=5432;Database=projectdb;Username=postgres;Password=postgres123"
  },
  "JwtSettings": {
    "Secret": "YourSuperSecretKeyForJWTTokenGeneration123456789",
    "Issuer": "CollabSphere",
    "Audience": "CollabSphereUsers"
  },
  "Redis": {
    "ConnectionString": "redis:6379"
  }
}
```

## Dockerfile
```dockerfile
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 8080

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY ["shared/SharedKernel/SharedKernel.csproj", "shared/SharedKernel/"]
COPY ["shared/EventBus/EventBus.csproj", "shared/EventBus/"]
COPY ["services/ProjectService/ProjectService.API/ProjectService.API.csproj", "services/ProjectService/ProjectService.API/"]
COPY ["services/ProjectService/ProjectService.Application/ProjectService.Application.csproj", "services/ProjectService/ProjectService.Application/"]
COPY ["services/ProjectService/ProjectService.Domain/ProjectService.Domain.csproj", "services/ProjectService/ProjectService.Domain/"]
COPY ["services/ProjectService/ProjectService.Infrastructure/ProjectService.Infrastructure.csproj", "services/ProjectService/ProjectService.Infrastructure/"]

RUN dotnet restore "services/ProjectService/ProjectService.API/ProjectService.API.csproj"

COPY shared/ shared/
COPY services/ProjectService/ services/ProjectService/

WORKDIR "/src/services/ProjectService/ProjectService.API"
RUN dotnet build "ProjectService.API.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "Project
