using SharedKernel.Entities;

namespace ProjectService.Domain.Entities;

public class Milestone : BaseEntity
{
    public Guid ProjectId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public DateTime DueDate { get; set; }
    public int Order { get; set; }
    public bool IsCompleted { get; set; } = false;
    public DateTime? CompletedAt { get; set; }
    
    // Navigation
    public Project Project { get; set; } = null!;
}
