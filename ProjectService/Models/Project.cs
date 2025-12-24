using System.ComponentModel.DataAnnotations;

namespace ProjectService.Models
{
    public class Project
    {
        [Key]
        public int Id { get; set; }
        [Required]
        [StringLength(100)]
        public required string Name { get; set; }
        [StringLength(500)]
        public required string Description { get; set; }
        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;
        public bool IsApproved { get; set; } = false;
        public bool IsDenied { get; set; } = false;
        public bool IsSubmitted { get; set; } = false;
        public int CreatorId { get; set; }
        public required ICollection<Milestone> Milestones { get; set; }
    }
}