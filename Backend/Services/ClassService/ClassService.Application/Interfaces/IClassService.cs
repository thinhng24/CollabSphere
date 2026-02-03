using ClassService.Application.DTOs;
using SharedKernel.Common;

namespace ClassService.Application.Interfaces;

public interface IClassService
{
    Task<Result<ClassDto>> CreateClassAsync(CreateClassDto dto, Guid createdBy);
    Task<Result<ClassDto>> GetClassByIdAsync(Guid id);
    Task<Result<List<ClassDto>>> GetAllClassesAsync();
    Task<Result<ClassDto>> UpdateClassAsync(Guid id, UpdateClassDto dto);
    Task<Result> DeleteClassAsync(Guid id);
    Task<Result<List<ClassDto>>> GetClassesByLecturerAsync(Guid lecturerId);
    Task<Result<List<ClassDto>>> GetClassesByStudentAsync(Guid studentId);
}
