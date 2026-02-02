namespace CollabSphere.API.Models
{
    public class Meeting
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public DateTime StartTime { get; set; }
        public DateTime EndTime { get; set; }
        public bool IsActive { get; set; } = true;
        public string Status { get; set; } = "Scheduled";
        public string TeamName { get; set; } = string.Empty;
        public string Participants { get; set; } = string.Empty;
    }
}