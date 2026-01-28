using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProjectManagementApp.Data;
using ProjectManagementApp.DTOs;
using ProjectManagementApp.Models;
using System.Security.Claims;

namespace ProjectManagementApp.Controllers
{
    public enum CheckpointStatus
    {
        Pending,
        Graded
    }

    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class CheckpointsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public CheckpointsController(AppDbContext context)
        {
            _context = context;
        }

        private bool TryGetUserId(out int userId)
        {
            userId = 0;
            var claimValue = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return int.TryParse(claimValue, out userId);
        }

        private string GetUserRole() => User.FindFirst(ClaimTypes.Role)?.Value ?? "";

        // ================= GET USER CHECKPOINTS =================
        [HttpGet]
        public async Task<ActionResult<IEnumerable<CheckpointResponse>>> GetUserCheckpoints()
        {
            if (!TryGetUserId(out var userId))
                return Unauthorized();

            var role = GetUserRole();

            IQueryable<Checkpoint> query = _context.Checkpoints
                .Include(c => c.Team)
                    .ThenInclude(t => t.Members)
                .Include(c => c.Submissions)
                    .ThenInclude(s => s.User);

            if (role == "Lecturer")
                query = query.Where(c => c.Team.LecturerId == userId);
            else
                query = query.Where(c => c.Team.Members.Any(m => m.UserId == userId));

            var checkpoints = await query
                .OrderByDescending(c => c.DueDate)
                .ToListAsync();

            var checkpointResponses = checkpoints.Select(c =>
            {
                var mySubmission = c.Submissions.FirstOrDefault(s => s.UserId == userId);
                return new CheckpointResponse
                {
                    Id = c.Id,
                    TeamId = c.TeamId,
                    Title = c.Title,
                    Description = c.Description,
                    DueDate = c.DueDate,
                    CreatedAt = c.CreatedAt,
                    TotalMembers = c.Team.Members.Count,
                    TotalSubmissions = c.Submissions.Count,
                    HasSubmitted = mySubmission != null,
                    MySubmission = mySubmission != null ? new SubmissionResponse
                    {
                        Id = mySubmission.Id,
                        CheckpointId = mySubmission.CheckpointId,
                        UserId = mySubmission.UserId,
                        UserName = mySubmission.User.Name,
                        Content = mySubmission.Content,
                        FileUrl = mySubmission.FileUrl,
                        FileName = mySubmission.FileName,
                        Score = mySubmission.Score,
                        Feedback = mySubmission.Feedback,
                        SubmittedAt = mySubmission.SubmittedAt,
                        GradedAt = mySubmission.GradedAt
                    } : null
                };
            }).ToList();

            return Ok(checkpointResponses);
        }

        // ================= GET TEAM CHECKPOINTS =================
        [HttpGet("team/{teamId}")]
        public async Task<ActionResult<IEnumerable<CheckpointResponse>>> GetTeamCheckpoints(int teamId)
        {
            if (!TryGetUserId(out var userId))
                return Unauthorized();

            var role = GetUserRole();

            var team = await _context.Teams
                .Include(t => t.Members)
                .Include(t => t.Checkpoints)
                    .ThenInclude(c => c.Submissions)
                .ThenInclude(s => s.User)
                .FirstOrDefaultAsync(t => t.Id == teamId);

            if (team == null)
                return NotFound(new { message = "Team not found" });

            if (role != "Lecturer" && !team.Members.Any(m => m.UserId == userId))
                return Forbid();

            var responses = team.Checkpoints
                .OrderByDescending(c => c.DueDate)
                .Select(c =>
                {
                    var mySubmission = c.Submissions.FirstOrDefault(s => s.UserId == userId);
                    return new CheckpointResponse
                    {
                        Id = c.Id,
                        TeamId = c.TeamId,
                        Title = c.Title,
                        Description = c.Description,
                        DueDate = c.DueDate,
                        CreatedAt = c.CreatedAt,
                        TotalMembers = team.Members.Count,
                        TotalSubmissions = c.Submissions.Count,
                        HasSubmitted = mySubmission != null,
                        MySubmission = mySubmission != null ? new SubmissionResponse
                        {
                            Id = mySubmission.Id,
                            CheckpointId = mySubmission.CheckpointId,
                            UserId = mySubmission.UserId,
                            UserName = mySubmission.User.Name,
                            Content = mySubmission.Content,
                            FileUrl = mySubmission.FileUrl,
                            FileName = mySubmission.FileName,
                            Score = mySubmission.Score,
                            Feedback = mySubmission.Feedback,
                            SubmittedAt = mySubmission.SubmittedAt,
                            GradedAt = mySubmission.GradedAt
                        } : null
                    };
                }).ToList();

            return Ok(responses);
        }

