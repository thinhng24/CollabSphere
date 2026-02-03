using TeamService.Application.DTOs;
using SharedKernel.Common;

namespace TeamService.Application.Interfaces;

public interface IWorkspaceService
{
    Task<Result<WorkspaceDto>> GetWorkspaceByTeamAsync(Guid teamId);
    Task<Result<WorkspaceDto>> UpdateWorkspaceAsync(Guid teamId, UpdateWorkspaceDto dto);
    Task<Result<WorkspaceDto>> CreateWorkspaceAsync(Guid teamId);
}
