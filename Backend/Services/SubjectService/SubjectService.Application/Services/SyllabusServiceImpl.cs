using Microsoft.EntityFrameworkCore;
using SubjectService.Application.DTOs;
using SubjectService.Application.Interfaces;
using SubjectService.Domain.Entities;
using SharedKernel.Common;
using SharedKernel.Interfaces;

namespace SubjectService.Application.Services;

public class SyllabusServiceImpl : ISyllabusService
{
    private readonly IRepository<Syllabus> _syllabusRepository;
    private readonly IRepository<Subject> _subjectRepository;

    public SyllabusServiceImpl(IRepository<Syllabus> syllabusRepository, IRepository<Subject> subjectRepository)
    {
        _syllabusRepository = syllabusRepository;
        _subjectRepository = subjectRepository;
    }

    public async Task<Result<SyllabusDto>> CreateSyllabusAsync(CreateSyllabusDto dto, Guid createdBy)
    {
        var subject = await _subjectRepository.GetByIdAsync(dto.SubjectId);
        if (subject == null || subject.IsDeleted)
        {
            return Result<SyllabusDto>.Failure("Subject not found", "SUBJECT_NOT_FOUND");
        }

        var syllabusEntity = new Syllabus
        {
            SubjectId = dto.SubjectId,
            Version = dto.Version,
            Description = dto.Description,
            LearningOutcomes = dto.LearningOutcomes,
            Content = dto.Content,
            AssessmentCriteria = dto.AssessmentCriteria
        };

        await _syllabusRepository.AddAsync(syllabusEntity);

        var syllabusDto = new SyllabusDto
        {
            Id = syllabusEntity.Id,
            SubjectId = syllabusEntity.SubjectId,
            Version = syllabusEntity.Version,
            Description = syllabusEntity.Description,
            LearningOutcomes = syllabusEntity.LearningOutcomes,
            Content = syllabusEntity.Content,
            AssessmentCriteria = syllabusEntity.AssessmentCriteria,
            CreatedAt = syllabusEntity.CreatedAt,
            UpdatedAt = syllabusEntity.UpdatedAt
        };

        return Result<SyllabusDto>.Success(syllabusDto, "Syllabus created successfully");
    }

    public async Task<Result<SyllabusDto>> GetSyllabusByIdAsync(Guid id)
    {
        var syllabusEntity = await _syllabusRepository.GetByIdAsync(id);

        if (syllabusEntity == null || syllabusEntity.IsDeleted)
        {
            return Result<SyllabusDto>.Failure("Syllabus not found", "NOT_FOUND");
        }

        var syllabusDto = new SyllabusDto
        {
            Id = syllabusEntity.Id,
            SubjectId = syllabusEntity.SubjectId,
            Version = syllabusEntity.Version,
            Description = syllabusEntity.Description,
            LearningOutcomes = syllabusEntity.LearningOutcomes,
            Content = syllabusEntity.Content,
            AssessmentCriteria = syllabusEntity.AssessmentCriteria,
            CreatedAt = syllabusEntity.CreatedAt,
            UpdatedAt = syllabusEntity.UpdatedAt
        };

        return Result<SyllabusDto>.Success(syllabusDto);
    }

    public async Task<Result<List<SyllabusDto>>> GetSyllabusBySubjectIdAsync(Guid subjectId)
    {
        var syllabi = await _syllabusRepository.GetAll()
            .Where(s => s.SubjectId == subjectId && !s.IsDeleted)
            .Select(s => new SyllabusDto
            {
                Id = s.Id,
                SubjectId = s.SubjectId,
                Version = s.Version,
                Description = s.Description,
                LearningOutcomes = s.LearningOutcomes,
                Content = s.Content,
                AssessmentCriteria = s.AssessmentCriteria,
                CreatedAt = s.CreatedAt,
                UpdatedAt = s.UpdatedAt
            })
            .ToListAsync();

        return Result<List<SyllabusDto>>.Success(syllabi);
    }

    public async Task<Result<SyllabusDto>> UpdateSyllabusAsync(Guid id, UpdateSyllabusDto dto)
    {
        var syllabusEntity = await _syllabusRepository.GetByIdAsync(id);

        if (syllabusEntity == null || syllabusEntity.IsDeleted)
        {
            return Result<SyllabusDto>.Failure("Syllabus not found", "NOT_FOUND");
        }

        syllabusEntity.Version = dto.Version;
        syllabusEntity.Description = dto.Description;
        syllabusEntity.LearningOutcomes = dto.LearningOutcomes;
        syllabusEntity.Content = dto.Content;
        syllabusEntity.AssessmentCriteria = dto.AssessmentCriteria;
        syllabusEntity.UpdatedAt = DateTime.UtcNow;

        await _syllabusRepository.UpdateAsync(syllabusEntity);

        var syllabusDto = new SyllabusDto
        {
            Id = syllabusEntity.Id,
            SubjectId = syllabusEntity.SubjectId,
            Version = syllabusEntity.Version,
            Description = syllabusEntity.Description,
            LearningOutcomes = syllabusEntity.LearningOutcomes,
            Content = syllabusEntity.Content,
            AssessmentCriteria = syllabusEntity.AssessmentCriteria,
            CreatedAt = syllabusEntity.CreatedAt,
            UpdatedAt = syllabusEntity.UpdatedAt
        };

        return Result<SyllabusDto>.Success(syllabusDto, "Syllabus updated successfully");
    }

    public async Task<Result> DeleteSyllabusAsync(Guid id)
    {
        var syllabusEntity = await _syllabusRepository.GetByIdAsync(id);

        if (syllabusEntity == null || syllabusEntity.IsDeleted)
        {
            return Result.Failure("Syllabus not found", "NOT_FOUND");
        }

        syllabusEntity.IsDeleted = true;
        syllabusEntity.DeletedAt = DateTime.UtcNow;

        await _syllabusRepository.UpdateAsync(syllabusEntity);

        return Result.Success("Syllabus deleted successfully");
    }
}