        // ================= GET SINGLE CHECKPOINT =================
        [HttpGet("{id}")]
        public async Task<ActionResult<CheckpointResponse>> GetCheckpoint(int id)
        {
            if (!TryGetUserId(out var userId))
                return Unauthorized();

            var role = GetUserRole();

            var checkpoint = await _context.Checkpoints
                .Include(c => c.Team)
                    .ThenInclude(t => t.Members)
                .Include(c => c.Submissions)
                    .ThenInclude(s => s.User)
                .FirstOrDefaultAsync(c => c.Id == id);

            if (checkpoint == null)
                return NotFound(new { message = "Checkpoint not found" });

            if (role != "Lecturer" && !checkpoint.Team.Members.Any(m => m.UserId == userId))
                return Forbid();

            var mySubmission = checkpoint.Submissions.FirstOrDefault(s => s.UserId == userId);

            var response = new CheckpointResponse
            {
                Id = checkpoint.Id,
                TeamId = checkpoint.TeamId,
                Title = checkpoint.Title,
                Description = checkpoint.Description,
                DueDate = checkpoint.DueDate,
                CreatedAt = checkpoint.CreatedAt,
                TotalMembers = checkpoint.Team.Members.Count,
                TotalSubmissions = checkpoint.Submissions.Count,
                HasSubmitted = mySubmission != null,
                MySubmission = mySubmission != null ? new SubmissionResponse
                {
                    Id = mySubmission.Id,
                    CheckpointId = mySubmission.CheckpointId,
                    UserId = mySubmission.UserId,
                    UserName = mySubmission.User.Name,
                    Content = mySubmission.Content,
                    FileUrl = mySubmission.FileUrl,
                    FileName = mySubmission.FileName,
                    Score = mySubmission.Score,
                    Feedback = mySubmission.Feedback,
                    SubmittedAt = mySubmission.SubmittedAt,
                    GradedAt = mySubmission.GradedAt
                } : null
            };

            return Ok(response);
        }

        // ================= CREATE =================
        [HttpPost]
        [Authorize(Roles = "Lecturer")]
        public async Task<ActionResult<CheckpointResponse>> CreateCheckpoint(CreateCheckpointRequest request)
        {
            if (!TryGetUserId(out var userId))
                return Unauthorized();

            var team = await _context.Teams
                .FirstOrDefaultAsync(t => t.Id == request.TeamId && t.LecturerId == userId);

            if (team == null)
                return Forbid();

            var checkpoint = new Checkpoint
            {
                TeamId = request.TeamId,
                Title = request.Title,
                Description = request.Description,
                DueDate = request.DueDate.ToUniversalTime(),
                CreatedAt = DateTime.UtcNow,
                Status = CheckpointStatus.Pending.ToString()
            };

            _context.Checkpoints.Add(checkpoint);
            await _context.SaveChangesAsync();

            var response = new CheckpointResponse
            {
                Id = checkpoint.Id,
                TeamId = checkpoint.TeamId,
                Title = checkpoint.Title,
                Description = checkpoint.Description,
                DueDate = checkpoint.DueDate,
                CreatedAt = checkpoint.CreatedAt,
                TotalMembers = await _context.TeamMembers.CountAsync(tm => tm.TeamId == request.TeamId),
                TotalSubmissions = 0,
                HasSubmitted = false
            };

            return CreatedAtAction(nameof(GetCheckpoint), new { id = checkpoint.Id }, response);
        }

        // ================= UPDATE =================
        [HttpPut("{id}")]
        [Authorize(Roles = "Lecturer")]
        public async Task<ActionResult> UpdateCheckpoint(int id, UpdateCheckpointRequest request)
        {
            if (!TryGetUserId(out var userId))
                return Unauthorized();

            var checkpoint = await _context.Checkpoints
                .Include(c => c.Team)
                .FirstOrDefaultAsync(c => c.Id == id);

            if (checkpoint == null)
                return NotFound(new { message = "Checkpoint not found" });

            if (checkpoint.Team.LecturerId != userId)
                return Forbid();

            checkpoint.Title = request.Title;
            checkpoint.Description = request.Description;
            checkpoint.DueDate = request.DueDate.ToUniversalTime();

            await _context.SaveChangesAsync();
            return NoContent();
        }

