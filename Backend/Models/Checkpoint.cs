using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace ProjectManagementApp.Models
{
    public class Checkpoint
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
        public DateTime DueDate { get; set; }

        [Required]
        [MaxLength(20)]
        public string Status { get; set; } = "Pending"; 
        // Pending | Submitted | Graded

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? GradedAt { get; set; } // ✅ Nullable và public

        // Navigation properties
        [JsonIgnore]
        public Team Team { get; set; } = null!;

        [JsonIgnore]
        public List<Submission> Submissions { get; set; } = new();
    }
}
