using SharedKernel.Entities;
using TeamService.Domain.Enums;

namespace TeamService.Domain.Entities;

public class TeamMilestone : BaseEntity
{
    public Guid TeamId { get; set; }
    public Guid MilestoneId { get; set; }
    public TeamMilestoneStatus Status { get; set; } = TeamMilestoneStatus.NotStarted;
    public DateTime? CompletedAt { get; set; }
    public Guid? MarkedBy { get; set; }

    // Navigation properties
    public Team Team { get; set; } = null!;
}
