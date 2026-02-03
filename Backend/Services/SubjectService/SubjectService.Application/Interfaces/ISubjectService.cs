using SubjectService.Application.DTOs;
using SharedKernel.Common;

namespace SubjectService.Application.Interfaces;

public interface ISubjectService
{
    Task<Result<SubjectDto>> CreateSubjectAsync(CreateSubjectDto dto, Guid createdBy);
    Task<Result<SubjectDto>> GetSubjectByIdAsync(Guid id);
    Task<Result<List<SubjectDto>>> GetAllSubjectsAsync();
    Task<Result<SubjectDto>> UpdateSubjectAsync(Guid id, UpdateSubjectDto dto);
    Task<Result> DeleteSubjectAsync(Guid id);
}
