using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CollabSphere.API.Data;
using CollabSphere.API.Models;
using Microsoft.AspNetCore.Authorization;
using System.Text.RegularExpressions;

namespace CollabSphere.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class MeetingsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<MeetingsController> _logger;
        private readonly IConfiguration _configuration;

        public MeetingsController(
            ApplicationDbContext context, 
            ILogger<MeetingsController> logger,
            IConfiguration configuration)
        {
            _context = context;
            _logger = logger;
            _configuration = configuration;
        }

        [HttpGet("team/{teamId}")]
        public async Task<ActionResult<IEnumerable<MeetingDto>>> GetTeamMeetings(Guid teamId)
        {
            var meetings = await _context.Meetings
                .Include(m => m.Participants)
                .ThenInclude(p => p.User)
                .Where(m => m.TeamId == teamId)
                .OrderByDescending(m => m.StartTime)
                .ToListAsync();

            return Ok(meetings.Select(m => MapToDto(m)));
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<MeetingDto>> GetMeeting(Guid id)
        {
            var meeting = await _context.Meetings
                .Include(m => m.Participants)
                .ThenInclude(p => p.User)
                .FirstOrDefaultAsync(m => m.Id == id);

            if (meeting == null)
                return NotFound();

            return Ok(MapToDto(meeting));
        }

        [HttpPost]
        public async Task<ActionResult<MeetingDto>> CreateMeeting(CreateMeetingDto dto)
        {
            // Validate team exists
            var team = await _context.Teams.FindAsync(dto.TeamId);
            if (team == null)
                return BadRequest("Team not found");

            // Validate time
            if (dto.StartTime >= dto.EndTime)
                return BadRequest("End time must be after start time");

            // Generate unique meeting link
            var meetingLink = GenerateMeetingLink();

            var meeting = new Meeting
            {
                Title = dto.Title,
                Description = dto.Description ?? string.Empty,
                TeamId = dto.TeamId,
                StartTime = dto.StartTime.ToUniversalTime(),
                EndTime = dto.EndTime.ToUniversalTime(),
                MeetingLink = meetingLink,
                Agenda = dto.Agenda,
                Status = MeetingStatus.Scheduled
            };

            // Add host as participant
            var currentUserId = Guid.Parse(User.FindFirst("userId")?.Value ?? "");
            meeting.Participants.Add(new MeetingParticipant
            {
                UserId = currentUserId,
                Role = ParticipantRole.Host
            });

            // Add other participants
            if (dto.ParticipantIds != null)
            {
                foreach (var participantId in dto.ParticipantIds)
                {
                    if (participantId != currentUserId)
                    {
                        meeting.Participants.Add(new MeetingParticipant
                        {
                            UserId = participantId,
                            Role = ParticipantRole.Attendee
                        });
                    }
                }
            }

            _context.Meetings.Add(meeting);
            await _context.SaveChangesAsync();

            _logger.LogInformation($"Meeting created: {meeting.Id} for team {dto.TeamId}");

            return CreatedAtAction(nameof(GetMeeting), new { id = meeting.Id }, MapToDto(meeting));
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateMeeting(Guid id, UpdateMeetingDto dto)
        {
            var meeting = await _context.Meetings
                .Include(m => m.Participants)
                .FirstOrDefaultAsync(m => m.Id == id);

            if (meeting == null)
                return NotFound();

            // Check permission
            var currentUserId = Guid.Parse(User.FindFirst("userId")?.Value ?? "");
            var isHost = meeting.Participants.Any(p => p.UserId == currentUserId && p.Role == ParticipantRole.Host);
            
            if (!isHost && !User.IsInRole("Lecturer"))
                return Forbid();

            meeting.Title = dto.Title ?? meeting.Title;
            meeting.Description = dto.Description ?? meeting.Description;
            
            if (dto.StartTime.HasValue)
                meeting.StartTime = dto.StartTime.Value.ToUniversalTime();
            
            if (dto.EndTime.HasValue)
                meeting.EndTime = dto.EndTime.Value.ToUniversalTime();
            
            meeting.Agenda = dto.Agenda ?? meeting.Agenda;
            meeting.UpdatedAt = DateTime.UtcNow;

            // Update participants if provided
            if (dto.ParticipantIds != null)
            {
                // Remove participants not in new list
                var participantsToRemove = meeting.Participants
                    .Where(p => p.UserId != currentUserId && !dto.ParticipantIds.Contains(p.UserId))
                    .ToList();
                
                foreach (var participant in participantsToRemove)
                {
                    _context.MeetingParticipants.Remove(participant);
                }

                // Add new participants
                var existingParticipantIds = meeting.Participants.Select(p => p.UserId).ToList();
                foreach (var participantId in dto.ParticipantIds)
                {
                    if (!existingParticipantIds.Contains(participantId) && participantId != currentUserId)
                    {
                        meeting.Participants.Add(new MeetingParticipant
                        {
                            UserId = participantId,
                            Role = ParticipantRole.Attendee
                        });
                    }
                }
            }

            await _context.SaveChangesAsync();

            return Ok(MapToDto(meeting));
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteMeeting(Guid id)
        {
            var meeting = await _context.Meetings.FindAsync(id);
            if (meeting == null)
                return NotFound();

            // Check permission
            var currentUserId = Guid.Parse(User.FindFirst("userId")?.Value ?? "");
            var participant = await _context.MeetingParticipants
                .FirstOrDefaultAsync(p => p.MeetingId == id && p.UserId == currentUserId);
            
            if (participant?.Role != ParticipantRole.Host && !User.IsInRole("Lecturer"))
                return Forbid();

            _context.Meetings.Remove(meeting);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        [HttpPost("{id}/start")]
        public async Task<IActionResult> StartMeeting(Guid id)
        {
            var meeting = await _context.Meetings.FindAsync(id);
            if (meeting == null)
                return NotFound();

            // Check if user is participant
            var currentUserId = Guid.Parse(User.FindFirst("userId")?.Value ?? "");
            var participant = await _context.MeetingParticipants
                .FirstOrDefaultAsync(p => p.MeetingId == id && p.UserId == currentUserId);
            
            if (participant == null)
                return Forbid();

            meeting.Status = MeetingStatus.InProgress;
            meeting.UpdatedAt = DateTime.UtcNow;

            participant.JoinedAt = DateTime.UtcNow;
            participant.HasCameraOn = true;
            participant.HasMicOn = true;

            await _context.SaveChangesAsync();

            return Ok(new { message = "Meeting started" });
        }

        [HttpPost("{id}/end")]
        public async Task<IActionResult> EndMeeting(Guid id)
        {
            var meeting = await _context.Meetings.FindAsync(id);
            if (meeting == null)
                return NotFound();

            // Check permission
            var currentUserId = Guid.Parse(User.FindFirst("userId")?.Value ?? "");
            var participant = await _context.MeetingParticipants
                .FirstOrDefaultAsync(p => p.MeetingId == id && p.UserId == currentUserId);
            
            if (participant?.Role != ParticipantRole.Host && !User.IsInRole("Lecturer"))
                return Forbid();

            meeting.Status = MeetingStatus.Completed;
            meeting.UpdatedAt = DateTime.UtcNow;

            // Update all participants left time
            var participants = await _context.MeetingParticipants
                .Where(p => p.MeetingId == id && p.LeftAt == null)
                .ToListAsync();
            
            foreach (var p in participants)
            {
                p.LeftAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();

            return Ok(new { message = "Meeting ended" });
        }

        [HttpPost("{id}/recording/start")]
        public async Task<IActionResult> StartRecording(Guid id)
        {
            var meeting = await _context.Meetings.FindAsync(id);
            if (meeting == null)
                return NotFound();

            // Check permission - only host or lecturer can record
            var currentUserId = Guid.Parse(User.FindFirst("userId")?.Value ?? "");
            var participant = await _context.MeetingParticipants
                .FirstOrDefaultAsync(p => p.MeetingId == id && p.UserId == currentUserId);
            
            if ((participant?.Role != ParticipantRole.Host && participant?.Role != ParticipantRole.CoHost) 
                && !User.IsInRole("Lecturer"))
                return Forbid();

            meeting.RecordingStartedAt = DateTime.UtcNow;
            meeting.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(new { 
                message = "Recording started",
                recordingStartedAt = meeting.RecordingStartedAt 
            });
        }

        [HttpPost("{id}/recording/stop")]
        public async Task<IActionResult> StopRecording(Guid id, [FromBody] StopRecordingDto dto)
        {
            var meeting = await _context.Meetings.FindAsync(id);
            if (meeting == null)
                return NotFound();

            // Check permission
            var currentUserId = Guid.Parse(User.FindFirst("userId")?.Value ?? "");
            var participant = await _context.MeetingParticipants
                .FirstOrDefaultAsync(p => p.MeetingId == id && p.UserId == currentUserId);
            
            if ((participant?.Role != ParticipantRole.Host && participant?.Role != ParticipantRole.CoHost) 
                && !User.IsInRole("Lecturer"))
                return Forbid();

            meeting.RecordingEndedAt = DateTime.UtcNow;
            meeting.RecordingUrl = dto.RecordingUrl;
            meeting.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(new { 
                message = "Recording stopped",
                recordingUrl = meeting.RecordingUrl 
            });
        }

        private string GenerateMeetingLink()
        {
            var baseUrl = _configuration["Meeting:BaseUrl"] ?? "https://meet.collabsphere.com";
            var randomId = Guid.NewGuid().ToString("N")[..10];
            return $"{baseUrl}/meet/{randomId}";
        }

        private MeetingDto MapToDto(Meeting meeting)
        {
            return new MeetingDto
            {
                Id = meeting.Id,
                Title = meeting.Title,
                Description = meeting.Description,
                TeamId = meeting.TeamId,
                StartTime = meeting.StartTime,
                EndTime = meeting.EndTime,
                MeetingLink = meeting.MeetingLink,
                Agenda = meeting.Agenda,
                MeetingNotes = meeting.MeetingNotes,
                Status = meeting.Status.ToString(),
                CreatedAt = meeting.CreatedAt,
                UpdatedAt = meeting.UpdatedAt,
                RecordingUrl = meeting.RecordingUrl,
                RecordingStartedAt = meeting.RecordingStartedAt,
                RecordingEndedAt = meeting.RecordingEndedAt,
                Participants = meeting.Participants.Select(p => new MeetingParticipantDto
                {
                    Id = p.Id,
                    UserId = p.UserId,
                    UserName = p.User?.FullName ?? string.Empty,
                    UserEmail = p.User?.Email ?? string.Empty,
                    Role = p.Role.ToString(),
                    JoinedAt = p.JoinedAt,
                    LeftAt = p.LeftAt,
                    HasCameraOn = p.HasCameraOn,
                    HasMicOn = p.HasMicOn,
                    IsScreenSharing = p.IsScreenSharing
                }).ToList()
            };
        }
    }

    // DTOs
    public class CreateMeetingDto
    {
        [Required]
        public string Title { get; set; } = string.Empty;
        
        public string? Description { get; set; }
        
        [Required]
        public Guid TeamId { get; set; }
        
        [Required]
        public DateTime StartTime { get; set; }
        
        [Required]
        public DateTime EndTime { get; set; }
        
        public string? Agenda { get; set; }
        
        public List<Guid>? ParticipantIds { get; set; }
    }

    public class UpdateMeetingDto
    {
        public string? Title { get; set; }
        public string? Description { get; set; }
        public DateTime? StartTime { get; set; }
        public DateTime? EndTime { get; set; }
        public string? Agenda { get; set; }
        public List<Guid>? ParticipantIds { get; set; }
    }

    public class MeetingDto
    {
        public Guid Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public Guid TeamId { get; set; }
        public DateTime StartTime { get; set; }
        public DateTime EndTime { get; set; }
        public string MeetingLink { get; set; } = string.Empty;
        public string? Agenda { get; set; }
        public string? MeetingNotes { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public string? RecordingUrl { get; set; }
        public DateTime? RecordingStartedAt { get; set; }
        public DateTime? RecordingEndedAt { get; set; }
        public List<MeetingParticipantDto> Participants { get; set; } = new();
    }

    public class MeetingParticipantDto
    {
        public Guid Id { get; set; }
        public Guid UserId { get; set; }
        public string UserName { get; set; } = string.Empty;
        public string UserEmail { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public DateTime? JoinedAt { get; set; }
        public DateTime? LeftAt { get; set; }
        public bool HasCameraOn { get; set; }
        public bool HasMicOn { get; set; }
        public bool IsScreenSharing { get; set; }
    }

    public class StopRecordingDto
    {
        [Required]
        public string RecordingUrl { get; set; } = string.Empty;
    }
}