using ClassService.Application.DTOs;
using SharedKernel.Common;

namespace ClassService.Application.Interfaces;

public interface IClassMemberService
{
    Task<Result> AssignLecturersAsync(Guid classId, List<Guid> lecturerIds);
    Task<Result> AssignStudentsAsync(Guid classId, List<Guid> studentIds);
    Task<Result> RemoveLecturerAsync(Guid classId, Guid lecturerId);
    Task<Result> RemoveStudentAsync(Guid classId, Guid studentId);
    Task<Result<List<ClassMemberDto>>> GetClassMembersAsync(Guid classId);
    Task<Result<List<Guid>>> GetLecturersAsync(Guid classId);
    Task<Result<List<Guid>>> GetStudentsAsync(Guid classId);
}
