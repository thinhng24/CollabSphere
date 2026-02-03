using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using EvaluationService.Application.DTOs;
using EvaluationService.Application.Interfaces;
using System.Security.Claims;

namespace EvaluationService.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class EvaluationsController : ControllerBase
{
    private readonly IEvaluationService _evaluationService;

    public EvaluationsController(IEvaluationService evaluationService)
    {
        _evaluationService = evaluationService;
    }

    #region Team Evaluations

    [HttpPost("team")]
    [Authorize(Roles = "Lecturer,Student")]
    public async Task<IActionResult> CreateTeamEvaluation([FromBody] CreateTeamEvaluationDto dto)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        if (userIdClaim == null)
            return Unauthorized();

        var userId = Guid.Parse(userIdClaim.Value);
        var result = await _evaluationService.CreateTeamEvaluationAsync(dto, userId);

        if (!result.IsSuccess)
            return BadRequest(result);

        return CreatedAtAction(nameof(GetTeamEvaluationById), new { id = result.Data!.Id }, result);
    }

    [HttpGet("team/{id}")]
    public async Task<IActionResult> GetTeamEvaluationById(Guid id)
    {
        var result = await _evaluationService.GetTeamEvaluationByIdAsync(id);
        if (!result.IsSuccess)
            return NotFound(result);
        return Ok(result);
    }

    [HttpGet("team/by-team/{teamId}")]
    public async Task<IActionResult> GetTeamEvaluationsByTeamId(Guid teamId)
    {
        var result = await _evaluationService.GetTeamEvaluationsByTeamIdAsync(teamId);
        return Ok(result);
    }

    [HttpGet("team/by-evaluator/{evaluatorId}")]
    public async Task<IActionResult> GetTeamEvaluationsByEvaluatorId(Guid evaluatorId)
    {
        var result = await _evaluationService.GetTeamEvaluationsByEvaluatorIdAsync(evaluatorId);
        return Ok(result);
    }

    [HttpPut("team/{id}")]
    [Authorize(Roles = "Lecturer,Student")]
    public async Task<IActionResult> UpdateTeamEvaluation(Guid id, [FromBody] UpdateTeamEvaluationDto dto)
    {
        var result = await _evaluationService.UpdateTeamEvaluationAsync(id, dto);
        if (!result.IsSuccess)
            return BadRequest(result);
        return Ok(result);
    }

    [HttpDelete("team/{id}")]
    [Authorize(Roles = "Lecturer,Admin")]
    public async Task<IActionResult> DeleteTeamEvaluation(Guid id)
    {
        var result = await _evaluationService.DeleteTeamEvaluationAsync(id);
        if (!result.IsSuccess)
            return BadRequest(result);
        return Ok(result);
    }

    #endregion

    #region Member Evaluations

    [HttpPost("member")]
    [Authorize(Roles = "Lecturer,Student")]
    public async Task<IActionResult> CreateMemberEvaluation([FromBody] CreateMemberEvaluationDto dto)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        if (userIdClaim == null)
            return Unauthorized();

        var userId = Guid.Parse(userIdClaim.Value);
        var result = await _evaluationService.CreateMemberEvaluationAsync(dto, userId);

        if (!result.IsSuccess)
            return BadRequest(result);

        return CreatedAtAction(nameof(GetMemberEvaluationById), new { id = result.Data!.Id }, result);
    }

    [HttpGet("member/{id}")]
    public async Task<IActionResult> GetMemberEvaluationById(Guid id)
    {
        var result = await _evaluationService.GetMemberEvaluationByIdAsync(id);
        if (!result.IsSuccess)
            return NotFound(result);
        return Ok(result);
    }

    [HttpGet("member/by-team/{teamId}")]
    public async Task<IActionResult> GetMemberEvaluationsByTeamId(Guid teamId)
    {
        var result = await _evaluationService.GetMemberEvaluationsByTeamIdAsync(teamId);
        return Ok(result);
    }

    [HttpGet("member/by-student/{studentId}")]
    public async Task<IActionResult> GetMemberEvaluationsByStudentId(Guid studentId)
    {
        var result = await _evaluationService.GetMemberEvaluationsByStudentIdAsync(studentId);
        return Ok(result);
    }

    [HttpGet("member/by-evaluator/{evaluatorId}")]
    public async Task<IActionResult> GetMemberEvaluationsByEvaluatorId(Guid evaluatorId)
    {
        var result = await _evaluationService.GetMemberEvaluationsByEvaluatorIdAsync(evaluatorId);
        return Ok(result);
    }

    [HttpPut("member/{id}")]
    [Authorize(Roles = "Lecturer,Student")]
    public async Task<IActionResult> UpdateMemberEvaluation(Guid id, [FromBody] UpdateMemberEvaluationDto dto)
    {
        var result = await _evaluationService.UpdateMemberEvaluationAsync(id, dto);
        if (!result.IsSuccess)
            return BadRequest(result);
        return Ok(result);
    }

    [HttpDelete("member/{id}")]
    [Authorize(Roles = "Lecturer,Admin")]
    public async Task<IActionResult> DeleteMemberEvaluation(Guid id)
    {
        var result = await _evaluationService.DeleteMemberEvaluationAsync(id);
        if (!result.IsSuccess)
            return BadRequest(result);
        return Ok(result);
    }

    #endregion

    #region Milestone Answer Evaluations

    [HttpPost("milestone-answer")]
    [Authorize(Roles = "Lecturer,Student")]
    public async Task<IActionResult> CreateMilestoneAnswerEvaluation([FromBody] CreateMilestoneAnswerEvaluationDto dto)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        if (userIdClaim == null)
            return Unauthorized();

        var userId = Guid.Parse(userIdClaim.Value);
        var result = await _evaluationService.CreateMilestoneAnswerEvaluationAsync(dto, userId);

        if (!result.IsSuccess)
            return BadRequest(result);

        return CreatedAtAction(nameof(GetMilestoneAnswerEvaluationById), new { id = result.Data!.Id }, result);
    }

    [HttpGet("milestone-answer/{id}")]
    public async Task<IActionResult> GetMilestoneAnswerEvaluationById(Guid id)
    {
        var result = await _evaluationService.GetMilestoneAnswerEvaluationByIdAsync(id);
        if (!result.IsSuccess)
            return NotFound(result);
        return Ok(result);
    }

    [HttpGet("milestone-answer/by-answer/{milestoneAnswerId}")]
    public async Task<IActionResult> GetMilestoneAnswerEvaluationsByAnswerId(Guid milestoneAnswerId)
    {
        var result = await _evaluationService.GetMilestoneAnswerEvaluationsByAnswerIdAsync(milestoneAnswerId);
        return Ok(result);
    }

    [HttpGet("milestone-answer/by-evaluator/{evaluatorId}")]
    public async Task<IActionResult> GetMilestoneAnswerEvaluationsByEvaluatorId(Guid evaluatorId)
    {
        var result = await _evaluationService.GetMilestoneAnswerEvaluationsByEvaluatorIdAsync(evaluatorId);
        return Ok(result);
    }

    [HttpPut("milestone-answer/{id}")]
    [Authorize(Roles = "Lecturer,Student")]
    public async Task<IActionResult> UpdateMilestoneAnswerEvaluation(Guid id, [FromBody] UpdateMilestoneAnswerEvaluationDto dto)
    {
        var result = await _evaluationService.UpdateMilestoneAnswerEvaluationAsync(id, dto);
        if (!result.IsSuccess)
            return BadRequest(result);
        return Ok(result);
    }

    [HttpDelete("milestone-answer/{id}")]
    [Authorize(Roles = "Lecturer,Admin")]
    public async Task<IActionResult> DeleteMilestoneAnswerEvaluation(Guid id)
    {
        var result = await _evaluationService.DeleteMilestoneAnswerEvaluationAsync(id);
        if (!result.IsSuccess)
            return BadRequest(result);
        return Ok(result);
    }

    #endregion

    #region Checkpoint Evaluations

    [HttpPost("checkpoint")]
    [Authorize(Roles = "Lecturer")]
    public async Task<IActionResult> CreateCheckpointEvaluation([FromBody] CreateCheckpointEvaluationDto dto)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        if (userIdClaim == null)
            return Unauthorized();

        var userId = Guid.Parse(userIdClaim.Value);
        var result = await _evaluationService.CreateCheckpointEvaluationAsync(dto, userId);

        if (!result.IsSuccess)
            return BadRequest(result);

        return CreatedAtAction(nameof(GetCheckpointEvaluationById), new { id = result.Data!.Id }, result);
    }

    [HttpGet("checkpoint/{id}")]
    public async Task<IActionResult> GetCheckpointEvaluationById(Guid id)
    {
        var result = await _evaluationService.GetCheckpointEvaluationByIdAsync(id);
        if (!result.IsSuccess)
            return NotFound(result);
        return Ok(result);
    }

    [HttpGet("checkpoint/by-submission/{checkpointSubmissionId}")]
    public async Task<IActionResult> GetCheckpointEvaluationsBySubmissionId(Guid checkpointSubmissionId)
    {
        var result = await _evaluationService.GetCheckpointEvaluationsBySubmissionIdAsync(checkpointSubmissionId);
        return Ok(result);
    }

    [HttpGet("checkpoint/by-evaluator/{evaluatorId}")]
    public async Task<IActionResult> GetCheckpointEvaluationsByEvaluatorId(Guid evaluatorId)
    {
        var result = await _evaluationService.GetCheckpointEvaluationsByEvaluatorIdAsync(evaluatorId);
        return Ok(result);
    }

    [HttpPut("checkpoint/{id}")]
    [Authorize(Roles = "Lecturer")]
    public async Task<IActionResult> UpdateCheckpointEvaluation(Guid id, [FromBody] UpdateCheckpointEvaluationDto dto)
    {
        var result = await _evaluationService.UpdateCheckpointEvaluationAsync(id, dto);
        if (!result.IsSuccess)
            return BadRequest(result);
        return Ok(result);
    }

    [HttpDelete("checkpoint/{id}")]
    [Authorize(Roles = "Lecturer,Admin")]
    public async Task<IActionResult> DeleteCheckpointEvaluation(Guid id)
    {
        var result = await _evaluationService.DeleteCheckpointEvaluationAsync(id);
        if (!result.IsSuccess)
            return BadRequest(result);
        return Ok(result);
    }

    #endregion
}
