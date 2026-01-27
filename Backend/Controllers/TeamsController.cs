using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProjectManagementApp.Data;
using ProjectManagementApp.DTOs;
using ProjectManagementApp.Models;
using System.Security.Claims;

namespace ProjectManagementApp.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class TeamsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public TeamsController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<TeamResponse>>> GetTeams()
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            var userRole = User.FindFirst(ClaimTypes.Role)?.Value;

            IQueryable<Team> query = _context.Teams
                .AsNoTracking()
                .Include(t => t.Lecturer)
                .Include(t => t.Members)
                    .ThenInclude(m => m.User)
                .Include(t => t.Tasks)
                .Include(t => t.Checkpoints);

            if (userRole == "Lecturer")
                query = query.Where(t => t.LecturerId == userId);
            else
                query = query.Where(t => t.Members.Any(m => m.UserId == userId));

            var teams = await query.ToListAsync();

            var teamResponses = teams.Select(t => new TeamResponse
            {
                Id = t.Id,
                Name = t.Name,
                LecturerId = t.LecturerId,
                LecturerName = t.Lecturer.Name,
                TaskCount = t.Tasks.Count,
                CompletedTaskCount = t.Tasks.Count(task => task.Status == "Done"),
                CheckpointCount = t.Checkpoints.Count,
                CreatedAt = t.CreatedAt,
                Members = t.Members.Select(m => new TeamMemberResponse
                {
                    UserId = m.UserId,
                    Name = m.User.Name,
                    Email = m.User.Email,
                    Role = m.User.Role,
                    JoinedAt = m.JoinedAt
                }).ToList()
            }).ToList();

            return Ok(teamResponses);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<TeamResponse>> GetTeam(int id)
        {
            var team = await _context.Teams
                .AsNoTracking()
                .Include(t => t.Lecturer)
                .Include(t => t.Members)
                    .ThenInclude(m => m.User)
                .Include(t => t.Tasks)
                .Include(t => t.Checkpoints)
                .FirstOrDefaultAsync(t => t.Id == id);

            if (team == null) return NotFound(new { message = "Team not found" });

            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            var userRole = User.FindFirst(ClaimTypes.Role)?.Value;

            if (userRole != "Lecturer" && !team.Members.Any(m => m.UserId == userId))
                return Forbid();

            var teamResponse = new TeamResponse
            {
                Id = team.Id,
                Name = team.Name,
                LecturerId = team.LecturerId,
                LecturerName = team.Lecturer.Name,
                TaskCount = team.Tasks.Count,
                CompletedTaskCount = team.Tasks.Count(task => task.Status == "Done"),
                CheckpointCount = team.Checkpoints.Count,
                CreatedAt = team.CreatedAt,
                Members = team.Members.Select(m => new TeamMemberResponse
                {
                    UserId = m.UserId,
                    Name = m.User.Name,
                    Email = m.User.Email,
                    Role = m.User.Role,
                    JoinedAt = m.JoinedAt
                }).ToList()
            };

            return Ok(teamResponse);
        }

        [HttpPost]
        [Authorize(Roles = "Lecturer")]
        public async Task<ActionResult<TeamResponse>> CreateTeam(CreateTeamRequest request)
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

            var team = new Team
            {
                Name = request.Name,
                LecturerId = userId,
                CreatedAt = DateTime.UtcNow
            };

            _context.Teams.Add(team);
            await _context.SaveChangesAsync();

            // Lấy tất cả userId hợp lệ 1 lần
            var memberIds = request.MemberIds.Distinct().ToList();
            var users = await _context.Users
                .Where(u => memberIds.Contains(u.Id) && u.Role == "Student")
                .ToListAsync();

            var teamMembers = users.Select(u => new TeamMember
            {
                TeamId = team.Id,
                UserId = u.Id,
                JoinedAt = DateTime.UtcNow
            }).ToList();

            _context.TeamMembers.AddRange(teamMembers);
            await _context.SaveChangesAsync();

            var createdTeam = await _context.Teams
                .Include(t => t.Lecturer)
                .Include(t => t.Members)
                    .ThenInclude(m => m.User)
                .FirstOrDefaultAsync(t => t.Id == team.Id);

            var teamResponse = new TeamResponse
            {
                Id = createdTeam!.Id,
                Name = createdTeam.Name,
                LecturerId = createdTeam.LecturerId,
                LecturerName = createdTeam.Lecturer.Name,
                CreatedAt = createdTeam.CreatedAt,
                Members = createdTeam.Members.Select(m => new TeamMemberResponse
                {
                    UserId = m.UserId,
                    Name = m.User.Name,
                    Email = m.User.Email,
                    Role = m.User.Role,
                    JoinedAt = m.JoinedAt
                }).ToList()
            };

            return CreatedAtAction(nameof(GetTeam), new { id = team.Id }, teamResponse);
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Lecturer")]
        public async Task<ActionResult> UpdateTeam(int id, UpdateTeamRequest request)
        {
            var team = await _context.Teams.FindAsync(id);
            if (team == null) return NotFound(new { message = "Team not found" });

            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            if (team.LecturerId != userId) return Forbid();

            team.Name = request.Name;
            await _context.SaveChangesAsync();

            return NoContent();
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Lecturer")]
        public async Task<ActionResult> DeleteTeam(int id)
        {
            var team = await _context.Teams.FindAsync(id);
            if (team == null) return NotFound(new { message = "Team not found" });

            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            if (team.LecturerId != userId) return Forbid();

            _context.Teams.Remove(team);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        [HttpPost("{id}/members")]
        [Authorize(Roles = "Lecturer")]
        public async Task<ActionResult> AddMember(int id, AddMemberRequest request)
        {
            var team = await _context.Teams.FindAsync(id);
            if (team == null) return NotFound(new { message = "Team not found" });

            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            if (team.LecturerId != userId) return Forbid();

            var user = await _context.Users.FindAsync(request.UserId);
            if (user == null || user.Role != "Student")
                return BadRequest(new { message = "Invalid user or user is not a student" });

            var exists = await _context.TeamMembers.AnyAsync(tm => tm.TeamId == id && tm.UserId == request.UserId);
            if (exists) return BadRequest(new { message = "User already a member" });

            _context.TeamMembers.Add(new TeamMember
            {
                TeamId = id,
                UserId = request.UserId,
                JoinedAt = DateTime.UtcNow
            });

            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("{id}/members/{memberId}")]
        [Authorize(Roles = "Lecturer")]
        public async Task<ActionResult> RemoveMember(int id, int memberId)
        {
            var teamMember = await _context.TeamMembers
                .FirstOrDefaultAsync(tm => tm.TeamId == id && tm.UserId == memberId);

            if (teamMember == null) return NotFound(new { message = "Member not found" });

            var team = await _context.Teams.FindAsync(id);
            var currentUserId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

            if (team!.LecturerId != currentUserId) return Forbid();

            _context.TeamMembers.Remove(teamMember);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        [HttpGet("students")]
        [Authorize(Roles = "Lecturer")]
        public async Task<ActionResult<IEnumerable<TeamMemberResponse>>> GetStudents()
        {
            var students = await _context.Users
                .AsNoTracking()
                .Where(u => u.Role == "Student")
                .Select(u => new TeamMemberResponse
                {
                    UserId = u.Id,
                    Name = u.Name,
                    Email = u.Email,
                    Role = u.Role,
                    JoinedAt = u.CreatedAt
                })
                .ToListAsync();

            return Ok(students);
        }
        [HttpGet("{id}/contribution")]
public async Task<ActionResult<IEnumerable<ContributionResponse>>> GetTeamContribution(int id)
{
    var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
    var role = User.FindFirst(ClaimTypes.Role)?.Value;

    var team = await _context.Teams
        .Include(t => t.Members)
        .FirstOrDefaultAsync(t => t.Id == id);

    if (team == null)
        return NotFound(new { message = "Team not found" });

    if (role != "Lecturer" && !team.Members.Any(m => m.UserId == userId))
        return Forbid();

    // Tổng subtask của team
    var totalSubtasks = await _context.Subtasks
        .CountAsync(st => st.Task.TeamId == id);

    if (totalSubtasks == 0)
        totalSubtasks = 1; // tránh chia 0

    var contributions = await _context.TeamMembers
        .Where(tm => tm.TeamId == id)
        .Include(tm => tm.User)
        .Select(tm => new ContributionResponse
        {
            UserId = tm.UserId,
            UserName = tm.User.Name,
            CompletedSubtasks = _context.Subtasks.Count(st =>
                st.Task.TeamId == id &&
                st.Task.AssigneeId == tm.UserId &&
                st.IsDone
            ),
            TotalSubtasks = totalSubtasks
        })
        .ToListAsync();

    contributions.ForEach(c =>
    {
        c.ContributionPercent =
            Math.Round((double)c.CompletedSubtasks / c.TotalSubtasks * 100, 2);
    });

    return Ok(contributions);
}

    }
    
}
