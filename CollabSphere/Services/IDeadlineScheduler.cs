namespace CollabSphere.Services;

/// <summary>
/// Interface để hẹn giờ nhắc deadline
/// Service khác (như Task API) sẽ gọi interface này
/// </summary>
public interface IDeadlineScheduler
{
    Task ScheduleReminders(Guid taskId, string taskName, DateTime deadline);
}