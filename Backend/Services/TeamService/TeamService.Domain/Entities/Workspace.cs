using SharedKernel.Entities;

namespace TeamService.Domain.Entities;

public class Workspace : BaseEntity
{
    public Guid TeamId { get; set; }
    public string Cards { get; set; } = "[]"; // JSON array

    // Navigation properties
    public Team Team { get; set; } = null!;
}
