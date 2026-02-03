using Microsoft.EntityFrameworkCore;
using ClassService.Application.DTOs;
using ClassService.Application.Interfaces;
using ClassService.Domain.Entities;
using ClassService.Infrastructure.Data;
using SharedKernel.Common;
using SharedKernel.Interfaces;

namespace ClassService.Infrastructure.Services;

public class ClassMemberServiceImpl : IClassMemberService
{
    private readonly IRepository<Class> _classRepository;
    private readonly ClassDbContext _context;

    public ClassMemberServiceImpl(
        IRepository<Class> classRepository,
        ClassDbContext context)
    {
        _classRepository = classRepository;
        _context = context;
    }

    public async Task<Result> AssignLecturersAsync(Guid classId, List<Guid> lecturerIds)
    {
        var classEntity = await _classRepository.GetByIdAsync(classId);
        if (classEntity == null || classEntity.IsDeleted)
        {
            return Result.Failure("Class not found", "NOT_FOUND");
        }

        var existingAssignments = await _context.ClassLecturers
            .Where(cl => cl.ClassId == classId && lecturerIds.Contains(cl.LecturerId))
            .ToListAsync();

        var existingLecturerIds = existingAssignments.Select(cl => cl.LecturerId).ToList();
        var newLecturerIds = lecturerIds.Except(existingLecturerIds).ToList();

        foreach (var lecturerId in newLecturerIds)
        {
            var assignment = new ClassLecturer
            {
                ClassId = classId,
                LecturerId = lecturerId
            };
            await _context.ClassLecturers.AddAsync(assignment);
        }

        await _context.SaveChangesAsync();

        return Result.Success($"Assigned {newLecturerIds.Count} lecturer(s) to class");
    }

    public async Task<Result> AssignStudentsAsync(Guid classId, List<Guid> studentIds)
    {
        var classEntity = await _classRepository.GetByIdAsync(classId);
        if (classEntity == null || classEntity.IsDeleted)
        {
            return Result.Failure("Class not found", "NOT_FOUND");
        }

        var existingAssignments = await _context.ClassStudents
            .Where(cs => cs.ClassId == classId && studentIds.Contains(cs.StudentId))
            .ToListAsync();

        var existingStudentIds = existingAssignments.Select(cs => cs.StudentId).ToList();
        var newStudentIds = studentIds.Except(existingStudentIds).ToList();

        foreach (var studentId in newStudentIds)
        {
            var assignment = new ClassStudent
            {
                ClassId = classId,
                StudentId = studentId
            };
            await _context.ClassStudents.AddAsync(assignment);
        }

        await _context.SaveChangesAsync();

        return Result.Success($"Assigned {newStudentIds.Count} student(s) to class");
    }

    public async Task<Result> RemoveLecturerAsync(Guid classId, Guid lecturerId)
    {
        var assignment = await _context.ClassLecturers
            .Where(cl => cl.ClassId == classId && cl.LecturerId == lecturerId)
            .FirstOrDefaultAsync();

        if (assignment == null)
        {
            return Result.Failure("Lecturer assignment not found", "NOT_FOUND");
        }

        _context.ClassLecturers.Remove(assignment);
        await _context.SaveChangesAsync();

        return Result.Success("Lecturer removed from class");
    }

    public async Task<Result> RemoveStudentAsync(Guid classId, Guid studentId)
    {
        var assignment = await _context.ClassStudents
            .Where(cs => cs.ClassId == classId && cs.StudentId == studentId)
            .FirstOrDefaultAsync();

        if (assignment == null)
        {
            return Result.Failure("Student assignment not found", "NOT_FOUND");
        }

        _context.ClassStudents.Remove(assignment);
        await _context.SaveChangesAsync();

        return Result.Success("Student removed from class");
    }

    public async Task<Result<List<ClassMemberDto>>> GetClassMembersAsync(Guid classId)
    {
        var lecturers = await _context.ClassLecturers
            .Where(cl => cl.ClassId == classId)
            .Select(cl => new ClassMemberDto
            {
                ClassId = cl.ClassId,
                UserId = cl.LecturerId,
                UserRole = "Lecturer",
                AssignedAt = cl.AssignedAt
            })
            .ToListAsync();

        var students = await _context.ClassStudents
            .Where(cs => cs.ClassId == classId)
            .Select(cs => new ClassMemberDto
            {
                ClassId = cs.ClassId,
                UserId = cs.StudentId,
                UserRole = "Student",
                AssignedAt = cs.EnrolledAt
            })
            .ToListAsync();

        var members = lecturers.Concat(students).ToList();

        return Result<List<ClassMemberDto>>.Success(members);
    }

    public async Task<Result<List<Guid>>> GetLecturersAsync(Guid classId)
    {
        var lecturerIds = await _context.ClassLecturers
            .Where(cl => cl.ClassId == classId)
            .Select(cl => cl.LecturerId)
            .ToListAsync();

        return Result<List<Guid>>.Success(lecturerIds);
    }

    public async Task<Result<List<Guid>>> GetStudentsAsync(Guid classId)
    {
        var studentIds = await _context.ClassStudents
            .Where(cs => cs.ClassId == classId)
            .Select(cs => cs.StudentId)
            .ToListAsync();

        return Result<List<Guid>>.Success(studentIds);
    }
}
