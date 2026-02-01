using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Text;
using ChatService.Data;
using ChatService.Services;
using ChatService.Hubs;
using EventBus.Extensions;
using EventBus.RabbitMQ;
using Serilog;

var builder = WebApplication.CreateBuilder(args);

// ==================== Serilog Configuration ====================
Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .Enrich.FromLogContext()
    .Enrich.WithProperty("ServiceName", "ChatService")
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
builder.Services.AddDbContext<ChatDbContext>(options =>
{
    var connectionString = configuration.GetConnectionString("DefaultConnection");
    options.UseSqlServer(connectionString, sqlOptions =>
    {
        sqlOptions.EnableRetryOnFailure(
            maxRetryCount: 5,
            maxRetryDelay: TimeSpan.FromSeconds(30),
            errorNumbersToAdd: null);
        sqlOptions.MigrationsHistoryTable("__EFMigrationsHistory", "chat");
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
builder.Services.AddScoped<IChatService, ChatServiceImpl>();

// ==================== EventBus (RabbitMQ or InMemory) ====================
var useRabbitMQ = configuration.GetValue<bool>("UseRabbitMQ", false);

if (useRabbitMQ)
{
    var rabbitMQSettings = new RabbitMQSettings();
    configuration.GetSection("RabbitMQ").Bind(rabbitMQSettings);

    // Set default queue name for this service
    if (string.IsNullOrEmpty(rabbitMQSettings.QueueName))
    {
        rabbitMQSettings.QueueName = "chat_service_queue";
    }

    builder.Services.AddRabbitMQEventBus(rabbitMQSettings);
    Log.Information("Using RabbitMQ EventBus with host {HostName}", rabbitMQSettings.HostName);
}
else
{
    builder.Services.AddInMemoryEventBus();
    Log.Information("Using InMemory EventBus (for development/testing)");
}

// ==================== HttpClient ====================
builder.Services.AddHttpClient();

// ==================== SignalR ====================
builder.Services.AddSignalR(options =>
{
    options.EnableDetailedErrors = builder.Environment.IsDevelopment();
    options.MaximumReceiveMessageSize = 102400; // 100 KB
    options.KeepAliveInterval = TimeSpan.FromSeconds(15);
    options.ClientTimeoutInterval = TimeSpan.FromSeconds(30);
});

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
        Title = "Chat Service API",
        Version = "v1",
        Description = "Chat and Messaging microservice - handles conversations, messages, and real-time communication"
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
    .AddDbContextCheck<ChatDbContext>();

var app = builder.Build();

// ==================== Database Migration ====================
using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<ChatDbContext>();
    try
    {
        Log.Information("Initializing database for ChatService...");

        // Ensure database exists
        dbContext.Database.EnsureCreated();

        // Check if the required tables exist by querying INFORMATION_SCHEMA
        var tablesExist = false;
        try
        {
            using var command = dbContext.Database.GetDbConnection().CreateCommand();
            command.CommandText = "SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'ConversationParticipants'";
            dbContext.Database.OpenConnection();
            var result = command.ExecuteScalar();
            tablesExist = result != null && Convert.ToInt32(result) > 0;
        }
        catch (Exception ex)
        {
            Log.Warning(ex, "Could not check for existing tables");
        }

        if (!tablesExist)
        {
            Log.Warning("Required tables not found. Recreating database schema...");

            // Drop and recreate to ensure clean schema
            dbContext.Database.EnsureDeleted();
            dbContext.Database.EnsureCreated();

            Log.Information("Database schema created successfully");
        }
        else
        {
            Log.Information("Database schema already exists and is valid");
        }

        // Also try applying any migrations if they exist
        var pendingMigrations = dbContext.Database.GetPendingMigrations().ToList();
        if (pendingMigrations.Any())
        {
            Log.Information("Applying {Count} pending migrations...", pendingMigrations.Count);
            dbContext.Database.Migrate();
            Log.Information("Database migrations applied successfully");
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
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "Chat Service API v1");
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
app.MapHub<ChatHub>("/hubs/chat");
app.MapHealthChecks("/health");

// ==================== Start Application ====================
var port = configuration.GetValue<int>("Port", 5002);
var urls = $"http://0.0.0.0:{port}";

Log.Information("Starting Chat Service on {Urls}", urls);
Log.Information("SignalR Hub available at /hubs/chat");
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
    Log.Fatal(ex, "Chat Service terminated unexpectedly");
}
finally
{
    Log.CloseAndFlush();
}
