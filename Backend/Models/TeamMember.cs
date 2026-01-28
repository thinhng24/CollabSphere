namespace ProjectManagementApp.Models
{
    public class TeamMember
    {
        public int TeamId { get; set; }
        public int UserId { get; set; }
        
        // Navigation properties
        public Team Team { get; set; } = null!;
        public User User { get; set; } = null!;
        public DateTime JoinedAt { get; set; } = DateTime.UtcNow;
    }
}