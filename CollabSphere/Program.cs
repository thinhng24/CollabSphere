using MassTransit;
using CollabSphere.Consumers;
using CollabSphere;
using CollabSphere.Services;
using CollabSphere.Hubs;

// ĐỔI TỪ Host SANG WebApplication
var builder = WebApplication.CreateBuilder(args);

// Đăng ký Worker
builder.Services.AddHostedService<Worker>();

// Đăng ký DeadlineScheduler
builder.Services.AddScoped<IDeadlineScheduler, DeadlineScheduler>();

// THÊM SIGNALR
builder.Services.AddSignalR();

// Cấu hình MassTransit
builder.Services.AddMassTransit(x =>
{
    x.AddConsumers(typeof(NotificationConsumer).Assembly);
    x.AddConsumers(typeof(MediaConsumer).Assembly);
    x.AddConsumers(typeof(DeadlineConsumer).Assembly);

    x.AddDelayedMessageScheduler();

    x.UsingRabbitMq((context, cfg) =>
    {
        cfg.UseDelayedMessageScheduler();
        cfg.Host("localhost", "/", h => {
            h.Username("guest");
            h.Password("guest");
        });
        cfg.ConfigureEndpoints(context);
    });
});

// BUILD APP (KHÔNG PHẢI host)
var app = builder.Build();

// MAP SIGNALR HUB
app.MapHub<NotificationHub>("/notificationHub");

app.MapPost("/test-deadline", async (IDeadlineScheduler scheduler) =>
{
    var testUserId = Guid.NewGuid();
    await scheduler.ScheduleReminders(
        testUserId,
        "Bài tập Toán - TEST",
        DateTime.Now.AddMinutes(2) // Deadline sau 2 phút
    );
    return Results.Ok(new
    {
        message = "✅ Đã hẹn! Xem log sau ~1 phút",
        userId = testUserId
    });
});
// CHẠY APP
app.Run();