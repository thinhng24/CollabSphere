using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CollabSphere.API.Models
{
    public class Meeting
    {
        [Key]
        public Guid Id { get; set; }
        
        [Required]
        public string Title { get; set; } = string.Empty;
        
        public string Description { get; set; } = string.Empty;
        
        [Required]
        public Guid TeamId { get; set; }
        
        [ForeignKey("TeamId")]
        public Team Team { get; set; } = null!;
        
        [Required]
        public DateTime StartTime { get; set; }
        
        [Required]
        public DateTime EndTime { get; set; }
        
        [Required]
        public string MeetingLink { get; set; } = string.Empty;
        
        public string? Agenda { get; set; }
        
        public string? MeetingNotes { get; set; }
        
        public MeetingStatus Status { get; set; } = MeetingStatus.Scheduled;
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        
        // Participants
        public virtual ICollection<MeetingParticipant> Participants { get; set; } = new List<MeetingParticipant>();
        
        // Recording
        public string? RecordingUrl { get; set; }
        public DateTime? RecordingStartedAt { get; set; }
        public DateTime? RecordingEndedAt { get; set; }
    }
    
    public enum MeetingStatus
    {
        Scheduled,
        InProgress,
        Completed,
        Cancelled
    }
    
    public class MeetingParticipant
    {
        [Key]
        public Guid Id { get; set; }
        
        [Required]
        public Guid MeetingId { get; set; }
        
        [ForeignKey("MeetingId")]
        public Meeting Meeting { get; set; } = null!;
        
        [Required]
        public Guid UserId { get; set; }
        
        [ForeignKey("UserId")]
        public User User { get; set; } = null!;
        
        public ParticipantRole Role { get; set; } = ParticipantRole.Attendee;
        
        public DateTime? JoinedAt { get; set; }
        
        public DateTime? LeftAt { get; set; }
        
        public bool HasCameraOn { get; set; }
        
        public bool HasMicOn { get; set; }
        
        public bool IsScreenSharing { get; set; }
    }
    
    public enum ParticipantRole
    {
        Host,
        CoHost,
        Attendee
    }
}