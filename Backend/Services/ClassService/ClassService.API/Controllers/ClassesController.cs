using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ClassService.Application.DTOs;
using ClassService.Application.Interfaces;
using System.Security.Claims;

namespace ClassService.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ClassesController : ControllerBase
{
    private readonly IClassService _classService;

    public ClassesController(IClassService classService)
    {
        _classService = classService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var result = await _classService.GetAllClassesAsync();
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var result = await _classService.GetClassByIdAsync(id);
        if (!result.IsSuccess)
            return NotFound(result);
        return Ok(result);
    }

    [HttpGet("lecturer/{lecturerId}")]
    public async Task<IActionResult> GetByLecturer(Guid lecturerId)
    {
        var result = await _classService.GetClassesByLecturerAsync(lecturerId);
        return Ok(result);
    }

    [HttpGet("student/{studentId}")]
    public async Task<IActionResult> GetByStudent(Guid studentId)
    {
        var result = await _classService.GetClassesByStudentAsync(studentId);
        return Ok(result);
    }

    [HttpPost]
    [Authorize(Roles = "Lecturer,HeadDepartment,Admin")]
    public async Task<IActionResult> Create([FromBody] CreateClassDto dto)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        if (userIdClaim == null)
            return Unauthorized();

        var userId = Guid.Parse(userIdClaim.Value);
        var result = await _classService.CreateClassAsync(dto, userId);

        if (!result.IsSuccess)
            return BadRequest(result);

        return CreatedAtAction(nameof(GetById), new { id = result.Data!.Id }, result);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Lecturer,HeadDepartment,Admin")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateClassDto dto)
    {
        var result = await _classService.UpdateClassAsync(id, dto);
        if (!result.IsSuccess)
            return BadRequest(result);
        return Ok(result);
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "HeadDepartment,Admin")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var result = await _classService.DeleteClassAsync(id);
        if (!result.IsSuccess)
            return BadRequest(result);
        return Ok(result);
    }
}
