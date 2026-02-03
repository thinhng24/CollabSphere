namespace CollabSphere.API.Models
{
    public class MeetingParticipant
    {
        public int Id { get; set; }
        public int MeetingId { get; set; }
        public int UserId { get; set; }
        public string Role { get; set; } = "Participant"; // Host, Participant, Guest
        public DateTime JoinedAt { get; set; } = DateTime.UtcNow;
    }
}