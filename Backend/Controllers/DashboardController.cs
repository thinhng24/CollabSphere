using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace ProjectManagementApp.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TestController : ControllerBase
    {
        [HttpGet]
        public IActionResult Get()
        {
            return Ok(new 
            { 
                message = "API is working!",
                timestamp = DateTime.UtcNow,
                endpoints = new[] {
                    "/api/auth/login",
                    "/api/auth/register",
                    "/api/teams",
                    "/api/checkpoints",
                    "/api/tasks",
                    "/api/dashboard"
                }
            });
        }

        [HttpGet("auth")]
        [Authorize]
        public IActionResult GetAuth()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var userName = User.FindFirst(ClaimTypes.Name)?.Value;
            var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
            
            return Ok(new 
            { 
                message = "Authenticated!",
                userId,
                userName,
                userRole,
                timestamp = DateTime.UtcNow 
            });
        }

        [HttpGet("lecturer")]
        [Authorize(Roles = "Lecturer")]
        public IActionResult GetLecturer()
        {
            return Ok(new { message = "Lecturer access granted!" });
        }

        [HttpGet("student")]
        [Authorize(Roles = "Student")]
        public IActionResult GetStudent()
        {
            return Ok(new { message = "Student access granted!" });
        }
    }
}