using System.ComponentModel.DataAnnotations;

namespace ProjectService.Models
{
    public class Milestone
    {
        [Key]
        public int Id { get; set; }
        [Required]
        [StringLength(100)]
        public string Title { get; set; }
        [StringLength(500)]
        public string Description { get; set; }
        [Required]
        public DateTime DueDate { get; set; }
        public bool IsCompleted { get; set; } = false;
        public int ProjectId { get; set; }
        public Project Project { get; set; }
    }
}