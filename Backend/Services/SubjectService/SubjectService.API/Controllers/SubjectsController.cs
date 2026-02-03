using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SubjectService.Application.DTOs;
using SubjectService.Application.Interfaces;
using System.Security.Claims;

namespace SubjectService.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class SubjectsController : ControllerBase
{
    private readonly ISubjectService _subjectService;

    public SubjectsController(ISubjectService subjectService)
    {
        _subjectService = subjectService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var result = await _subjectService.GetAllSubjectsAsync();
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var result = await _subjectService.GetSubjectByIdAsync(id);
        if (!result.IsSuccess)
            return NotFound(result);
        return Ok(result);
    }

    [HttpPost]
    [Authorize(Roles = "Lecturer,HeadDepartment,Admin")]
    public async Task<IActionResult> Create([FromBody] CreateSubjectDto dto)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        if (userIdClaim == null)
            return Unauthorized();

        var userId = Guid.Parse(userIdClaim.Value);
        var result = await _subjectService.CreateSubjectAsync(dto, userId);

        if (!result.IsSuccess)
            return BadRequest(result);

        return CreatedAtAction(nameof(GetById), new { id = result.Data!.Id }, result);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Lecturer,HeadDepartment,Admin")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateSubjectDto dto)
    {
        var result = await _subjectService.UpdateSubjectAsync(id, dto);
        if (!result.IsSuccess)
            return BadRequest(result);
        return Ok(result);
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "HeadDepartment,Admin")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var result = await _subjectService.DeleteSubjectAsync(id);
        if (!result.IsSuccess)
            return BadRequest(result);
        return Ok(result);
    }
}
