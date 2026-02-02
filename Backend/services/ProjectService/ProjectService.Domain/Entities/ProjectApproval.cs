using SharedKernel.Entities;
using SharedKernel.Enums;

namespace ProjectService.Domain.Entities;

public class ProjectApproval : BaseEntity
{
    public Guid ProjectId { get; set; }
    public Guid ReviewerId { get; set; }
    public ProjectStatus Status { get; set; }
    public string? Comments { get; set; }
    public DateTime ReviewedAt { get; set; } = DateTime.UtcNow;
    
    // Navigation
    public Project Project { get; set; } = null!;
}
