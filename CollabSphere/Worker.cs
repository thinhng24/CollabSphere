namespace CollabSphere;

public class Worker : BackgroundService
{
    private readonly ILogger<Worker> _logger;

    public Worker(ILogger<Worker> logger)
    {
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("CollabSphere Workers đang khởi động...");

        // Chạy đồng thời 3 luồng nhiệm vụ độc lập
        var notificationTask = DoNotificationWork(stoppingToken);
        var mediaTask = DoMediaWork(stoppingToken);
        var deadlineTask = DoDeadlineWork(stoppingToken);

        await Task.WhenAll(notificationTask, mediaTask, deadlineTask);
    }

    // --- NHIỆM VỤ 1: THÔNG BÁO (Chat, Email, System) ---
    private async Task DoNotificationWork(CancellationToken ct)
    {
        while (!ct.IsCancellationRequested)
        {
            _logger.LogInformation("[Notification] Đang kiểm tra hàng đợi thông báo...");
            await Task.Delay(3000, ct);
        }
    }

    // --- NHIỆM VỤ 2: XỬ LÝ MEDIA (Avatar, Tài liệu) ---
    private async Task DoMediaWork(CancellationToken ct)
    {
        while (!ct.IsCancellationRequested)
        {
            _logger.LogInformation("[Media] Đang quét các tệp tin mới tải lên...");
            await Task.Delay(10000, ct);
        }
    }

    // --- NHIỆM VỤ 3: DEADLINE & TIMELINE (Học tập) ---
    private async Task DoDeadlineWork(CancellationToken ct)
    {
        while (!ct.IsCancellationRequested)
        {
            _logger.LogInformation("[Deadline] Đang kiểm tra thời hạn các Topic và bài tập...");
            await Task.Delay(15000, ct); 
        }
    }
}