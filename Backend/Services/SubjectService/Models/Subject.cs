namespace SubjectService.Models;

public class Subject
{
    public int Id { get; set; }

    public required string Name { get; set; }
    public required string Code { get; set; }

    public string? Description { get; set; }
}