        // ================= DELETE =================
        [HttpDelete("{id}")]
        [Authorize(Roles = "Lecturer")]
        public async Task<ActionResult> DeleteCheckpoint(int id)
        {
            if (!TryGetUserId(out var userId))
                return Unauthorized();

            var checkpoint = await _context.Checkpoints
                .Include(c => c.Team)
                .FirstOrDefaultAsync(c => c.Id == id);

            if (checkpoint == null)
                return NotFound(new { message = "Checkpoint not found" });

            if (checkpoint.Team.LecturerId != userId)
                return Forbid();

            _context.Checkpoints.Remove(checkpoint);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // ================= SUBMIT =================
        [HttpPost("submit")]
        public async Task<ActionResult> SubmitCheckpoint(SubmitCheckpointRequest request)
        {
            if (!TryGetUserId(out var userId))
                return Unauthorized();

            var checkpoint = await _context.Checkpoints
                .Include(c => c.Team)
                    .ThenInclude(t => t.Members)
                .FirstOrDefaultAsync(c => c.Id == request.CheckpointId);

            if (checkpoint == null)
                return NotFound(new { message = "Checkpoint not found" });

            if (!checkpoint.Team.Members.Any(m => m.UserId == userId))
                return Forbid();

            var existingSubmission = await _context.Submissions
                .FirstOrDefaultAsync(s => s.CheckpointId == request.CheckpointId && s.UserId == userId);

            if (existingSubmission != null)
            {
                existingSubmission.Content = request.Content;
                existingSubmission.FileUrl = request.FileUrl;
                existingSubmission.FileName = request.FileName;
                existingSubmission.SubmittedAt = DateTime.UtcNow;
            }
            else
            {
                _context.Submissions.Add(new Submission
                {
                    CheckpointId = request.CheckpointId,
                    UserId = userId,
                    Content = request.Content,
                    FileUrl = request.FileUrl,
                    FileName = request.FileName,
                    SubmittedAt = DateTime.UtcNow
                });
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = "Checkpoint submitted successfully" });
        }

        // ================= GET SUBMISSIONS =================
        [HttpGet("{id}/submissions")]
        public async Task<ActionResult> GetSubmissions(int id)
        {
            if (!TryGetUserId(out var userId))
                return Unauthorized();

            var role = GetUserRole();

            var checkpoint = await _context.Checkpoints
                .Include(c => c.Team)
                    .ThenInclude(t => t.Members)
                .Include(c => c.Submissions)
                    .ThenInclude(s => s.User)
                .FirstOrDefaultAsync(c => c.Id == id);

            if (checkpoint == null)
                return NotFound(new { message = "Checkpoint not found" });

            if (role == "Lecturer")
            {
                if (checkpoint.Team.LecturerId != userId)
                    return Forbid();
            }
            else
            {
                if (!checkpoint.Team.Members.Any(m => m.UserId == userId))
                    return Forbid();
            }

            var submissions = checkpoint.Submissions.Select(s => new SubmissionResponse
            {
                Id = s.Id,
                CheckpointId = s.CheckpointId,
                UserId = s.UserId,
                UserName = s.User.Name,
                Content = s.Content,
                FileUrl = s.FileUrl,
                FileName = s.FileName,
                Score = s.Score,
                Feedback = s.Feedback,
                SubmittedAt = s.SubmittedAt,
                GradedAt = s.GradedAt
            }).ToList();

            return Ok(submissions);
        }

        // ================= GRADE SINGLE SUBMISSION =================
        [HttpPost("{id}/submissions/{submissionId}/grade")]
        [Authorize(Roles = "Lecturer")]
        public async Task<ActionResult> GradeSubmission(int id, int submissionId, GradeSubmissionRequest request)
        {
            if (!TryGetUserId(out var userId))
                return Unauthorized();

            var submission = await _context.Submissions
                .Include(s => s.Checkpoint)
                    .ThenInclude(c => c.Team)
                .FirstOrDefaultAsync(s => s.Id == submissionId && s.CheckpointId == id);

            if (submission == null)
                return NotFound(new { message = "Submission not found" });

            if (submission.Checkpoint.Team.LecturerId != userId)
                return Forbid();

            submission.Score = request.Score;
            submission.Feedback = request.Feedback;
            submission.GradedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return Ok(new { message = "Submission graded successfully" });
        }

        // ================= GRADE ENTIRE CHECKPOINT =================
        [HttpPost("{id}/grade")]
        [Authorize(Roles = "Lecturer")]
        public async Task<IActionResult> GradeCheckpoint(int id)
        {
            if (!TryGetUserId(out var userId))
                return Unauthorized();

            var checkpoint = await _context.Checkpoints
                .FirstOrDefaultAsync(c => c.Id == id);

            if (checkpoint == null)
                return NotFound("Checkpoint không tồn tại");

            if (checkpoint.Status == CheckpointStatus.Graded.ToString())
                return BadRequest("Checkpoint đã được chấm");

            checkpoint.Status = CheckpointStatus.Graded.ToString();
            checkpoint.GradedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return Ok("Chấm checkpoint thành công");
        }
    }
}
