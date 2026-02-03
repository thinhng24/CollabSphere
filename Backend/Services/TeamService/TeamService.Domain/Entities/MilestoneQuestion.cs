using SharedKernel.Entities;

namespace TeamService.Domain.Entities;

public class MilestoneQuestion : BaseEntity
{
    public Guid MilestoneId { get; set; }
    public string Question { get; set; } = string.Empty;
    public int Order { get; set; }
    public Guid CreatedBy { get; set; }

    // Navigation properties
    public ICollection<MilestoneAnswer> MilestoneAnswers { get; set; } = new List<MilestoneAnswer>();
}
