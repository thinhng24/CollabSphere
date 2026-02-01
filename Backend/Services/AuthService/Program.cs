using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Text;
using AuthService.Data;
using AuthService.Services;
using EventBus.Extensions;
using EventBus.RabbitMQ;
using Serilog;

var builder = WebApplication.CreateBuilder(args);

// ==================== Serilog Configuration ====================
Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .Enrich.FromLogContext()
    .Enrich.WithProperty("ServiceName", "AuthService")
    .WriteTo.Console()
    .CreateLogger();

builder.Host.UseSerilog();

// ==================== Configuration ====================
var configuration = builder.Configuration;
var jwtSettings = configuration.GetSection("JwtSettings").Get<JwtSettings>() ?? new JwtSettings();

// ==================== Database ====================
builder.Services.AddDbContext<AuthDbContext>(options =>
{
    var connectionString = configuration.GetConnectionString("DefaultConnection");
    options.UseSqlServer(connectionString, sqlOptions =>
    {
        sqlOptions.EnableRetryOnFailure(
            maxRetryCount: 5,
            maxRetryDelay: TimeSpan.FromSeconds(30),
            errorNumbersToAdd: null);
    });
});

// ==================== JWT Configuration ====================
builder.Services.Configure<JwtSettings>(configuration.GetSection("JwtSettings"));

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings.SecretKey)),
        ValidateIssuer = true,
        ValidIssuer = jwtSettings.Issuer,
        ValidateAudience = true,
        ValidAudience = jwtSettings.Audience,
        ValidateLifetime = true,
        ClockSkew = TimeSpan.Zero
    };

    // For SignalR
    options.Events = new JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            var accessToken = context.Request.Query["access_token"];
            var path = context.HttpContext.Request.Path;

            if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hubs"))
            {
                context.Token = accessToken;
            }

            return Task.CompletedTask;
        }
    };
});

builder.Services.AddAuthorization();

// ==================== Services ====================
builder.Services.AddScoped<IAuthService, AuthServiceImpl>();

// ==================== EventBus (RabbitMQ or InMemory) ====================
var useRabbitMQ = configuration.GetValue<bool>("UseRabbitMQ", false);

if (useRabbitMQ)
{
    var rabbitMQSettings = new RabbitMQSettings();
    configuration.GetSection("RabbitMQ").Bind(rabbitMQSettings);

    // Set default queue name for this service
    if (string.IsNullOrEmpty(rabbitMQSettings.QueueName))
    {
        rabbitMQSettings.QueueName = "auth_service_queue";
    }

    builder.Services.AddRabbitMQEventBus(rabbitMQSettings);
    Log.Information("Using RabbitMQ EventBus with host {HostName}", rabbitMQSettings.HostName);
}
else
{
    builder.Services.AddInMemoryEventBus();
    Log.Information("Using InMemory EventBus (for development/testing)");
}

// ==================== CORS ====================
var allowedOrigins = configuration.GetSection("AllowedOrigins").Get<string[]>() ?? new[] { "http://localhost:3000" };

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins(allowedOrigins)
            .AllowAnyMethod()
            .AllowAnyHeader()
            .AllowCredentials();
    });
});

// ==================== Controllers ====================
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

// ==================== Swagger ====================
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Auth Service API",
        Version = "v1",
        Description = "Authentication and Authorization microservice - handles user registration, login, and JWT tokens"
    });

    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Enter 'Bearer' [space] and then your token.",
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

// ==================== Health Checks ====================
builder.Services.AddHealthChecks()
    .AddDbContextCheck<AuthDbContext>();

var app = builder.Build();

// ==================== Database Migration ====================
using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<AuthDbContext>();
    try
    {
        Log.Information("Ensuring database schema for AuthService...");

        // Check if Users table exists
        var canConnect = dbContext.Database.CanConnect();
        if (canConnect)
        {
            try
            {
                // Try to query - if fails, schema doesn't exist
                var userCount = dbContext.Users.Count();
                Log.Information("Database schema exists with {Count} users", userCount);
            }
            catch
            {
                // Schema doesn't exist, recreate
                Log.Warning("Schema not found, recreating database...");
                dbContext.Database.EnsureDeleted();
                dbContext.Database.EnsureCreated();
                Log.Information("Database schema created successfully");
            }
        }
        else
        {
            // Database doesn't exist, create it
            dbContext.Database.EnsureCreated();
            Log.Information("Database created successfully");
        }
    }
    catch (Exception ex)
    {
        Log.Error(ex, "Failed to initialize database, attempting full recreate...");
        try
        {
            dbContext.Database.EnsureDeleted();
            dbContext.Database.EnsureCreated();
            Log.Information("Database recreated successfully");
        }
        catch (Exception innerEx)
        {
            Log.Error(innerEx, "Failed to recreate database");
        }
    }
}

// ==================== Middleware Pipeline ====================
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "Auth Service API v1");
    });
}

app.UseSerilogRequestLogging(options =>
{
    options.MessageTemplate = "HTTP {RequestMethod} {RequestPath} responded {StatusCode} in {Elapsed:0.0000} ms";
});

app.UseCors();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapHealthChecks("/health");

// ==================== Start Application ====================
var port = configuration.GetValue<int>("Port", 5001);
var urls = $"http://0.0.0.0:{port}";

Log.Information("Starting Auth Service on {Urls}", urls);
Log.Information("Swagger UI available at /swagger");
Log.Information("Health check available at /health");
Log.Information("EventBus: {EventBusType}", useRabbitMQ ? "RabbitMQ" : "InMemory");

app.Urls.Add(urls);

try
{
    await app.RunAsync();
}
catch (Exception ex)
{
    Log.Fatal(ex, "Auth Service terminated unexpectedly");
}
finally
{
    Log.CloseAndFlush();
}
