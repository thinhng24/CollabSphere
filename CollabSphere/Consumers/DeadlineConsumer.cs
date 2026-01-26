using MassTransit;
using CollabSphere.Shared.Contracts;
using Microsoft.AspNetCore.SignalR;
using CollabSphere.Hubs;

namespace CollabSphere.Consumers;


public class DeadlineConsumer : IConsumer<IDeadlineReminderEvent>
{
    private readonly ILogger<DeadlineConsumer> _logger;
    private readonly IHubContext<NotificationHub> _hubContext;

    public DeadlineConsumer(
        ILogger<DeadlineConsumer> logger,
        IHubContext<NotificationHub> hubContext)
    {
        _logger = logger;
        _hubContext = hubContext;
    }

    public async Task Consume(ConsumeContext<IDeadlineReminderEvent> context)
    {
        var data = context.Message;

        _logger.LogInformation("==================================================");
        _logger.LogInformation("🔔 [DEADLINE REMINDER]");
        _logger.LogInformation("📋 Task ID: {Id}", data.TargetId);
        _logger.LogInformation("📝 Task Name: {Name}", data.TargetName);
        _logger.LogInformation("💬 Message: {Msg}", data.Message);
        _logger.LogInformation("⏰ Time: {Time}", DateTime.Now);
        _logger.LogInformation("==================================================");

        try
        {
            await _hubContext.Clients.User(data.TargetId.ToString())
                .SendAsync("ReceiveDeadlineReminder", new
                {
                    TaskId = data.TargetId,
                    TaskName = data.TargetName,
                    Message = data.Message,
                    Timestamp = DateTime.Now,
                    Type = "deadline"
                });

            _logger.LogInformation("✅ Notification sent via SignalR to user {UserId}", data.TargetId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Failed to send SignalR notification to user {UserId}", data.TargetId);
        }

        await Task.CompletedTask;
    }
}