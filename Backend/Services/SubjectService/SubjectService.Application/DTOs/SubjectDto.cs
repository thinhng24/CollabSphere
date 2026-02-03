namespace SubjectService.Application.DTOs;

public class SubjectDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int CreditHours { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public class CreateSubjectDto
{
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int CreditHours { get; set; }
}

public class UpdateSubjectDto
{
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int CreditHours { get; set; }
}

public class SyllabusDto
{
    public Guid Id { get; set; }
    public Guid SubjectId { get; set; }
    public string Version { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string LearningOutcomes { get; set; } = "[]";
    public string Content { get; set; } = "[]";
    public string AssessmentCriteria { get; set; } = "[]";
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public class CreateSyllabusDto
{
    public Guid SubjectId { get; set; }
    public string Version { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string LearningOutcomes { get; set; } = "[]";
    public string Content { get; set; } = "[]";
    public string AssessmentCriteria { get; set; } = "[]";
}

public class UpdateSyllabusDto
{
    public string Version { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string LearningOutcomes { get; set; } = "[]";
    public string Content { get; set; } = "[]";
    public string AssessmentCriteria { get; set; } = "[]";
}
