namespace TeamService.Application.DTOs;

public class WorkspaceDto
{
    public Guid Id { get; set; }
    public Guid TeamId { get; set; }
    public string Cards { get; set; } = "[]";
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public class UpdateWorkspaceDto
{
    public string Cards { get; set; } = "[]";
}
