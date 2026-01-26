using MassTransit;

namespace CollabSphere;

/// <summary>
/// Background service để giữ ứng dụng chạy và lắng nghe message từ RabbitMQ
/// Không còn tạo deadline giả nữa - deadline sẽ đến từ service khác
/// </summary>
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
        _logger.LogInformation("==================================================");
        _logger.LogInformation("📢 Deadline Reminder Service đã khởi động!");
        _logger.LogInformation("🔊 Đang lắng nghe message từ RabbitMQ...");
        _logger.LogInformation("==================================================");

        // Giữ Worker sống để lắng nghe message từ RabbitMQ
        while (!stoppingToken.IsCancellationRequested)
        {
            await Task.Delay(5000, stoppingToken);
        }

        _logger.LogInformation("Deadline Reminder Service đang tắt...");
    }
}