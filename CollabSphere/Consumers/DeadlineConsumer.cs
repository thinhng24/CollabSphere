using MassTransit;
using CollabSphere.Shared.Contracts;
using Microsoft.Extensions.Logging;

namespace CollabSphere.Consumers;

public class DeadlineConsumer : IConsumer<IDeadlineReminderEvent>
{
    private readonly ILogger<DeadlineConsumer> _logger;

    public DeadlineConsumer(ILogger<DeadlineConsumer> logger)
    {
        _logger = logger;
    }

    public async Task Consume(ConsumeContext<IDeadlineReminderEvent> context)
    {
        var data = context.Message;

        _logger.LogWarning("[Deadline Worker] PHÁT HIỆN SỰ KIỆN SẮP HẾT HẠN!");
        _logger.LogInformation("[Deadline Worker] Đối tượng: {TargetName}", data.TargetName);
        _logger.LogInformation("[Deadline Worker] Thời hạn: {Deadline}", data.Deadline.ToString("dd/MM/yyyy HH:mm"));
        _logger.LogInformation("[Deadline Worker] Gửi thông báo nhắc nhở đến: {StudentEmail}", data.StudentEmail);

        // Giả lập gửi tin nhắn cảnh báo
        await Task.Delay(500);

        _logger.LogInformation("[Deadline Worker] Đã gửi thông báo nhắc nhở thành công.");
    }
}