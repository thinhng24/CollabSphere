using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using ProjectManagementApp.Data;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
        options.JsonSerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
        options.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
    });

// Configure Database
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseMySql(
        builder.Configuration.GetConnectionString("DefaultConnection"),
        ServerVersion.AutoDetect(builder.Configuration.GetConnectionString("DefaultConnection"))
    ));

// Configure JWT Authentication
var jwtSettings = builder.Configuration.GetSection("Jwt");
var key = Encoding.UTF8.GetBytes(jwtSettings["Key"]!);

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
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
        IssuerSigningKey = new SymmetricSecurityKey(key),
        ClockSkew = TimeSpan.Zero
    };
    
    // Handle authentication errors
    options.Events = new JwtBearerEvents
    {
        OnAuthenticationFailed = context =>
        {
            if (context.Exception.GetType() == typeof(SecurityTokenExpiredException))
            {
                context.Response.Headers.Append("Token-Expired", "true");
            }
            return Task.CompletedTask;
        },
        OnChallenge = context =>
        {
            context.HandleResponse();
            context.Response.StatusCode = 401;
            context.Response.ContentType = "application/json";
            var result = JsonSerializer.Serialize(new { message = "Unauthorized" });
            return context.Response.WriteAsync(result);
        }
    };
});

// Add Authorization
builder.Services.AddAuthorization();

// Add CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll",
        builder =>
        {
            builder.AllowAnyOrigin()
                   .AllowAnyHeader()
                   .AllowAnyMethod();
        });
});

// Add Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { 
        Title = "Project Management API", 
        Version = "v1",
        Description = "API for Project Management System"
    });
    
    // Add JWT Authentication to Swagger
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Example: \"Bearer {token}\"",
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

var app = builder.Build();

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowAll");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

// Initialize Database
using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    dbContext.Database.EnsureCreated();
    await SeedData(dbContext);
}

app.Run();

async Task SeedData(AppDbContext context)
{
    if (!context.Users.Any())
    {
        // Create lecturer
        var lecturer = new ProjectManagementApp.Models.User
        {
            Name = "Dr. Nguyen Van A",
            Email = "lecturer@example.com",
            Password = "password123",
            Role = "Lecturer",
            CreatedAt = DateTime.UtcNow
        };
        context.Users.Add(lecturer);

        // Create students
        var students = new List<ProjectManagementApp.Models.User>
        {
            new ProjectManagementApp.Models.User 
            { 
                Name = "Student 1", 
                Email = "student1@example.com", 
                Password = "password123", 
                Role = "Student",
                CreatedAt = DateTime.UtcNow
            },
            new ProjectManagementApp.Models.User 
            { 
                Name = "Student 2", 
                Email = "student2@example.com", 
                Password = "password123", 
                Role = "Student",
                CreatedAt = DateTime.UtcNow
            },
            new ProjectManagementApp.Models.User 
            { 
                Name = "Student 3", 
                Email = "student3@example.com", 
                Password = "password123", 
                Role = "Student",
                CreatedAt = DateTime.UtcNow
            },
            new ProjectManagementApp.Models.User 
            { 
                Name = "Student 4", 
                Email = "student4@example.com", 
                Password = "password123", 
                Role = "Student",
                CreatedAt = DateTime.UtcNow
            }
        };
        context.Users.AddRange(students);
        await context.SaveChangesAsync();

        // Create team
        var team = new ProjectManagementApp.Models.Team
        {
            Name = "Team Alpha",
            LecturerId = lecturer.Id,
            CreatedAt = DateTime.UtcNow
        };
        context.Teams.Add(team);
        await context.SaveChangesAsync();

        // Add students to team
        foreach (var student in students)
        {
            context.TeamMembers.Add(new ProjectManagementApp.Models.TeamMember
            {
                TeamId = team.Id,
                UserId = student.Id,
                JoinedAt = DateTime.UtcNow
            });
        }
        await context.SaveChangesAsync();

        // Create sample checkpoint
        var checkpoint = new ProjectManagementApp.Models.Checkpoint
        {
            TeamId = team.Id,
            Title = "Checkpoint 1: Project Proposal",
            Description = "Submit your project proposal document",
            DueDate = DateTime.UtcNow.AddDays(7),
            CreatedAt = DateTime.UtcNow
        };
        context.Checkpoints.Add(checkpoint);
        await context.SaveChangesAsync();

        // Create sample tasks
        var tasks = new List<ProjectManagementApp.Models.Task>
        {
            new ProjectManagementApp.Models.Task 
            { 
                TeamId = team.Id, 
                Title = "Research requirements", 
                Status = "Done", 
                Order = 0, 
                CreatedAt = DateTime.UtcNow,
                Deadline = DateTime.UtcNow.AddDays(2),
                AssigneeId = students[0].Id 
            },
            new ProjectManagementApp.Models.Task 
            { 
                TeamId = team.Id, 
                Title = "Design database schema", 
                Status = "Doing", 
                Order = 0, 
                CreatedAt = DateTime.UtcNow,
                Deadline = DateTime.UtcNow.AddDays(4),
                AssigneeId = students[1].Id 
            },
            new ProjectManagementApp.Models.Task 
            { 
                TeamId = team.Id, 
                Title = "Create API endpoints", 
                Status = "To Do", 
                Order = 0, 
                CreatedAt = DateTime.UtcNow,
                Deadline = DateTime.UtcNow.AddDays(6),
                AssigneeId = students[2].Id 
            },
            new ProjectManagementApp.Models.Task 
            { 
                TeamId = team.Id, 
                Title = "Design UI mockups", 
                Status = "To Do", 
                Order = 1, 
                CreatedAt = DateTime.UtcNow,
                Deadline = DateTime.UtcNow.AddDays(8)
            }
        };
        context.Tasks.AddRange(tasks);
        await context.SaveChangesAsync();

        // Create sample subtasks
        var subtasks = new List<ProjectManagementApp.Models.Subtask>
        {
            new ProjectManagementApp.Models.Subtask 
            { 
                TaskId = tasks[0].Id, 
                Title = "Analyze user stories", 
                IsDone = true,
                Order = 0,
                CreatedAt = DateTime.UtcNow
            },
            new ProjectManagementApp.Models.Subtask 
            { 
                TaskId = tasks[0].Id, 
                Title = "Define MVP features", 
                IsDone = true,
                Order = 1,
                CreatedAt = DateTime.UtcNow
            },
            new ProjectManagementApp.Models.Subtask 
            { 
                TaskId = tasks[1].Id, 
                Title = "Design ER diagram", 
                IsDone = true,
                Order = 0,
                CreatedAt = DateTime.UtcNow
            },
            new ProjectManagementApp.Models.Subtask 
            { 
                TaskId = tasks[1].Id, 
                Title = "Create migrations", 
                IsDone = false,
                Order = 1,
                CreatedAt = DateTime.UtcNow
            },
            new ProjectManagementApp.Models.Subtask 
            { 
                TaskId = tasks[2].Id, 
                Title = "Setup controllers", 
                IsDone = false,
                Order = 0,
                CreatedAt = DateTime.UtcNow
            },
            new ProjectManagementApp.Models.Subtask 
            { 
                TaskId = tasks[3].Id, 
                Title = "Design homepage", 
                IsDone = false,
                Order = 0,
                CreatedAt = DateTime.UtcNow
            }
        };
        context.Subtasks.AddRange(subtasks);
        await context.SaveChangesAsync();
    }
}