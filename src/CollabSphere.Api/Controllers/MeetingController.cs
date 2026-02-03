namespace CollabSphere.Api.Controllers;

using Microsoft.AspNetCore.Mvc;
using CollabSphere.Api.Models;
using CollabSphere.Api.Services;

[ApiController]
[Route("api/[controller]")]
public class MeetingController : ControllerBase
{

    private readonly MeetingService _meetingService;

    public MeetingController(MeetingService meetingService)
    {
        _meetingService = meetingService;
    }

    [HttpGet]
    public IActionResult GetAll()
    {
        return Ok(_meetingService.GetAllMeetings());
    }

    [HttpPost]
    public IActionResult Create([FromBody] Meeting meeting)
    {
        var created = _meetingService.CreateMeeting(meeting);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [HttpGet("{id}")]
    public IActionResult GetById(string id)
    {
        var meeting = _meetingService.GetMeeting(id);
        return meeting == null ? NotFound() : Ok(meeting);
    }
}