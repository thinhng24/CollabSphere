using TeamService.Application.DTOs;
using SharedKernel.Common;

namespace TeamService.Application.Interfaces;

public interface ITeamService
{
    Task<Result<TeamDto>> CreateTeamAsync(CreateTeamDto dto, Guid createdBy);
    Task<Result<TeamDto>> GetTeamByIdAsync(Guid id);
    Task<Result<List<TeamDto>>> GetAllTeamsAsync();
    Task<Result<List<TeamDto>>> GetTeamsByClassAsync(Guid classId);
    Task<Result<List<TeamDto>>> GetTeamsByProjectAsync(Guid projectId);
    Task<Result<TeamDto>> GetTeamByStudentAsync(Guid studentId);
    Task<Result<TeamDto>> UpdateTeamAsync(Guid id, UpdateTeamDto dto);
    Task<Result> DeleteTeamAsync(Guid id);
    Task<Result> AddTeamMembersAsync(Guid teamId, AddTeamMembersDto dto);
    Task<Result> RemoveTeamMemberAsync(Guid teamId, Guid studentId);
    Task<Result> UpdateMemberContributionAsync(Guid teamId, UpdateContributionDto dto);
}
