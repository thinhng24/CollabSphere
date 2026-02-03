using SharedKernel.Entities;

namespace TeamService.Domain.Entities;

public class CheckpointSubmission : BaseEntity
{
    public Guid CheckpointId { get; set; }
    public Guid TeamId { get; set; }
    public string FileUrl { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public DateTime SubmittedAt { get; set; } = DateTime.UtcNow;
    public Guid SubmittedBy { get; set; }

    // Navigation properties
    public Checkpoint Checkpoint { get; set; } = null!;
    public Team Team { get; set; } = null!;
}
