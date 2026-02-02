using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProjectManagementApp.Data;
using ProjectManagementApp.DTOs;
using ProjectManagementApp.Models;
using System.Security.Claims;
using Task = ProjectManagementApp.Models.Task; // ALIAS để tránh conflict

namespace ProjectManagementApp.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class TasksController : ControllerBase
    {
        private readonly AppDbContext _context;

        public TasksController(AppDbContext context)
        {
            _context = context;
        }

        private int GetUserId() => int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
        private string GetUserRole() => User.FindFirst(ClaimTypes.Role)?.Value ?? "";

        private bool CanAccessTask(Task task, int userId, string role)
        {
            return role == "Lecturer" || task.AssigneeId == userId || task.Team.Members.Any(m => m.UserId == userId);
        }

        private bool CanAccessTeam(Team team, int userId, string role)
        {
            return role == "Lecturer" || team.Members.Any(m => m.UserId == userId);
        }

        private TaskResponse MapTask(Task t)
        {
            return new TaskResponse
            {
                Id = t.Id,
                TeamId = t.TeamId,
                Title = t.Title,
                Description = t.Description,
                Status = t.Status,
                AssigneeId = t.AssigneeId,
                AssigneeName = t.Assignee?.Name,
                Order = t.Order,
                Deadline = t.Deadline,
                EstimatedHours = t.EstimatedHours,
                ActualHours = t.ActualHours,
                Progress = t.Subtasks.Count > 0 ? 
                    (double)t.Subtasks.Count(st => st.IsDone) / t.Subtasks.Count * 100 : 0,
                CreatedAt = t.CreatedAt,
                UpdatedAt = t.UpdatedAt,
                Subtasks = t.Subtasks.OrderBy(st => st.Order).Select(st => new SubtaskResponse
                {
                    Id = st.Id,
                    TaskId = st.TaskId,
                    Title = st.Title,
                    IsDone = st.IsDone,
                    Order = st.Order,
                    CreatedAt = st.CreatedAt
                }).ToList()
            };
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<TaskResponse>>> GetUserTasks()
        {
            var userId = GetUserId();
            var role = GetUserRole();

            var tasks = await _context.Tasks
                .Include(t => t.Assignee)
                .Include(t => t.Subtasks)
                .Include(t => t.Team)
                    .ThenInclude(tm => tm.Members)
                .Where(t => role == "Lecturer" || t.AssigneeId == userId || t.Team.Members.Any(m => m.UserId == userId))
                .OrderBy(t => t.Order)
                .ToListAsync();

            return Ok(tasks.Select(MapTask));
        }

        [HttpGet("team/{teamId}")]
        public async Task<ActionResult<IEnumerable<TaskResponse>>> GetTeamTasks(int teamId)
        {
            var userId = GetUserId();
            var role = GetUserRole();

            var team = await _context.Teams
                .Include(t => t.Members)
                .FirstOrDefaultAsync(t => t.Id == teamId);

            if (team == null) return NotFound(new { message = "Team not found" });
            if (!CanAccessTeam(team, userId, role)) return Forbid();

            var tasks = await _context.Tasks
                .Include(t => t.Assignee)
                .Include(t => t.Subtasks)
                .Where(t => t.TeamId == teamId)
                .OrderBy(t => t.Order)
                .ToListAsync();

            return Ok(tasks.Select(MapTask));
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<TaskResponse>> GetTask(int id)
        {
            var userId = GetUserId();
            var role = GetUserRole();

            var task = await _context.Tasks
                .Include(t => t.Assignee)
                .Include(t => t.Subtasks)
                .Include(t => t.Team)
                    .ThenInclude(tm => tm.Members)
                .FirstOrDefaultAsync(t => t.Id == id);

            if (task == null) return NotFound(new { message = "Task not found" });
            if (!CanAccessTask(task, userId, role)) return Forbid();

            return Ok(MapTask(task));
        }

        [HttpPost]
        public async Task<ActionResult<TaskResponse>> CreateTask(CreateTaskRequest request)
        {
            var userId = GetUserId();
            var role = GetUserRole();

            var team = await _context.Teams
                .Include(t => t.Members)
                .FirstOrDefaultAsync(t => t.Id == request.TeamId);

            if (team == null) return NotFound(new { message = "Team not found" });
            if (!CanAccessTeam(team, userId, role)) return Forbid();

            if (request.AssigneeId.HasValue && 
                !team.Members.Any(m => m.UserId == request.AssigneeId.Value) &&
                request.AssigneeId.Value != team.LecturerId)
            {
                return BadRequest(new { message = "Assignee must be a member of the team" });
            }

            var maxOrder = await _context.Tasks
                .Where(t => t.TeamId == request.TeamId && t.Status == "To Do")
                .MaxAsync(t => (int?)t.Order) ?? 0;

            var task = new Task
            {
                TeamId = request.TeamId,
                Title = request.Title,
                Description = request.Description,
                Status = "To Do",
                AssigneeId = request.AssigneeId,
                Order = maxOrder + 1,
                Deadline = request.Deadline ?? DateTime.UtcNow.AddDays(7),
                EstimatedHours = request.EstimatedHours,
                CreatedAt = DateTime.UtcNow
            };

            _context.Tasks.Add(task);
            await _context.SaveChangesAsync();

            var createdTask = await _context.Tasks
                .Include(t => t.Assignee)
                .Include(t => t.Subtasks)
                .FirstOrDefaultAsync(t => t.Id == task.Id);

            return CreatedAtAction(nameof(GetTask), new { id = task.Id }, MapTask(createdTask!));
        }

        // Cập nhật task
        [HttpPut("{id}")]
        public async Task<ActionResult> UpdateTask(int id, UpdateTaskRequest request)
        {
            var userId = GetUserId();
            var role = GetUserRole();

            var task = await _context.Tasks
                .Include(t => t.Team)
                    .ThenInclude(tm => tm.Members)
                .FirstOrDefaultAsync(t => t.Id == id);

            if (task == null) return NotFound(new { message = "Task not found" });
            if (role != "Lecturer" && task.AssigneeId != userId) return Forbid();

            if (request.AssigneeId.HasValue && 
                !task.Team.Members.Any(m => m.UserId == request.AssigneeId.Value) &&
                request.AssigneeId.Value != task.Team.LecturerId)
            {
                return BadRequest(new { message = "Assignee must be a member of the team" });
            }

            task.Title = request.Title;
            task.Description = request.Description;
            task.AssigneeId = request.AssigneeId;
            task.Deadline = request.Deadline ?? task.Deadline;
            task.EstimatedHours = request.EstimatedHours;
            task.ActualHours = request.ActualHours;
            task.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return NoContent();
        }

        // Cập nhật trạng thái task
        [HttpPut("{id}/status")]
        public async Task<ActionResult> UpdateTaskStatus(int id, UpdateTaskStatusRequest request)
        {
            var userId = GetUserId();
            var role = GetUserRole();

            var task = await _context.Tasks
                .Include(t => t.Team)
                    .ThenInclude(tm => tm.Members)
                .FirstOrDefaultAsync(t => t.Id == id);

            if (task == null) return NotFound(new { message = "Task not found" });
            if (role != "Lecturer" && task.AssigneeId != userId) return Forbid();

            if (task.Status == request.Status && task.Order == request.Order)
                return NoContent();

            var oldStatusTasks = await _context.Tasks
                .Where(t => t.TeamId == task.TeamId && t.Status == task.Status && t.Id != id)
                .OrderBy(t => t.Order)
                .ToListAsync();

            for (int i = 0; i < oldStatusTasks.Count; i++)
                oldStatusTasks[i].Order = i;

            var newStatusTasks = await _context.Tasks
                .Where(t => t.TeamId == task.TeamId && t.Status == request.Status && t.Id != id)
                .OrderBy(t => t.Order)
                .ToListAsync();

            var newOrder = Math.Max(0, Math.Min(request.Order, newStatusTasks.Count));
            for (int i = 0; i < newStatusTasks.Count; i++)
                newStatusTasks[i].Order = i < newOrder ? i : i + 1;

            task.Status = request.Status;
            task.Order = newOrder;
            task.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return NoContent();
        }

        // Xóa task
        [HttpDelete("{id}")]
        public async Task<ActionResult> DeleteTask(int id)
        {
            var role = GetUserRole();
            if (role != "Lecturer") return Forbid();

            var task = await _context.Tasks
                .Include(t => t.Team)
                .FirstOrDefaultAsync(t => t.Id == id);

            if (task == null) return NotFound(new { message = "Task not found" });

            _context.Tasks.Remove(task);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // --- Subtasks ---
        [HttpPost("subtasks")]
        public async Task<ActionResult<SubtaskResponse>> CreateSubtask(CreateSubtaskRequest request)
        {
            var userId = GetUserId();
            var role = GetUserRole();

            var task = await _context.Tasks
                .Include(t => t.Team)
                    .ThenInclude(tm => tm.Members)
                .FirstOrDefaultAsync(t => t.Id == request.TaskId);

            if (task == null) return NotFound(new { message = "Task not found" });
            if (role != "Lecturer" && task.AssigneeId != userId) return Forbid();

            var maxOrder = await _context.Subtasks
                .Where(st => st.TaskId == request.TaskId)
                .MaxAsync(st => (int?)st.Order) ?? 0;

            var subtask = new Subtask
            {
                TaskId = request.TaskId,
                Title = request.Title,
                Order = maxOrder + 1,
                CreatedAt = DateTime.UtcNow
            };

            _context.Subtasks.Add(subtask);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetSubtask), new { id = subtask.Id }, new SubtaskResponse
            {
                Id = subtask.Id,
                TaskId = subtask.TaskId,
                Title = subtask.Title,
                IsDone = subtask.IsDone,
                Order = subtask.Order,
                CreatedAt = subtask.CreatedAt
            });
        }

        [HttpGet("subtasks/{id}")]
        public async Task<ActionResult<SubtaskResponse>> GetSubtask(int id)
        {
            var userId = GetUserId();
            var role = GetUserRole();

            var subtask = await _context.Subtasks
                .Include(st => st.Task)
                    .ThenInclude(t => t.Team)
                        .ThenInclude(tm => tm.Members)
                .FirstOrDefaultAsync(st => st.Id == id);

            if (subtask == null) return NotFound(new { message = "Subtask not found" });
            if (!CanAccessTask(subtask.Task, userId, role)) return Forbid();

            return Ok(new SubtaskResponse
            {
                Id = subtask.Id,
                TaskId = subtask.TaskId,
                Title = subtask.Title,
                IsDone = subtask.IsDone,
                Order = subtask.Order,
                CreatedAt = subtask.CreatedAt
            });
        }

        [HttpPut("subtasks/{id}")]
        public async Task<ActionResult> UpdateSubtask(int id, UpdateSubtaskRequest request)
        {
            var userId = GetUserId();
            var role = GetUserRole();

            var subtask = await _context.Subtasks
                .Include(st => st.Task)
                    .ThenInclude(t => t.Team)
                        .ThenInclude(tm => tm.Members)
                .FirstOrDefaultAsync(st => st.Id == id);

            if (subtask == null) return NotFound(new { message = "Subtask not found" });
            if (role != "Lecturer" && subtask.Task.AssigneeId != userId) return Forbid();

            subtask.Title = request.Title;
            subtask.IsDone = request.IsDone;
            subtask.Order = request.Order;

            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpPut("subtasks/{id}/toggle")]
        public async Task<ActionResult> ToggleSubtask(int id)
        {
            var userId = GetUserId();
            var role = GetUserRole();

            var subtask = await _context.Subtasks
                .Include(st => st.Task)
                    .ThenInclude(t => t.Team)
                        .ThenInclude(tm => tm.Members)
                .FirstOrDefaultAsync(st => st.Id == id);

            if (subtask == null) return NotFound(new { message = "Subtask not found" });
            if (role != "Lecturer" && subtask.Task.AssigneeId != userId) return Forbid();

            subtask.IsDone = !subtask.IsDone;
            await _context.SaveChangesAsync();

            return Ok(new { isDone = subtask.IsDone });
        }

        [HttpDelete("subtasks/{id}")]
        public async Task<ActionResult> DeleteSubtask(int id)
        {
            var role = GetUserRole();
            if (role != "Lecturer") return Forbid();

            var subtask = await _context.Subtasks
                .Include(st => st.Task)
                    .ThenInclude(t => t.Team)
                .FirstOrDefaultAsync(st => st.Id == id);

            if (subtask == null) return NotFound(new { message = "Subtask not found" });

            _context.Subtasks.Remove(subtask);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}
