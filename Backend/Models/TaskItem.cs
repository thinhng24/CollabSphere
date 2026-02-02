using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace ProjectManagementApp.Models
{
    public class Task
    {
        [Key]
        public int Id { get; set; }
        
        [Required]
        public int TeamId { get; set; }
        
        [Required]
        [MaxLength(200)]
        public string Title { get; set; } = string.Empty;
        
        public string? Description { get; set; }
        
        [Required]
        [MaxLength(50)]
        public string Status { get; set; } = "To Do";
        
        public int? AssigneeId { get; set; }
        
        public int Order { get; set; } = 0;
        
        public DateTime Deadline { get; set; }
        
        public decimal? EstimatedHours { get; set; }
        
        public decimal? ActualHours { get; set; }
        
        // Navigation properties
        [JsonIgnore]
        public Team Team { get; set; } = null!;
        
        public User? Assignee { get; set; }
        
        public List<Subtask> Subtasks { get; set; } = new();
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }
    }
}