public class Meeting
{
    public Guid Id { get; set; }
    public string Title { get; set; }
    public DateTime StartTime { get; set; }
    public int DurationMinutes { get; set; }
    public string CreatedBy { get; set; }
}
