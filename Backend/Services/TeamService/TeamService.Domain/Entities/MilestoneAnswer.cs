using SharedKernel.Entities;

namespace TeamService.Domain.Entities;

public class MilestoneAnswer : BaseEntity
{
    public Guid QuestionId { get; set; }
    public Guid TeamId { get; set; }
    public Guid StudentId { get; set; }
    public string Answer { get; set; } = string.Empty;
    public DateTime SubmittedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public MilestoneQuestion Question { get; set; } = null!;
    public Team Team { get; set; } = null!;
}
