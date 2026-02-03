using SharedKernel.Entities;
using TeamService.Domain.Enums;

namespace TeamService.Domain.Entities;

public class Checkpoint : BaseEntity
{
    public Guid TeamId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public DateTime DueDate { get; set; }
    public CheckpointStatus Status { get; set; } = CheckpointStatus.Open;
    public Guid CreatedBy { get; set; }

    // Navigation properties
    public Team Team { get; set; } = null!;
    public ICollection<CheckpointAssignment> CheckpointAssignments { get; set; } = new List<CheckpointAssignment>();
    public ICollection<CheckpointSubmission> CheckpointSubmissions { get; set; } = new List<CheckpointSubmission>();
}
