namespace TeamService.Domain.Entities;

public class TeamMember
{
    public Guid TeamId { get; set; }
    public Guid StudentId { get; set; }
    public DateTime JoinedAt { get; set; } = DateTime.UtcNow;
    public decimal ContributionPercentage { get; set; } = 0;

    // Navigation properties
    public Team Team { get; set; } = null!;
}
