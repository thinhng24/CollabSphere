using MassTransit;
using CollabSphere.Shared.Contracts;

namespace CollabSphere.Consumers;

public class NotificationConsumer : IConsumer<INotificationEvent>
{
    private readonly ILogger<NotificationConsumer> _logger;
    public NotificationConsumer(ILogger<NotificationConsumer> logger) => _logger = logger;

    public async Task Consume(ConsumeContext<INotificationEvent> context)
    {
        var msg = context.Message;
        _logger.LogInformation("[Notification] Đang gửi thông báo: {Title}", msg.Title);
        


        await Task.CompletedTask;
    }
}