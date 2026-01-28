using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace ProjectManagementApp.Models
{
    public class Team
    {
        [Key]
        public int Id { get; set; }
        
        [Required]
        [MaxLength(100)]
        public string Name { get; set; } = string.Empty;
        
        [Required]
        public int LecturerId { get; set; }
        
        // Navigation properties
        [JsonIgnore]
        public User Lecturer { get; set; } = null!;
        
        [JsonIgnore]
        public List<TeamMember> Members { get; set; } = new();
        
        [JsonIgnore]
        public List<Checkpoint> Checkpoints { get; set; } = new();
        
        [JsonIgnore]
        public List<Task> Tasks { get; set; } = new();
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}