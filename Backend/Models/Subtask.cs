using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace ProjectManagementApp.Models
{
    public class Subtask
    {
        [Key]
        public int Id { get; set; }
        
        [Required]
        public int TaskId { get; set; }
        
        [Required]
        [MaxLength(200)]
        public string Title { get; set; } = string.Empty;
        
        public bool IsDone { get; set; } = false;
        
        public int Order { get; set; } = 0;
        
        // Navigation properties
        [JsonIgnore]
        public Task Task { get; set; } = null!;
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}