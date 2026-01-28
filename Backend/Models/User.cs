using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace ProjectManagementApp.Models
{
    public class User
    {
        [Key]
        public int Id { get; set; }
        
        [Required]
        [MaxLength(100)]
        public string Name { get; set; } = string.Empty;
        
        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;
        
        [Required]
        public string Password { get; set; } = string.Empty;
        
        [Required]
        public string Role { get; set; } = string.Empty;
        
        // Navigation properties
        [JsonIgnore]
        public List<Team> TeamsAsLecturer { get; set; } = new();
        
        [JsonIgnore]
        public List<TeamMember> TeamMemberships { get; set; } = new();
        
        [JsonIgnore]
        public List<Submission> Submissions { get; set; } = new();
        
        [JsonIgnore]
        public List<Task> AssignedTasks { get; set; } = new();
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}