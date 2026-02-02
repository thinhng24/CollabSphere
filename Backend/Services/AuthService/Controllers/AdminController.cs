using AuthService.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AuthService.Controllers
{
    [ApiController]
    [Route("api/admin")]
    [Authorize(Roles = "Admin")]
    public class AdminController : ControllerBase
    {
        private readonly AuthDbContext _context;

        public AdminController(AuthDbContext context)
        {
            _context = context;
        }

        // 1. View all users
        [HttpGet("users")]
        public async Task<IActionResult> GetAllUsers()
        {
            var users = await _context.Users
                .Select(u => new
                {
                    u.Id,
                    u.Username,
                    u.Email,
                    u.Role,
                    u.IsActive,
                    u.CreatedAt
                })
                .ToListAsync();

            return Ok(users);
        }

        [HttpGet("reports")]
        public async Task<IActionResult> GetAllReports()
        {
            var reports = await _context.Reports
                .OrderByDescending(r => r.CreatedAt)
                .ToListAsync();

            return Ok(reports);
        }

        // 2. Deactivate user
        [HttpPut("deactivate-all-users")]
        public async Task<IActionResult> DeactivateAllUsers()
        {
            var users = await _context.Users
                .Where(u => u.Role.ToLower() != "admin")
                .ToListAsync();

            foreach (var u in users)
            {
                u.IsActive = false;
            }

            await _context.SaveChangesAsync();

            return Ok(new { message = "All non-admin users have been deactivated" });
        }

        // 3. Activate user
        [HttpPut("users/activate-all")]
        public async Task<IActionResult> ActivateAll()
        {
            var users = await _context.Users
                .Where(u => u.Role != "admin")
                .ToListAsync();

            if (!users.Any())
                return Ok("No users to activate");

            foreach (var user in users)
            {
                user.IsActive = true;
            }

            await _context.SaveChangesAsync();

            return Ok("All non-admin users activated");
        }


        // 🔥 DASHBOARD
        [HttpGet("dashboard")]
        public async Task<IActionResult> Dashboard()
        {
            var totalUsers = await _context.Users.CountAsync();
            var activeUsers = await _context.Users.CountAsync(u => u.IsActive);
            var inactiveUsers = totalUsers - activeUsers;

            var students = await _context.Users.CountAsync(u => u.Role == "Student");
            var lecturers = await _context.Users.CountAsync(u => u.Role == "Lecturer");
            var staffs = await _context.Users.CountAsync(u => u.Role == "Staff");
            var heads = await _context.Users.CountAsync(u => u.Role == "HeadDepartment");

            return Ok(new
            {
                totalUsers,
                activeUsers,
                inactiveUsers,
                students,
                lecturers,
                staffs,
                heads
            });
        }
    }
}
