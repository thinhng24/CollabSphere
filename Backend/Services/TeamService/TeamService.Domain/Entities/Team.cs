using SharedKernel.Entities;

namespace TeamService.Domain.Entities;

public class Team : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public Guid ClassId { get; set; }
    public Guid? ProjectId { get; set; }
    public Guid LeaderId { get; set; }

    // Navigation properties
    public ICollection<TeamMember> TeamMembers { get; set; } = new List<TeamMember>();
    public ICollection<TeamMilestone> TeamMilestones { get; set; } = new List<TeamMilestone>();
    public ICollection<Checkpoint> Checkpoints { get; set; } = new List<Checkpoint>();
    public ICollection<MilestoneAnswer> MilestoneAnswers { get; set; } = new List<MilestoneAnswer>();
    public ICollection<CheckpointSubmission> CheckpointSubmissions { get; set; } = new List<CheckpointSubmission>();
    public Workspace? Workspace { get; set; }
}
