using Microsoft.EntityFrameworkCore;
using TeamService.Application.DTOs;
using TeamService.Application.Interfaces;
using TeamService.Domain.Entities;
using SharedKernel.Common;
using SharedKernel.Interfaces;

using TeamService.Infrastructure.Data;
namespace TeamService.Infrastructure.Services;

public class TeamServiceImpl : ITeamService
{
    private readonly IRepository<Team> _teamRepository;
    private readonly TeamDbContext _context;

    public TeamServiceImpl(IRepository<Team> teamRepository, TeamDbContext teamMemberRepository)
    {
        _teamRepository = teamRepository;
        _context = teamMemberRepository;
    }

    public async Task<Result<TeamDto>> CreateTeamAsync(CreateTeamDto dto, Guid createdBy)
    {
        var existingTeam = await _teamRepository.GetAll()
            .Where(t => t.Name == dto.Name && t.ClassId == dto.ClassId && !t.IsDeleted)
            .FirstOrDefaultAsync();

        if (existingTeam != null)
        {
            return Result<TeamDto>.Failure("Team with this name already exists in the class", "DUPLICATE_NAME");
        }

        var team = new Team
        {
            Name = dto.Name,
            ClassId = dto.ClassId,
            ProjectId = dto.ProjectId,
            LeaderId = dto.LeaderId
        };

        await _teamRepository.AddAsync(team);

        // Add team members
        if (dto.MemberIds.Any())
        {
            var members = dto.MemberIds.Select(studentId => new TeamMember
            {
                TeamId = team.Id,
                StudentId = studentId,
                JoinedAt = DateTime.UtcNow
            }).ToList();

            await _context.AddRangeAsync(members);
            await _context.SaveChangesAsync();
        }

        return await GetTeamByIdAsync(team.Id);
    }

    public async Task<Result<TeamDto>> GetTeamByIdAsync(Guid id)
    {
        var team = await _teamRepository.GetAll()
            .Include(t => t.TeamMembers)
            .FirstOrDefaultAsync(t => t.Id == id && !t.IsDeleted);

        if (team == null)
        {
            return Result<TeamDto>.Failure("Team not found", "NOT_FOUND");
        }

        var teamDto = new TeamDto
        {
            Id = team.Id,
            Name = team.Name,
            ClassId = team.ClassId,
            ProjectId = team.ProjectId,
            LeaderId = team.LeaderId,
            CreatedAt = team.CreatedAt,
            UpdatedAt = team.UpdatedAt,
            Members = team.TeamMembers.Select(m => new TeamMemberDto
            {
                TeamId = m.TeamId,
                StudentId = m.StudentId,
                JoinedAt = m.JoinedAt,
                ContributionPercentage = m.ContributionPercentage
            }).ToList()
        };

        return Result<TeamDto>.Success(teamDto);
    }

    public async Task<Result<List<TeamDto>>> GetAllTeamsAsync()
    {
        var teams = await _teamRepository.GetAll()
            .Include(t => t.TeamMembers)
            .Where(t => !t.IsDeleted)
            .Select(t => new TeamDto
            {
                Id = t.Id,
                Name = t.Name,
                ClassId = t.ClassId,
                ProjectId = t.ProjectId,
                LeaderId = t.LeaderId,
                CreatedAt = t.CreatedAt,
                UpdatedAt = t.UpdatedAt,
                Members = t.TeamMembers.Select(m => new TeamMemberDto
                {
                    TeamId = m.TeamId,
                    StudentId = m.StudentId,
                    JoinedAt = m.JoinedAt,
                    ContributionPercentage = m.ContributionPercentage
                }).ToList()
            })
            .ToListAsync();

        return Result<List<TeamDto>>.Success(teams);
    }

    public async Task<Result<List<TeamDto>>> GetTeamsByClassAsync(Guid classId)
    {
        var teams = await _teamRepository.GetAll()
            .Include(t => t.TeamMembers)
            .Where(t => t.ClassId == classId && !t.IsDeleted)
            .Select(t => new TeamDto
            {
                Id = t.Id,
                Name = t.Name,
                ClassId = t.ClassId,
                ProjectId = t.ProjectId,
                LeaderId = t.LeaderId,
                CreatedAt = t.CreatedAt,
                UpdatedAt = t.UpdatedAt,
                Members = t.TeamMembers.Select(m => new TeamMemberDto
                {
                    TeamId = m.TeamId,
                    StudentId = m.StudentId,
                    JoinedAt = m.JoinedAt,
                    ContributionPercentage = m.ContributionPercentage
                }).ToList()
            })
            .ToListAsync();

        return Result<List<TeamDto>>.Success(teams);
    }

