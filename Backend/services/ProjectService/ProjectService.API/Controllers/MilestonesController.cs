using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ProjectService.Application.DTOs;
using ProjectService.Application.Interfaces;

namespace ProjectService.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class MilestonesController : ControllerBase
{
    private readonly IMilestoneService _milestoneService;

    public MilestonesController(IMilestoneService milestoneService)
    {
        _milestoneService = milestoneService;
    }

    [HttpGet("project/{projectId}")]
    public async Task<IActionResult> GetByProjectId(Guid projectId)
    {
        var result = await _milestoneService.GetMilestonesByProjectIdAsync(projectId);
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var result = await _milestoneService.GetMilestoneByIdAsync(id);
        if (!result.IsSuccess)
            return NotFound(result);
        return Ok(result);
    }

    [HttpPost]
    [Authorize(Roles = "Lecturer")]
    public async Task<IActionResult> Create([FromBody] CreateMilestoneRequest request)
    {
        var result = await _milestoneService.CreateMilestoneAsync(request);
        if (!result.IsSuccess)
            return BadRequest(result);

        return CreatedAtAction(nameof(GetById), new { id = result.Data!.Id }, result);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Lecturer")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateMilestoneRequest request)
    {
        var result = await _milestoneService.UpdateMilestoneAsync(id, request);
        if (!result.IsSuccess)
            return BadRequest(result);
        return Ok(result);
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Lecturer,Admin")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var result = await _milestoneService.DeleteMilestoneAsync(id);
        if (!result.IsSuccess)
            return BadRequest(result);
        return Ok(result);
    }

    [HttpPost("{id}/complete")]
    [Authorize(Roles = "Lecturer,Student")]
    public async Task<IActionResult> Complete(Guid id)
    {
        var result = await _milestoneService.CompleteMilestoneAsync(id);
        if (!result.IsSuccess)
            return BadRequest(result);
        return Ok(result);
    }
}
