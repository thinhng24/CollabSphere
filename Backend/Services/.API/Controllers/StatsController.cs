using Microsoft.AspNetCore.Mvc;
using System.Diagnostics;

namespace CollabSphere.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class StatsController : ControllerBase
    {
        private static readonly Random _random = new Random();
        private static readonly List<string> _activities = new List<string>();
        private static int _apiCallCount = 0;

        [HttpGet("dashboard")]
        public IActionResult GetDashboardStats()
        {
            _apiCallCount++;
            
            var stats = new
            {
                ActiveUsers = _random.Next(50, 200),
                ActiveMeetings = _random.Next(5, 30),
                ApiCallsToday = _apiCallCount,
                AvgResponseTime = _random.Next(10, 100),
                CpuUsage = _random.Next(10, 40),
                MemoryUsage = _random.Next(30, 80),
                ServerTime = DateTime.Now,
                Uptime = Environment.TickCount / 1000
            };

            return Ok(stats);
        }

        [HttpGet("activities")]
        public IActionResult GetRecentActivities()
        {
            var activities = new[]
            {
                new { Time = DateTime.Now.AddMinutes(-5), Message = "User 'john_doe' joined meeting 'Team Sync'", Type = "join" },
                new { Time = DateTime.Now.AddMinutes(-10), Message = "Meeting 'Project Review' created", Type = "create" },
                new { Time = DateTime.Now.AddMinutes(-15), Message = "API endpoint /api/meetings called", Type = "api" },
                new { Time = DateTime.Now.AddMinutes(-20), Message = "Database backup completed", Type = "system" },
                new { Time = DateTime.Now.AddMinutes(-25), Message = "System health check passed", Type = "health" }
            };

            return Ok(activities);
        }

        [HttpGet("services")]
        public IActionResult GetServicesStatus()
        {
            var services = new[]
            {
                new { Name = "Main API Server", Status = "Healthy", LastCheck = DateTime.Now.AddSeconds(-30) },
                new { Name = "Signaling Server", Status = "Healthy", LastCheck = DateTime.Now.AddSeconds(-45) },
                new { Name = "Database", Status = "Connected", LastCheck = DateTime.Now.AddMinutes(-1) },
                new { Name = "Redis Cache", Status = "Connected", LastCheck = DateTime.Now.AddSeconds(-20) },
                new { Name = "File Storage", Status = "Healthy", LastCheck = DateTime.Now.AddMinutes(-2) }
            };

            return Ok(services);
        }

        [HttpPost("log")]
        public IActionResult AddActivityLog([FromBody] string message)
        {
            if (!string.IsNullOrEmpty(message))
            {
                _activities.Add($"{DateTime.Now:HH:mm:ss} - {message}");
                if (_activities.Count > 100)
                {
                    _activities.RemoveAt(0);
                }
            }

            return Ok(new { success = true });
        }

        [HttpGet("logs")]
        public IActionResult GetActivityLogs([FromQuery] int limit = 20)
        {
            return Ok(_activities.TakeLast(limit).Reverse());
        }
    }
}