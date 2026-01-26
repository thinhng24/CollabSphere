namespace CollabSphere.Shared.Contracts;

public interface IDeadlineReminderEvent
{
    Guid TargetId { get; }    
    string TargetName { get; }
    string Message { get; }
}
    