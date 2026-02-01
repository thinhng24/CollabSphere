using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Text;
using DocumentService.Data;
using DocumentService.Services;
using EventBus.Extensions;
using EventBus.RabbitMQ;
using Serilog;

var builder = WebApplication.CreateBuilder(args);

// ==================== Serilog Configuration ====================
Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .Enrich.FromLogContext()
    .Enrich.WithProperty("ServiceName", "DocumentService")
    .WriteTo.Console()
    .CreateLogger();

builder.Host.UseSerilog();

// ==================== Configuration ====================
var configuration = builder.Configuration;
var jwtSettings = configuration.GetSection("JwtSettings");
var secretKey = jwtSettings["SecretKey"] ?? "YourSuperSecretKeyThatIsAtLeast32CharactersLong!";
var issuer = jwtSettings["Issuer"] ?? "CommunicationModule";
var audience = jwtSettings["Audience"] ?? "CommunicationModuleUsers";

// ==================== Database ====================
builder.Services.AddDbContext<DocumentDbContext>(options =>
{
    var connectionString = configuration.GetConnectionString("DefaultConnection");
    options.UseSqlServer(connectionString, sqlOptions =>
    {
        sqlOptions.EnableRetryOnFailure(
            maxRetryCount: 5,
            maxRetryDelay: TimeSpan.FromSeconds(30),
            errorNumbersToAdd: null);
        sqlOptions.MigrationsHistoryTable("__EFMigrationsHistory", "document");
    });
});

// ==================== JWT Configuration ====================
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
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey)),
        ValidateIssuer = true,
        ValidIssuer = issuer,
        ValidateAudience = true,
        ValidAudience = audience,
        ValidateLifetime = true,
        ClockSkew = TimeSpan.Zero
    };
});

builder.Services.AddAuthorization();

// ==================== Services ====================
builder.Services.AddScoped<IDocumentService, DocumentServiceImpl>();

// ==================== EventBus (RabbitMQ or InMemory) ====================
var useRabbitMQ = configuration.GetValue<bool>("UseRabbitMQ", false);

if (useRabbitMQ)
{
    var rabbitMQSettings = new RabbitMQSettings();
    configuration.GetSection("RabbitMQ").Bind(rabbitMQSettings);

    // Set default queue name for this service
    if (string.IsNullOrEmpty(rabbitMQSettings.QueueName))
    {
        rabbitMQSettings.QueueName = "document_service_queue";
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
var allowedOrigins = configuration.GetSection("AllowedOrigins").Get<string[]>()
    ?? new[] { "http://localhost:3000", "http://localhost:5173" };

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
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
        options.JsonSerializerOptions.DictionaryKeyPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
    });
builder.Services.AddEndpointsApiExplorer();

// ==================== Swagger ====================
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Document Service API",
        Version = "v1",
        Description = "Document and File Management microservice - handles file uploads, storage, versioning, and access control"
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
    .AddDbContextCheck<DocumentDbContext>();

var app = builder.Build();

// ==================== Ensure Storage Directory ====================
var storagePath = configuration["Storage:BasePath"] ?? Path.Combine(Directory.GetCurrentDirectory(), "uploads");
if (!Directory.Exists(storagePath))
{
    Directory.CreateDirectory(storagePath);
    Log.Information("Created storage directory: {StoragePath}", storagePath);
}

// ==================== Database Migration ====================
using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<DocumentDbContext>();
    try
    {
        Log.Information("Initializing database for DocumentService...");

        // Check if we have any pending migrations
        var pendingMigrations = dbContext.Database.GetPendingMigrations().ToList();
        var appliedMigrations = dbContext.Database.GetAppliedMigrations().ToList();

        if (pendingMigrations.Any())
        {
            Log.Information("Applying {Count} pending migrations...", pendingMigrations.Count);
            dbContext.Database.Migrate();
            Log.Information("Database migrations applied successfully");
        }
        else if (!appliedMigrations.Any())
        {
            // No migrations exist - use EnsureCreated for development
            Log.Information("No migrations found, using EnsureCreated for schema creation...");

            // First, check if database exists but has no tables (corrupted state)
            try
            {
                var canConnect = dbContext.Database.CanConnect();
                if (canConnect)
                {
                    // Try to query - if it fails, we need to recreate
                    try
                    {
                        _ = dbContext.Documents.Any();
                        Log.Information("Database schema already exists");
                    }
                    catch
                    {
                        Log.Warning("Database exists but schema is incomplete, recreating...");
                        dbContext.Database.EnsureDeleted();
                        dbContext.Database.EnsureCreated();
                        Log.Information("Database schema created successfully");
                    }
                }
                else
                {
                    dbContext.Database.EnsureCreated();
                    Log.Information("Database created successfully");
                }
            }
            catch (Exception schemaEx)
            {
                Log.Warning(schemaEx, "Schema check failed, attempting full recreation...");
                dbContext.Database.EnsureDeleted();
                dbContext.Database.EnsureCreated();
                Log.Information("Database recreated successfully");
            }
        }
        else
        {
            Log.Information("Database is up to date with {Count} applied migrations", appliedMigrations.Count);
        }
    }
    catch (Exception ex)
    {
        Log.Error(ex, "Database initialization failed");
        throw; // Fail fast - don't start with broken database
    }
}

// ==================== Middleware Pipeline ====================
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "Document Service API v1");
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
var port = configuration.GetValue<int>("Port", 5003);
var urls = $"http://0.0.0.0:{port}";

Log.Information("Starting Document Service on {Urls}", urls);
Log.Information("Storage path: {StoragePath}", storagePath);
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
    Log.Fatal(ex, "Document Service terminated unexpectedly");
}
finally
{
    Log.CloseAndFlush();
}
