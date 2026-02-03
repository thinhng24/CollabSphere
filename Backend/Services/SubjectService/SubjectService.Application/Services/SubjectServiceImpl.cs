using Microsoft.EntityFrameworkCore;
using SubjectService.Application.DTOs;
using SubjectService.Application.Interfaces;
using SubjectService.Domain.Entities;
using SharedKernel.Common;
using SharedKernel.Interfaces;

namespace SubjectService.Application.Services;

public class SubjectServiceImpl : ISubjectService
{
    private readonly IRepository<Subject> _subjectRepository;

    public SubjectServiceImpl(IRepository<Subject> subjectRepository)
    {
        _subjectRepository = subjectRepository;
    }

    public async Task<Result<SubjectDto>> CreateSubjectAsync(CreateSubjectDto dto, Guid createdBy)
    {
        var existingSubject = await _subjectRepository.GetAll()
            .Where(s => s.Code == dto.Code && !s.IsDeleted)
            .FirstOrDefaultAsync();

        if (existingSubject != null)
        {
            return Result<SubjectDto>.Failure("Subject with this code already exists", "DUPLICATE_CODE");
        }

        var subjectEntity = new Subject
        {
            Name = dto.Name,
            Code = dto.Code,
            Description = dto.Description,
            CreditHours = dto.CreditHours
        };

        await _subjectRepository.AddAsync(subjectEntity);

        var subjectDto = new SubjectDto
        {
            Id = subjectEntity.Id,
            Name = subjectEntity.Name,
            Code = subjectEntity.Code,
            Description = subjectEntity.Description,
            CreditHours = subjectEntity.CreditHours,
            CreatedAt = subjectEntity.CreatedAt,
            UpdatedAt = subjectEntity.UpdatedAt
        };

        return Result<SubjectDto>.Success(subjectDto, "Subject created successfully");
    }

    public async Task<Result<SubjectDto>> GetSubjectByIdAsync(Guid id)
    {
        var subjectEntity = await _subjectRepository.GetByIdAsync(id);

        if (subjectEntity == null || subjectEntity.IsDeleted)
        {
            return Result<SubjectDto>.Failure("Subject not found", "NOT_FOUND");
        }

        var subjectDto = new SubjectDto
        {
            Id = subjectEntity.Id,
            Name = subjectEntity.Name,
            Code = subjectEntity.Code,
            Description = subjectEntity.Description,
            CreditHours = subjectEntity.CreditHours,
            CreatedAt = subjectEntity.CreatedAt,
            UpdatedAt = subjectEntity.UpdatedAt
        };

        return Result<SubjectDto>.Success(subjectDto);
    }

    public async Task<Result<List<SubjectDto>>> GetAllSubjectsAsync()
    {
        var subjects = await _subjectRepository.GetAll()
            .Where(s => !s.IsDeleted)
            .Select(s => new SubjectDto
            {
                Id = s.Id,
                Name = s.Name,
                Code = s.Code,
                Description = s.Description,
                CreditHours = s.CreditHours,
                CreatedAt = s.CreatedAt,
                UpdatedAt = s.UpdatedAt
            })
            .ToListAsync();

        return Result<List<SubjectDto>>.Success(subjects);
    }

    public async Task<Result<SubjectDto>> UpdateSubjectAsync(Guid id, UpdateSubjectDto dto)
    {
        var subjectEntity = await _subjectRepository.GetByIdAsync(id);

        if (subjectEntity == null || subjectEntity.IsDeleted)
        {
            return Result<SubjectDto>.Failure("Subject not found", "NOT_FOUND");
        }

        subjectEntity.Name = dto.Name;
        subjectEntity.Code = dto.Code;
        subjectEntity.Description = dto.Description;
        subjectEntity.CreditHours = dto.CreditHours;
        subjectEntity.UpdatedAt = DateTime.UtcNow;

        await _subjectRepository.UpdateAsync(subjectEntity);

        var subjectDto = new SubjectDto
        {
            Id = subjectEntity.Id,
            Name = subjectEntity.Name,
            Code = subjectEntity.Code,
            Description = subjectEntity.Description,
            CreditHours = subjectEntity.CreditHours,
            CreatedAt = subjectEntity.CreatedAt,
            UpdatedAt = subjectEntity.UpdatedAt
        };

        return Result<SubjectDto>.Success(subjectDto, "Subject updated successfully");
    }

    public async Task<Result> DeleteSubjectAsync(Guid id)
    {
        var subjectEntity = await _subjectRepository.GetByIdAsync(id);

        if (subjectEntity == null || subjectEntity.IsDeleted)
        {
            return Result.Failure("Subject not found", "NOT_FOUND");
        }

        subjectEntity.IsDeleted = true;
        subjectEntity.DeletedAt = DateTime.UtcNow;

        await _subjectRepository.UpdateAsync(subjectEntity);

        return Result.Success("Subject deleted successfully");
    }
}
