namespace CollabSphere.Api.Models;

public class Meeting
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string Title { get; set; } = string.Empty;
    public string TeamId { get; set; } = string.Empty;
    public DateTime ScheduledTime { get; set; }
    public string CreatedBy { get; set; } = string.Empty;
    public List<string> Participants { get; set; } = new();
    public MeetingStatus Status { get; set; } = MeetingStatus.Scheduled;
}

public enum MeetingStatus
{
    Scheduled,
    InProgress,
    Completed,
    Cancelled
}

public class WebRtcSignal
{
    public string Type { get; set; } = string.Empty;
    public string RoomId { get; set; } = string.Empty;
    public string FromUserId { get; set; } = string.Empty;
    public object? Data { get; set; }
}

public class WhiteboardAction
{
    public string Type { get; set; } = string.Empty;
    public string RoomId { get; set; } = string.Empty;
    public string UserId { get; set; } = string.Empty;
    public object? Data { get; set; }
}