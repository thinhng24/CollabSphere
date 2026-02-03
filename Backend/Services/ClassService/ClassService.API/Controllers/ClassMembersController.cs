using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ClassService.Application.DTOs;
using ClassService.Application.Interfaces;

namespace ClassService.API.Controllers;

[ApiController]
[Route("api/classes/{classId}/[controller]")]
[Authorize]
public class ClassMembersController : ControllerBase
{
    private readonly IClassMemberService _memberService;

    public ClassMembersController(IClassMemberService memberService)
    {
        _memberService = memberService;
    }

    [HttpGet]
    public async Task<IActionResult> GetMembers(Guid classId)
    {
        var result = await _memberService.GetClassMembersAsync(classId);
        return Ok(result);
    }

    [HttpGet("lecturers")]
    public async Task<IActionResult> GetLecturers(Guid classId)
    {
        var result = await _memberService.GetLecturersAsync(classId);
        return Ok(result);
    }

    [HttpGet("students")]
    public async Task<IActionResult> GetStudents(Guid classId)
    {
        var result = await _memberService.GetStudentsAsync(classId);
        return Ok(result);
    }

    [HttpPost("lecturers")]
    [Authorize(Roles = "HeadDepartment,Admin")]
    public async Task<IActionResult> AssignLecturers(Guid classId, [FromBody] List<Guid> lecturerIds)
    {
        var result = await _memberService.AssignLecturersAsync(classId, lecturerIds);
        if (!result.IsSuccess)
            return BadRequest(result);
        return Ok(result);
    }

    [HttpPost("students")]
    [Authorize(Roles = "Lecturer,HeadDepartment,Admin")]
    public async Task<IActionResult> AssignStudents(Guid classId, [FromBody] List<Guid> studentIds)
    {
        var result = await _memberService.AssignStudentsAsync(classId, studentIds);
        if (!result.IsSuccess)
            return BadRequest(result);
        return Ok(result);
    }

    [HttpDelete("lecturers/{lecturerId}")]
    [Authorize(Roles = "HeadDepartment,Admin")]
    public async Task<IActionResult> RemoveLecturer(Guid classId, Guid lecturerId)
    {
        var result = await _memberService.RemoveLecturerAsync(classId, lecturerId);
        if (!result.IsSuccess)
            return BadRequest(result);
        return Ok(result);
    }

    [HttpDelete("students/{studentId}")]
    [Authorize(Roles = "Lecturer,HeadDepartment,Admin")]
    public async Task<IActionResult> RemoveStudent(Guid classId, Guid studentId)
    {
        var result = await _memberService.RemoveStudentAsync(classId, studentId);
        if (!result.IsSuccess)
            return BadRequest(result);
        return Ok(result);
    }
}
