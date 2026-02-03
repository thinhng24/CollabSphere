using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Ocelot.DependencyInjection;
using Ocelot.Middleware;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// Add configuration
builder.Configuration.AddJsonFile("ocelot.json", optional: false, reloadOnChange: true);

// Add JWT Authentication
var jwtSecret = builder.Configuration["JwtSettings:Secret"];
if (string.IsNullOrWhiteSpace(jwtSecret))
{
    throw new InvalidOperationException(
        "JWT Secret is required. Please set JwtSettings:Secret in appsettings.json or environment variable JWT_SECRET.");
}

var jwtIssuer = builder.Configuration["JwtSettings:Issuer"];
if (string.IsNullOrWhiteSpace(jwtIssuer))
{
    throw new InvalidOperationException(
        "JWT Issuer is required. Please set JwtSettings:Issuer in appsettings.json or environment variable JWT_ISSUER.");
}

var jwtAudience = builder.Configuration["JwtSettings:Audience"];
if (string.IsNullOrWhiteSpace(jwtAudience))
{
    throw new InvalidOperationException(
        "JWT Audience is required. Please set JwtSettings:Audience in appsettings.json or environment variable JWT_AUDIENCE.");
}

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtIssuer,
            ValidAudience = jwtAudience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret))
        };
    });

// Add CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

// Add Ocelot
builder.Services.AddOcelot();

var app = builder.Build();

// Configure middleware
app.UseCors("AllowAll");
app.UseAuthentication();
app.UseAuthorization();

// Use Ocelot
await app.UseOcelot();

app.Run();
