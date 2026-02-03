namespace TeamService.Application.DTOs;

public class TeamDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public Guid ClassId { get; set; }
    public Guid? ProjectId { get; set; }
    public Guid LeaderId { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public List<TeamMemberDto> Members { get; set; } = new();
}

public class CreateTeamDto
{
    public string Name { get; set; } = string.Empty;
    public Guid ClassId { get; set; }
    public Guid? ProjectId { get; set; }
    public Guid LeaderId { get; set; }
    public List<Guid> MemberIds { get; set; } = new();
}

public class UpdateTeamDto
{
    public string Name { get; set; } = string.Empty;
    public Guid? ProjectId { get; set; }
    public Guid LeaderId { get; set; }
}

public class TeamMemberDto
{
    public Guid TeamId { get; set; }
    public Guid StudentId { get; set; }
    public DateTime JoinedAt { get; set; }
    public decimal ContributionPercentage { get; set; }
}

public class AddTeamMembersDto
{
    public List<Guid> StudentIds { get; set; } = new();
}

public class UpdateContributionDto
{
    public Guid StudentId { get; set; }
    public decimal ContributionPercentage { get; set; }
}
