using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SubjectService.Application.DTOs;
using SubjectService.Application.Interfaces;
using System.Security.Claims;

namespace SubjectService.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class SyllabiController : ControllerBase
{
    private readonly ISyllabusService _syllabusService;

    public SyllabiController(ISyllabusService syllabusService)
    {
        _syllabusService = syllabusService;
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var result = await _syllabusService.GetSyllabusByIdAsync(id);
        if (!result.IsSuccess)
            return NotFound(result);
        return Ok(result);
    }

    [HttpGet("subject/{subjectId}")]
    public async Task<IActionResult> GetBySubjectId(Guid subjectId)
    {
        var result = await _syllabusService.GetSyllabusBySubjectIdAsync(subjectId);
        return Ok(result);
    }

    [HttpPost]
    [Authorize(Roles = "Lecturer,HeadDepartment,Admin")]
    public async Task<IActionResult> Create([FromBody] CreateSyllabusDto dto)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        if (userIdClaim == null)
            return Unauthorized();

        var userId = Guid.Parse(userIdClaim.Value);
        var result = await _syllabusService.CreateSyllabusAsync(dto, userId);

        if (!result.IsSuccess)
            return BadRequest(result);

        return CreatedAtAction(nameof(GetById), new { id = result.Data!.Id }, result);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Lecturer,HeadDepartment,Admin")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateSyllabusDto dto)
    {
        var result = await _syllabusService.UpdateSyllabusAsync(id, dto);
        if (!result.IsSuccess)
            return BadRequest(result);
        return Ok(result);
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "HeadDepartment,Admin")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var result = await _syllabusService.DeleteSyllabusAsync(id);
        if (!result.IsSuccess)
            return BadRequest(result);
        return Ok(result);
    }
}
