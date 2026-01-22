using ProjectService.Application.DTOs;
using SharedKernel.Common;

namespace ProjectService.Application.Interfaces;

public interface IProjectService
{
    Task<Result<PagedResult<ProjectDto>>> GetAllProjectsAsync(int pageNumber, int pageSize);
    Task<Result<ProjectDto>> GetProjectByIdAsync(Guid id);
    Task<Result<ProjectDto>> CreateProjectAsync(CreateProjectRequest request, Guid userId);
    Task<Result<ProjectDto>> UpdateProjectAsync(Guid id, UpdateProjectRequest request);
    Task<Result> DeleteProjectAsync(Guid id);
    Task<Result> SubmitForApprovalAsync(Guid id);
    Task<Result> ApproveProjectAsync(Guid id, Guid reviewerId, string? comments);
    Task<Result> RejectProjectAsync(Guid id, Guid reviewerId, string reason);
}
