using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Ocelot.DependencyInjection;
using Ocelot.Middleware;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// Add configuration
builder.Configuration.AddJsonFile("ocelot.json", optional: false, reloadOnChange: true);

// Add JWT Authentication
var jwtSecret = builder.Configuration["JwtSettings:Secret"] ?? "YourSuperSecretKeyForJWTTokenGeneration123456789";
var jwtIssuer = builder.Configuration["JwtSettings:Issuer"] ?? "CollabSphere";
var jwtAudience = builder.Configuration["JwtSettings:Audience"] ?? "CollabSphereUsers";

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
