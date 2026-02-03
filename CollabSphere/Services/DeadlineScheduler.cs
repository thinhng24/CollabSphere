using MassTransit;
using CollabSphere.Shared.Contracts;

namespace CollabSphere.Services;

public class DeadlineScheduler : IDeadlineScheduler
{
    private readonly IBus _bus;
    private readonly ILogger<DeadlineScheduler> _logger;

    public DeadlineScheduler(IBus bus, ILogger<DeadlineScheduler> logger)
    {
        _bus = bus;
        _logger = logger;
    }

    public async Task ScheduleReminders(Guid taskId, string taskName, DateTime deadline)
    {
        DateTime now = DateTime.Now;
        TimeSpan timeUntilDeadline = deadline - now;

        _logger.LogInformation("Đang hẹn giờ nhắc cho task: {TaskName} (ID: {TaskId}), Deadline: {Deadline}",
            taskName, taskId, deadline);

        if (timeUntilDeadline.TotalMinutes <= 0)
        {
            _logger.LogWarning("Deadline đã qua! Không thể hẹn giờ nhắc cho task: {TaskName}", taskName);
            return;
        }

        // --- NHẮC TRƯỚC 24H ---
        if (timeUntilDeadline.TotalHours > 24)
        {
            var delay24h = timeUntilDeadline.Subtract(TimeSpan.FromHours(24));
            await _bus.Publish<IDeadlineReminderEvent>(new
            {
                TargetId = taskId,
                TargetName = taskName,
                Message = "Thông báo: Deadline của bạn còn đúng 24h!"
            }, x => x.Delay = delay24h);

            _logger.LogInformation("✓ Đã hẹn nhắc 24h trước cho task: {TaskName}", taskName);
        }
        else if (timeUntilDeadline.TotalHours <= 24 && timeUntilDeadline.TotalHours > 12)
        {
            // Nếu tạo task mà còn 12-24h thì bắn ngay
            await _bus.Publish<IDeadlineReminderEvent>(new
            {
                TargetId = taskId,
                TargetName = taskName,
                Message = "Cảnh báo: Deadline còn chưa đầy 24h!"
            });

            _logger.LogInformation("✓ Đã gửi cảnh báo ngay (deadline dưới 24h) cho task: {TaskName}", taskName);
        }

        // --- NHẮC TRƯỚC 12H ---
        if (timeUntilDeadline.TotalHours > 12)
        {
            var delay12h = timeUntilDeadline.Subtract(TimeSpan.FromHours(12));
            await _bus.Publish<IDeadlineReminderEvent>(new
            {
                TargetId = taskId,
                TargetName = taskName,
                Message = "GẤP: Deadline của bạn chỉ còn 12h!"
            }, x => x.Delay = delay12h);

            _logger.LogInformation("✓ Đã hẹn nhắc 12h trước cho task: {TaskName}", taskName);
        }
        else if (timeUntilDeadline.TotalHours <= 12 && timeUntilDeadline.TotalHours > 1)
        {
            // Nếu tạo task mà còn 1-12h thì bắn ngay
            await _bus.Publish<IDeadlineReminderEvent>(new
            {
                TargetId = taskId,
                TargetName = taskName,
                Message = "GẤP: Deadline của bạn chỉ còn dưới 12h!"
            });

            _logger.LogInformation("✓ Đã gửi cảnh báo ngay (deadline dưới 12h) cho task: {TaskName}", taskName);
        }

        // --- NHẮC TRƯỚC 1H ---
        if (timeUntilDeadline.TotalHours > 1)
        {
            var delay1h = timeUntilDeadline.Subtract(TimeSpan.FromHours(1));
            await _bus.Publish<IDeadlineReminderEvent>(new
            {
                TargetId = taskId,
                TargetName = taskName,
                Message = "KHẨN CẤP: Deadline của bạn chỉ còn 1h!"
            }, x => x.Delay = delay1h);

            _logger.LogInformation("✓ Đã hẹn nhắc 1h trước cho task: {TaskName}", taskName);
        }
        else
        {
            // Nếu tạo task mà còn dưới 1h thì bắn ngay
            await _bus.Publish<IDeadlineReminderEvent>(new
            {
                TargetId = taskId,
                TargetName = taskName,
                Message = "KHẨN CẤP: Deadline của bạn chỉ còn dưới 1h!"
            });

            _logger.LogInformation("✓ Đã gửi cảnh báo ngay (deadline dưới 1h) cho task: {TaskName}", taskName);
        }

        _logger.LogInformation("✅ Hoàn thành hẹn giờ nhắc cho task: {TaskName}", taskName);
    }
}