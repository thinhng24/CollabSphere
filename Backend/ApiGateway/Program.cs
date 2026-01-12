using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using Serilog;
using Yarp.ReverseProxy.Configuration;

var builder = WebApplication.CreateBuilder(args);

// ==================== Serilog Configuration ====================
Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .Enrich.FromLogContext()
    .Enrich.WithProperty("ServiceName", "ApiGateway")
    .WriteTo.Console()
    .CreateLogger();

builder.Host.UseSerilog();

// ==================== Configuration ====================
var configuration = builder.Configuration;
var jwtSettings = configuration.GetSection("JwtSettings");
var secretKey = jwtSettings["SecretKey"] ?? "YourSuperSecretKeyThatIsAtLeast32CharactersLong!";
var issuer = jwtSettings["Issuer"] ?? "CommunicationModule";
var audience = jwtSettings["Audience"] ?? "CommunicationModuleUsers";

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

    // For SignalR WebSocket connections
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

// ==================== YARP Reverse Proxy ====================
builder.Services.AddReverseProxy()
    .LoadFromConfig(configuration.GetSection("ReverseProxy"));

// ==================== Health Checks ====================
builder.Services.AddHealthChecks();

var app = builder.Build();

// ==================== Middleware Pipeline ====================
app.UseSerilogRequestLogging(options =>
{
    options.MessageTemplate = "[Gateway] HTTP {RequestMethod} {RequestPath} responded {StatusCode} in {Elapsed:0.0000} ms";
});

app.UseCors();

app.UseAuthentication();
app.UseAuthorization();

// Map health check endpoint
app.MapHealthChecks("/health");

// Gateway status endpoint
app.MapGet("/", () => Results.Ok(new
{
    Service = "API Gateway",
    Status = "Running",
    Timestamp = DateTime.UtcNow,
    Version = "1.0.0"
}));

// Map YARP reverse proxy
app.MapReverseProxy();

// ==================== Start Application ====================
var port = configuration.GetValue<int>("Port", 5000);
var urls = $"http://0.0.0.0:{port}";

Log.Information("Starting API Gateway on {Urls}", urls);
Log.Information("Routing configuration:");
Log.Information("  /api/auth/* -> AuthService (5001)");
Log.Information("  /api/chat/* -> ChatService (5002)");
Log.Information("  /api/documents/* -> DocumentService (5003)");
Log.Information("  /api/notifications/* -> NotificationService (5004)");
Log.Information("  /hubs/chat -> ChatService SignalR Hub");
Log.Information("  /hubs/notifications -> NotificationService SignalR Hub");

app.Urls.Add(urls);

try
{
    await app.RunAsync();
}
catch (Exception ex)
{
    Log.Fatal(ex, "API Gateway terminated unexpectedly");
}
finally
{
    Log.CloseAndFlush();
}
