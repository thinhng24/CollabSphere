using Microsoft.EntityFrameworkCore;
using ClassService.Application.DTOs;
using ClassService.Application.Interfaces;
using ClassService.Domain.Entities;
using SharedKernel.Common;
using SharedKernel.Interfaces;

namespace ClassService.Application.Services;

public class ClassServiceImpl : IClassService
{
    private readonly IRepository<Class> _classRepository;

    public ClassServiceImpl(IRepository<Class> classRepository)
    {
        _classRepository = classRepository;
    }

    public async Task<Result<ClassDto>> CreateClassAsync(CreateClassDto dto, Guid createdBy)
    {
        var existingClass = await _classRepository.GetAll()
            .Where(c => c.Code == dto.Code && !c.IsDeleted)
            .FirstOrDefaultAsync();

        if (existingClass != null)
        {
            return Result<ClassDto>.Failure("Class with this code already exists", "DUPLICATE_CODE");
        }

        var classEntity = new Class
        {
            Name = dto.Name,
            Code = dto.Code,
            Semester = dto.Semester,
            Year = dto.Year,
            Description = dto.Description
        };

        await _classRepository.AddAsync(classEntity);

        var classDto = new ClassDto
        {
            Id = classEntity.Id,
            Name = classEntity.Name,
            Code = classEntity.Code,
            Semester = classEntity.Semester,
            Year = classEntity.Year,
            Description = classEntity.Description,
            CreatedAt = classEntity.CreatedAt,
            UpdatedAt = classEntity.UpdatedAt
        };

        return Result<ClassDto>.Success(classDto, "Class created successfully");
    }

    public async Task<Result<ClassDto>> GetClassByIdAsync(Guid id)
    {
        var classEntity = await _classRepository.GetByIdAsync(id);

        if (classEntity == null || classEntity.IsDeleted)
        {
            return Result<ClassDto>.Failure("Class not found", "NOT_FOUND");
        }

        var classDto = new ClassDto
        {
            Id = classEntity.Id,
            Name = classEntity.Name,
            Code = classEntity.Code,
            Semester = classEntity.Semester,
            Year = classEntity.Year,
            Description = classEntity.Description,
            CreatedAt = classEntity.CreatedAt,
            UpdatedAt = classEntity.UpdatedAt
        };

        return Result<ClassDto>.Success(classDto);
    }

    public async Task<Result<List<ClassDto>>> GetAllClassesAsync()
    {
        var classes = await _classRepository.GetAll()
            .Where(c => !c.IsDeleted)
            .Select(c => new ClassDto
            {
                Id = c.Id,
                Name = c.Name,
                Code = c.Code,
                Semester = c.Semester,
                Year = c.Year,
                Description = c.Description,
                CreatedAt = c.CreatedAt,
                UpdatedAt = c.UpdatedAt
            })
            .ToListAsync();

        return Result<List<ClassDto>>.Success(classes);
    }

    public async Task<Result<ClassDto>> UpdateClassAsync(Guid id, UpdateClassDto dto)
    {
        var classEntity = await _classRepository.GetByIdAsync(id);

        if (classEntity == null || classEntity.IsDeleted)
        {
            return Result<ClassDto>.Failure("Class not found", "NOT_FOUND");
        }

        classEntity.Name = dto.Name;
        classEntity.Code = dto.Code;
        classEntity.Semester = dto.Semester;
        classEntity.Year = dto.Year;
        classEntity.Description = dto.Description;
        classEntity.UpdatedAt = DateTime.UtcNow;

        await _classRepository.UpdateAsync(classEntity);

        var classDto = new ClassDto
        {
            Id = classEntity.Id,
            Name = classEntity.Name,
            Code = classEntity.Code,
            Semester = classEntity.Semester,
            Year = classEntity.Year,
            Description = classEntity.Description,
            CreatedAt = classEntity.CreatedAt,
            UpdatedAt = classEntity.UpdatedAt
        };

        return Result<ClassDto>.Success(classDto, "Class updated successfully");
    }

    public async Task<Result> DeleteClassAsync(Guid id)
    {
        var classEntity = await _classRepository.GetByIdAsync(id);

        if (classEntity == null || classEntity.IsDeleted)
        {
            return Result.Failure("Class not found", "NOT_FOUND");
        }

        classEntity.IsDeleted = true;
        classEntity.DeletedAt = DateTime.UtcNow;

        await _classRepository.UpdateAsync(classEntity);

        return Result.Success("Class deleted successfully");
    }

    public async Task<Result<List<ClassDto>>> GetClassesByLecturerAsync(Guid lecturerId)
    {
        var classes = await _classRepository.GetAll()
            .Include(c => c.ClassLecturers)
            .Where(c => !c.IsDeleted && c.ClassLecturers.Any(cl => cl.LecturerId == lecturerId))
            .Select(c => new ClassDto
            {
                Id = c.Id,
                Name = c.Name,
                Code = c.Code,
                Semester = c.Semester,
                Year = c.Year,
                Description = c.Description,
                CreatedAt = c.CreatedAt,
                UpdatedAt = c.UpdatedAt
            })
            .ToListAsync();

        return Result<List<ClassDto>>.Success(classes);
    }

    public async Task<Result<List<ClassDto>>> GetClassesByStudentAsync(Guid studentId)
    {
        var classes = await _classRepository.GetAll()
            .Include(c => c.ClassStudents)
            .Where(c => !c.IsDeleted && c.ClassStudents.Any(cs => cs.StudentId == studentId))
            .Select(c => new ClassDto
            {
                Id = c.Id,
                Name = c.Name,
                Code = c.Code,
                Semester = c.Semester,
                Year = c.Year,
                Description = c.Description,
                CreatedAt = c.CreatedAt,
                UpdatedAt = c.UpdatedAt
            })
            .ToListAsync();

        return Result<List<ClassDto>>.Success(classes);
    }
}
