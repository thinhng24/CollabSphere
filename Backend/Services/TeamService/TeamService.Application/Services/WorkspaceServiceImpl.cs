using Microsoft.EntityFrameworkCore;
using TeamService.Application.DTOs;
using TeamService.Application.Interfaces;
using TeamService.Domain.Entities;
using SharedKernel.Common;
using SharedKernel.Interfaces;

namespace TeamService.Application.Services;

public class WorkspaceServiceImpl : IWorkspaceService
{
    private readonly IRepository<Workspace> _workspaceRepository;
    private readonly IRepository<Team> _teamRepository;

    public WorkspaceServiceImpl(IRepository<Workspace> workspaceRepository, IRepository<Team> teamRepository)
    {
        _workspaceRepository = workspaceRepository;
        _teamRepository = teamRepository;
    }

    public async Task<Result<WorkspaceDto>> GetWorkspaceByTeamAsync(Guid teamId)
    {
        var workspace = await _workspaceRepository.GetAll()
            .FirstOrDefaultAsync(w => w.TeamId == teamId && !w.IsDeleted);

        if (workspace == null)
        {
            // Create workspace if it doesn't exist
            return await CreateWorkspaceAsync(teamId);
        }

        var workspaceDto = new WorkspaceDto
        {
            Id = workspace.Id,
            TeamId = workspace.TeamId,
            Cards = workspace.Cards,
            CreatedAt = workspace.CreatedAt,
            UpdatedAt = workspace.UpdatedAt
        };

        return Result<WorkspaceDto>.Success(workspaceDto);
    }

    public async Task<Result<WorkspaceDto>> UpdateWorkspaceAsync(Guid teamId, UpdateWorkspaceDto dto)
    {
        var workspace = await _workspaceRepository.GetAll()
            .FirstOrDefaultAsync(w => w.TeamId == teamId && !w.IsDeleted);

        if (workspace == null)
        {
            return Result<WorkspaceDto>.Failure("Workspace not found", "NOT_FOUND");
        }

        workspace.Cards = dto.Cards;
        workspace.UpdatedAt = DateTime.UtcNow;

        await _workspaceRepository.UpdateAsync(workspace);

        var workspaceDto = new WorkspaceDto
        {
            Id = workspace.Id,
            TeamId = workspace.TeamId,
            Cards = workspace.Cards,
            CreatedAt = workspace.CreatedAt,
            UpdatedAt = workspace.UpdatedAt
        };

        return Result<WorkspaceDto>.Success(workspaceDto);
    }

    public async Task<Result<WorkspaceDto>> CreateWorkspaceAsync(Guid teamId)
    {
        var team = await _teamRepository.GetByIdAsync(teamId);

        if (team == null || team.IsDeleted)
        {
            return Result<WorkspaceDto>.Failure("Team not found", "NOT_FOUND");
        }

        var workspace = new Workspace
        {
            TeamId = teamId,
            Cards = "[]"
        };

        await _workspaceRepository.AddAsync(workspace);

        var workspaceDto = new WorkspaceDto
        {
            Id = workspace.Id,
            TeamId = workspace.TeamId,
            Cards = workspace.Cards,
            CreatedAt = workspace.CreatedAt,
            UpdatedAt = workspace.UpdatedAt
        };

        return Result<WorkspaceDto>.Success(workspaceDto);
    }
}
