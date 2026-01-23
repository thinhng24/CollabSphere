using MassTransit;
using CollabSphere.Shared.Contracts;

namespace CollabSphere;

public class Worker : BackgroundService
{
    private readonly ILogger<Worker> _logger;
    private readonly IBus _bus; 

    public Worker(ILogger<Worker> logger, IBus bus)
    {
        _logger = logger;
        _bus = bus;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("CollabSphere Test Publisher đang khởi động...");

        while (!stoppingToken.IsCancellationRequested)
        {
            _logger.LogInformation("--- Đang gửi tin nhắn mẫu lên RabbitMQ ---");

            await _bus.Publish<INotificationEvent>(new
            {
                ReceiverId = "Student_01",
                Title = "Thông báo mới",
                Content = "Bạn có một tin nhắn mới từ Mentor",
                Type = "Email"
            }, stoppingToken);

            await _bus.Publish<IMediaProcessingEvent>(new
            {
                FileId = Guid.NewGuid(),
                RawUrl = "https://cdn.collabsphere.com/avatars/u1.png",
                ProcessType = "Thumbnail"
            }, stoppingToken);

            await _bus.Publish<IDeadlineReminderEvent>(new
            {
                TargetId = Guid.NewGuid(),
                TargetName = "Đồ án kỳ 7",
                Deadline = DateTime.Now.AddDays(3),
                StudentEmail = "tung@fpt.edu.vn"
            }, stoppingToken);

            await Task.Delay(30000, stoppingToken);
        }
    }
}