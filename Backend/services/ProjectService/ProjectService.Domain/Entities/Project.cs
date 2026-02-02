using SharedKernel.Entities;
using SharedKernel.Enums;

namespace ProjectService.Domain.Entities;

public class Project : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Objectives { get; set; } = string.Empty;
    public Guid? SyllabusId { get; set; }
    public Guid? ClassId { get; set; }
    public ProjectStatus Status { get; set; } = ProjectStatus.Pending;
    public Guid CreatedBy { get; set; }
    public DateTime? SubmittedAt { get; set; }
    public DateTime? ApprovedAt { get; set; }
    public Guid? ApprovedBy { get; set; }
    public string? RejectionReason { get; set; }
    
    // Navigation properties
    public ICollection<Milestone> Milestones { get; set; } = new List<Milestone>();
    public ICollection<ProjectApproval> Approvals { get; set; } = new List<ProjectApproval>();
}
