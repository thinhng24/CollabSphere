using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ProjectService.Application.DTOs;
using ProjectService.Application.Interfaces;
using System.Security.Claims;

namespace ProjectService.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ProjectsController : ControllerBase
{
    private readonly IProjectService _projectService;

    public ProjectsController(IProjectService projectService)
    {
        _projectService = projectService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 10)
    {
        var result = await _projectService.GetAllProjectsAsync(pageNumber, pageSize);
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var result = await _projectService.GetProjectByIdAsync(id);
        if (!result.IsSuccess)
            return NotFound(result);
        return Ok(result);
    }

    [HttpPost]
    [Authorize(Roles = "Lecturer")]
    public async Task<IActionResult> Create([FromBody] CreateProjectRequest request)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        if (userIdClaim == null)
            return Unauthorized();

        var userId = Guid.Parse(userIdClaim.Value);
        var result = await _projectService.CreateProjectAsync(request, userId);

        if (!result.IsSuccess)
            return BadRequest(result);

        return CreatedAtAction(nameof(GetById), new { id = result.Data!.Id }, result);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Lecturer")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateProjectRequest request)
    {
        var result = await _projectService.UpdateProjectAsync(id, request);
        if (!result.IsSuccess)
            return BadRequest(result);
        return Ok(result);
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Lecturer,Admin")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var result = await _projectService.DeleteProjectAsync(id);
        if (!result.IsSuccess)
            return BadRequest(result);
        return Ok(result);
    }

    [HttpPost("{id}/submit")]
    [Authorize(Roles = "Lecturer")]
    public async Task<IActionResult> Submit(Guid id)
    {
        var result = await _projectService.SubmitForApprovalAsync(id);
        if (!result.IsSuccess)
            return BadRequest(result);
        return Ok(result);
    }

    [HttpPost("{id}/approve")]
    [Authorize(Roles = "HeadDepartment")]
    public async Task<IActionResult> Approve(Guid id, [FromBody] ApprovalRequest request)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        if (userIdClaim == null)
            return Unauthorized();

        var reviewerId = Guid.Parse(userIdClaim.Value);
        var result = await _projectService.ApproveProjectAsync(id, reviewerId, request.Comments);

        if (!result.IsSuccess)
            return BadRequest(result);
        return Ok(result);
    }

    [HttpPost("{id}/reject")]
    [Authorize(Roles = "HeadDepartment")]
    public async Task<IActionResult> Reject(Guid id, [FromBody] RejectionRequest request)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        if (userIdClaim == null)
            return Unauthorized();

        var reviewerId = Guid.Parse(userIdClaim.Value);
        var result = await _projectService.RejectProjectAsync(id, reviewerId, request.Reason);

        if (!result.IsSuccess)
            return BadRequest(result);
        return Ok(result);
    }

    [HttpPost("{id}/generate-milestones")]
    [Authorize(Roles = "Lecturer")]
    public async Task<IActionResult> GenerateMilestones(Guid id, [FromBody] GenerateMilestonesRequest request)
    {
        var result = await _projectService.GenerateMilestonesAsync(id, request);
        if (!result.IsSuccess)
            return BadRequest(result);
        return Ok(result);
    }
}

public class ApprovalRequest
{
    public string? Comments { get; set; }
}

public class RejectionRequest
{
    public string Reason { get; set; } = string.Empty;
}