    public async Task<Result<List<TeamDto>>> GetTeamsByProjectAsync(Guid projectId)
    {
        var teams = await _teamRepository.GetAll()
            .Include(t => t.TeamMembers)
            .Where(t => t.ProjectId == projectId && !t.IsDeleted)
            .Select(t => new TeamDto
            {
                Id = t.Id,
                Name = t.Name,
                ClassId = t.ClassId,
                ProjectId = t.ProjectId,
                LeaderId = t.LeaderId,
                CreatedAt = t.CreatedAt,
                UpdatedAt = t.UpdatedAt,
                Members = t.TeamMembers.Select(m => new TeamMemberDto
                {
                    TeamId = m.TeamId,
                    StudentId = m.StudentId,
                    JoinedAt = m.JoinedAt,
                    ContributionPercentage = m.ContributionPercentage
                }).ToList()
            })
            .ToListAsync();

        return Result<List<TeamDto>>.Success(teams);
    }

    public async Task<Result<TeamDto>> GetTeamByStudentAsync(Guid studentId)
    {
        var team = await _teamRepository.GetAll()
            .Include(t => t.TeamMembers)
            .FirstOrDefaultAsync(t => t.TeamMembers.Any(m => m.StudentId == studentId) && !t.IsDeleted);

        if (team == null)
        {
            return Result<TeamDto>.Failure("Team not found for this student", "NOT_FOUND");
        }

        var teamDto = new TeamDto
        {
            Id = team.Id,
            Name = team.Name,
            ClassId = team.ClassId,
            ProjectId = team.ProjectId,
            LeaderId = team.LeaderId,
            CreatedAt = team.CreatedAt,
            UpdatedAt = team.UpdatedAt,
            Members = team.TeamMembers.Select(m => new TeamMemberDto
            {
                TeamId = m.TeamId,
                StudentId = m.StudentId,
                JoinedAt = m.JoinedAt,
                ContributionPercentage = m.ContributionPercentage
            }).ToList()
        };

        return Result<TeamDto>.Success(teamDto);
    }

    public async Task<Result<TeamDto>> UpdateTeamAsync(Guid id, UpdateTeamDto dto)
    {
        var team = await _teamRepository.GetByIdAsync(id);

        if (team == null || team.IsDeleted)
        {
            return Result<TeamDto>.Failure("Team not found", "NOT_FOUND");
        }

        team.Name = dto.Name;
        team.ProjectId = dto.ProjectId;
        team.LeaderId = dto.LeaderId;
        team.UpdatedAt = DateTime.UtcNow;

        await _teamRepository.UpdateAsync(team);

        return await GetTeamByIdAsync(team.Id);
    }

    public async Task<Result> DeleteTeamAsync(Guid id)
    {
        var team = await _teamRepository.GetByIdAsync(id);

        if (team == null || team.IsDeleted)
        {
            return Result.Failure("Team not found", "NOT_FOUND");
        }

        team.IsDeleted = true;
        team.DeletedAt = DateTime.UtcNow;

        await _teamRepository.UpdateAsync(team);

        return Result.Success("Team deleted successfully");
    }

    public async Task<Result> AddTeamMembersAsync(Guid teamId, AddTeamMembersDto dto)
    {
        var team = await _teamRepository.GetByIdAsync(teamId);

        if (team == null || team.IsDeleted)
        {
            return Result.Failure("Team not found", "NOT_FOUND");
        }

        var existingMembers = await _context.GetAll()
            .Where(m => m.TeamId == teamId)
            .Select(m => m.StudentId)
            .ToListAsync();

        var newMemberIds = dto.StudentIds.Except(existingMembers).ToList();

        if (!newMemberIds.Any())
        {
            return Result.Failure("All students are already members", "ALREADY_MEMBERS");
        }

        var members = newMemberIds.Select(studentId => new TeamMember
        {
            TeamId = teamId,
            StudentId = studentId,
            JoinedAt = DateTime.UtcNow
        }).ToList();

        await _context.AddRangeAsync(members);
        await _context.SaveChangesAsync();

        return Result.Success("Team members added successfully");
    }

    public async Task<Result> RemoveTeamMemberAsync(Guid teamId, Guid studentId)
    {
        var member = await _context.FirstOrDefaultAsync(m => m.TeamId == teamId && m.StudentId == studentId);

        if (member == null)
        {
            return Result.Failure("Team member not found", "NOT_FOUND");
        }

        await _context.DeleteAsync(member);
        await _context.SaveChangesAsync();

        return Result.Success("Team member removed successfully");
    }

    public async Task<Result> UpdateMemberContributionAsync(Guid teamId, UpdateContributionDto dto)
    {
        var member = await _context.FirstOrDefaultAsync(m => m.TeamId == teamId && m.StudentId == dto.StudentId);

        if (member == null)
        {
            return Result.Failure("Team member not found", "NOT_FOUND");
        }

        member.ContributionPercentage = dto.ContributionPercentage;

        await _context.UpdateAsync(member);
        await _context.SaveChangesAsync();

        return Result.Success("Contribution percentage updated successfully");
    }
}
