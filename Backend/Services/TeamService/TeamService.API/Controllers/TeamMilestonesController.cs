using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TeamService.Application.DTOs;
using TeamService.Application.Interfaces;
using System.Security.Claims;

namespace TeamService.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class TeamMilestonesController : ControllerBase
{
    private readonly ITeamMilestoneService _teamMilestoneService;

    public TeamMilestonesController(ITeamMilestoneService teamMilestoneService)
    {
        _teamMilestoneService = teamMilestoneService;
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var result = await _teamMilestoneService.GetTeamMilestoneByIdAsync(id);
        if (!result.IsSuccess)
            return NotFound(result);
        return Ok(result);
    }

    [HttpGet("team/{teamId}")]
    public async Task<IActionResult> GetByTeam(Guid teamId)
    {
        var result = await _teamMilestoneService.GetTeamMilestonesByTeamAsync(teamId);
        return Ok(result);
    }

    [HttpGet("milestone/{milestoneId}")]
    public async Task<IActionResult> GetByMilestone(Guid milestoneId)
    {
        var result = await _teamMilestoneService.GetTeamMilestonesByMilestoneAsync(milestoneId);
        return Ok(result);
    }

    [HttpPost]
    [Authorize(Roles = "Lecturer,HeadDepartment,Admin")]
    public async Task<IActionResult> Create([FromBody] CreateTeamMilestoneDto dto)
    {
        var result = await _teamMilestoneService.CreateTeamMilestoneAsync(dto);
        if (!result.IsSuccess)
            return BadRequest(result);
        return CreatedAtAction(nameof(GetById), new { id = result.Data!.Id }, result);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Lecturer,HeadDepartment,Admin")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateTeamMilestoneDto dto)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        if (userIdClaim == null)
            return Unauthorized();

        var userId = Guid.Parse(userIdClaim.Value);
        var result = await _teamMilestoneService.UpdateTeamMilestoneAsync(id, dto, userId);
        if (!result.IsSuccess)
            return BadRequest(result);
        return Ok(result);
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Lecturer,HeadDepartment,Admin")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var result = await _teamMilestoneService.DeleteTeamMilestoneAsync(id);
        if (!result.IsSuccess)
            return BadRequest(result);
        return Ok(result);
    }

    // Milestone Questions
    [HttpPost("questions")]
    [Authorize(Roles = "Lecturer,HeadDepartment,Admin")]
    public async Task<IActionResult> CreateQuestion([FromBody] CreateMilestoneQuestionDto dto)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        if (userIdClaim == null)
            return Unauthorized();

        var userId = Guid.Parse(userIdClaim.Value);
        var result = await _teamMilestoneService.CreateQuestionAsync(dto, userId);
        if (!result.IsSuccess)
            return BadRequest(result);
        return Ok(result);
    }

    [HttpGet("questions/milestone/{milestoneId}")]
    public async Task<IActionResult> GetQuestionsByMilestone(Guid milestoneId)
    {
        var result = await _teamMilestoneService.GetQuestionsByMilestoneAsync(milestoneId);
        return Ok(result);
    }

    [HttpDelete("questions/{id}")]
    [Authorize(Roles = "Lecturer,HeadDepartment,Admin")]
    public async Task<IActionResult> DeleteQuestion(Guid id)
    {
        var result = await _teamMilestoneService.DeleteQuestionAsync(id);
        if (!result.IsSuccess)
            return BadRequest(result);
        return Ok(result);
    }

    // Milestone Answers
    [HttpPost("answers")]
    public async Task<IActionResult> SubmitAnswer([FromBody] CreateMilestoneAnswerDto dto)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        if (userIdClaim == null)
            return Unauthorized();

        var userId = Guid.Parse(userIdClaim.Value);
        var result = await _teamMilestoneService.SubmitAnswerAsync(dto, userId);
        if (!result.IsSuccess)
            return BadRequest(result);
        return Ok(result);
    }

    [HttpGet("answers/team/{teamId}/question/{questionId}")]
    public async Task<IActionResult> GetAnswersByTeamAndQuestion(Guid teamId, Guid questionId)
    {
        var result = await _teamMilestoneService.GetAnswersByTeamAndQuestionAsync(teamId, questionId);
        return Ok(result);
    }
}
