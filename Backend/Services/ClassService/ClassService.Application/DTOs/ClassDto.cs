namespace ClassService.Application.DTOs;

public class ClassDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string Semester { get; set; } = string.Empty;
    public int Year { get; set; }
    public string Description { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public class CreateClassDto
{
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string Semester { get; set; } = string.Empty;
    public int Year { get; set; }
    public string Description { get; set; } = string.Empty;
}

public class UpdateClassDto
{
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string Semester { get; set; } = string.Empty;
    public int Year { get; set; }
    public string Description { get; set; } = string.Empty;
}

public class ClassMemberDto
{
    public Guid ClassId { get; set; }
    public Guid UserId { get; set; }
    public string UserRole { get; set; } = string.Empty; // "Lecturer" or "Student"
    public DateTime AssignedAt { get; set; }
}

public class AssignMemberDto
{
    public Guid ClassId { get; set; }
    public List<Guid> UserIds { get; set; } = new();
}
