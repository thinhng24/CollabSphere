using SubjectService.Application.DTOs;
using SharedKernel.Common;

namespace SubjectService.Application.Interfaces;

public interface ISyllabusService
{
    Task<Result<SyllabusDto>> CreateSyllabusAsync(CreateSyllabusDto dto, Guid createdBy);
    Task<Result<SyllabusDto>> GetSyllabusByIdAsync(Guid id);
    Task<Result<List<SyllabusDto>>> GetSyllabusBySubjectIdAsync(Guid subjectId);
    Task<Result<SyllabusDto>> UpdateSyllabusAsync(Guid id, UpdateSyllabusDto dto);
    Task<Result> DeleteSyllabusAsync(Guid id);
}
