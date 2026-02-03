using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using CollabSphere.Api.Hubs;
using CollabSphere.Api.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddSignalR();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

builder.Services.AddSingleton<MeetingService>();
builder.Services.AddSingleton<WhiteboardService>();

var app = builder.Build();

app.UseSwagger();
app.UseSwaggerUI();


app.UseCors("AllowAll");
app.UseRouting();

app.MapControllers();
app.MapHub<SignalingHub>("/Hubs/signaling");
app.MapHub<WhiteboardHub>("/Hubs/whiteboard");

app.MapGet("/", () => new
{
    service = "CollabSphere API",
    version = "1.0.0",
    status = "running"
});

app.MapGet("/health", () => Results.Ok(new { status = "Healthy" }));

app.Run();