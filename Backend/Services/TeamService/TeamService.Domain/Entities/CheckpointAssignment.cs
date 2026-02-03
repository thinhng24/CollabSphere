namespace TeamService.Domain.Entities;

public class CheckpointAssignment
{
    public Guid CheckpointId { get; set; }
    public Guid StudentId { get; set; }

    // Navigation properties
    public Checkpoint Checkpoint { get; set; } = null!;
}
