using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace ProjectManagementApp.Models
{
    public class Submission
    {
        [Key]
        public int Id { get; set; }
        
        [Required]
        public int CheckpointId { get; set; }
        
        [Required]
        public int UserId { get; set; }
        
        [Required]
        public string Content { get; set; } = string.Empty;
        
        public string? FileUrl { get; set; }
        
        public string? FileName { get; set; }
        
        public decimal? Score { get; set; }
        
        public string? Feedback { get; set; }
        
        // Navigation properties
        [JsonIgnore]
        public Checkpoint Checkpoint { get; set; } = null!;
        
        [JsonIgnore]
        public User User { get; set; } = null!;
        
        public DateTime SubmittedAt { get; set; } = DateTime.UtcNow;
        public DateTime? GradedAt { get; set; }
    }
}