using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Text;
using NotificationService.Data;
using NotificationService.Hubs;
using NotificationService.Services;
using NotificationService.EventHandlers;
using EventBus.Extensions;
using EventBus.Events;
using EventBus.RabbitMQ;
using Serilog;

var builder = WebApplication.CreateBuilder(args);

// ==================== Serilog Configuration ====================
Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .Enrich.FromLogContext()
    .Enrich.WithProperty("ServiceName", "NotificationService")
    .WriteTo.Console(outputTemplate: "[{Timestamp:HH:mm:ss} {Level:u3}] [{SourceContext}] {Message:lj}{NewLine}{Exception}")
    .CreateLogger();

builder.Host.UseSerilog();

// ==================== Configuration ====================
var configuration = builder.Configuration;
var jwtSettings = configuration.GetSection("JwtSettings");
var secretKey = jwtSettings["SecretKey"] ?? "YourSuperSecretKeyThatIsAtLeast32CharactersLong!";
var issuer = jwtSettings["Issuer"] ?? "CommunicationModule";
var audience = jwtSettings["Audience"] ?? "CommunicationModuleUsers";

// ==================== Database ====================
builder.Services.AddDbContext<NotificationDbContext>(options =>
{
    var connectionString = configuration.GetConnectionString("DefaultConnection");
    options.UseSqlServer(connectionString, sqlOptions =>
    {
        sqlOptions.EnableRetryOnFailure(
            maxRetryCount: 5,
            maxRetryDelay: TimeSpan.FromSeconds(30),
            errorNumbersToAdd: null);
        sqlOptions.MigrationsHistoryTable("__EFMigrationsHistory", "notification");
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
builder.Services.AddScoped<INotificationService, NotificationServiceImpl>();

// ==================== Event Handlers ====================
// Chat event handlers
builder.Services.AddTransient<MessageSentEventHandler>();
builder.Services.AddTransient<ConversationCreatedEventHandler>();
builder.Services.AddTransient<ParticipantJoinedEventHandler>();
builder.Services.AddTransient<ParticipantLeftEventHandler>();
builder.Services.AddTransient<UserOnlineEventHandler>();
builder.Services.AddTransient<UserOfflineEventHandler>();

// Document event handlers
builder.Services.AddTransient<DocumentUploadedEventHandler>();
builder.Services.AddTransient<DocumentSharedEventHandler>();
builder.Services.AddTransient<DocumentDeletedEventHandler>();
builder.Services.AddTransient<DocumentVersionCreatedEventHandler>();
builder.Services.AddTransient<DocumentPermissionChangedEventHandler>();

// User event handlers
builder.Services.AddTransient<UserRegisteredEventHandler>();

// ==================== EventBus (RabbitMQ or InMemory) ====================
var useRabbitMQ = configuration.GetValue<bool>("UseRabbitMQ", false);

if (useRabbitMQ)
{
    var rabbitMQSettings = new RabbitMQSettings();
    configuration.GetSection("RabbitMQ").Bind(rabbitMQSettings);

    // Set default queue name for this service
    if (string.IsNullOrEmpty(rabbitMQSettings.QueueName))
    {
        rabbitMQSettings.QueueName = "notification_service_queue";
    }

    builder.Services.AddRabbitMQEventBus(rabbitMQSettings);
    Log.Information("Using RabbitMQ EventBus with host {HostName}", rabbitMQSettings.HostName);
}
else
{
    builder.Services.AddInMemoryEventBus();
    Log.Information("Using InMemory EventBus (for development/testing)");
}

// Configure event subscriptions
builder.Services.ConfigureEventBus(configurator =>
{
    // Chat events
    configurator.Subscribe<MessageSentEvent, MessageSentEventHandler>();
    configurator.Subscribe<ConversationCreatedEvent, ConversationCreatedEventHandler>();
    configurator.Subscribe<ParticipantJoinedEvent, ParticipantJoinedEventHandler>();
    configurator.Subscribe<ParticipantLeftEvent, ParticipantLeftEventHandler>();
    configurator.Subscribe<UserOnlineEvent, UserOnlineEventHandler>();
    configurator.Subscribe<UserOfflineEvent, UserOfflineEventHandler>();

    // Document events
    configurator.Subscribe<DocumentUploadedEvent, DocumentUploadedEventHandler>();
    configurator.Subscribe<DocumentSharedEvent, DocumentSharedEventHandler>();
    configurator.Subscribe<DocumentDeletedEvent, DocumentDeletedEventHandler>();
    configurator.Subscribe<DocumentVersionCreatedEvent, DocumentVersionCreatedEventHandler>();
    configurator.Subscribe<DocumentPermissionChangedEvent, DocumentPermissionChangedEventHandler>();

    // User events
    configurator.Subscribe<UserRegisteredEvent, UserRegisteredEventHandler>();
});

// ==================== SignalR ====================
builder.Services.AddSignalR(options =>
{
    options.EnableDetailedErrors = builder.Environment.IsDevelopment();
    options.MaximumReceiveMessageSize = 32768; // 32 KB
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
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

// ==================== Swagger ====================
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Notification Service API",
        Version = "v1",
        Description = "Notification microservice - handles push notifications, real-time alerts, and notification preferences"
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
    .AddDbContextCheck<NotificationDbContext>();

// ==================== Background Services ====================
builder.Services.AddHostedService<NotificationCleanupService>();

var app = builder.Build();

// ==================== Database Migration ====================
using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<NotificationDbContext>();
    try
    {
        Log.Information("Initializing database for NotificationService...");

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
                        _ = dbContext.Notifications.Any();
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
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "Notification Service API v1");
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
app.MapHub<NotificationHub>("/hubs/notifications");
app.MapHealthChecks("/health");

// ==================== Start Application ====================
var port = configuration.GetValue<int>("Port", 5004);
var urls = $"http://0.0.0.0:{port}";

Log.Information("Starting Notification Service on {Urls}", urls);
Log.Information("SignalR Hub available at /hubs/notifications");
Log.Information("Swagger UI available at /swagger");
Log.Information("Health check available at /health");

app.Urls.Add(urls);

try
{
    await app.RunAsync();
}
catch (Exception ex)
{
    Log.Fatal(ex, "Notification Service terminated unexpectedly");
}
finally
{
    Log.CloseAndFlush();
}

// ==================== Background Service for Cleanup ====================
public class NotificationCleanupService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<NotificationCleanupService> _logger;
    private readonly TimeSpan _interval = TimeSpan.FromHours(1);

    public NotificationCleanupService(
        IServiceProvider serviceProvider,
        ILogger<NotificationCleanupService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Notification cleanup service started");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await Task.Delay(_interval, stoppingToken);

                using var scope = _serviceProvider.CreateScope();
                var notificationService = scope.ServiceProvider.GetRequiredService<INotificationService>();

                _logger.LogInformation("Running notification cleanup tasks...");

                var expiredCount = await notificationService.CleanupExpiredNotificationsAsync(stoppingToken);
                var oldCount = await notificationService.CleanupOldNotificationsAsync(30, stoppingToken);
                var mutesCount = await notificationService.CleanupExpiredMutesAsync(stoppingToken);
                var subscriptionsCount = await notificationService.CleanupFailedSubscriptionsAsync(5, stoppingToken);

                _logger.LogInformation(
                    "Cleanup completed: {Expired} expired, {Old} old, {Mutes} mutes, {Subscriptions} subscriptions removed",
                    expiredCount, oldCount, mutesCount, subscriptionsCount);
            }
            catch (OperationCanceledException)
            {
                // Expected when stopping
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during notification cleanup");
            }
        }

        _logger.LogInformation("Notification cleanup service stopped");
    }
}
