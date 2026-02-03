using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TeamService.Application.DTOs;
using TeamService.Application.Interfaces;

namespace TeamService.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class WorkspacesController : ControllerBase
{
    private readonly IWorkspaceService _workspaceService;

    public WorkspacesController(IWorkspaceService workspaceService)
    {
        _workspaceService = workspaceService;
    }

    [HttpGet("team/{teamId}")]
    public async Task<IActionResult> GetByTeam(Guid teamId)
    {
        var result = await _workspaceService.GetWorkspaceByTeamAsync(teamId);
        if (!result.IsSuccess)
            return NotFound(result);
        return Ok(result);
    }

    [HttpPut("team/{teamId}")]
    public async Task<IActionResult> Update(Guid teamId, [FromBody] UpdateWorkspaceDto dto)
    {
        var result = await _workspaceService.UpdateWorkspaceAsync(teamId, dto);
        if (!result.IsSuccess)
            return BadRequest(result);
        return Ok(result);
    }

    [HttpPost("team/{teamId}")]
    public async Task<IActionResult> Create(Guid teamId)
    {
        var result = await _workspaceService.CreateWorkspaceAsync(teamId);
        if (!result.IsSuccess)
            return BadRequest(result);
        return Ok(result);
    }
}
