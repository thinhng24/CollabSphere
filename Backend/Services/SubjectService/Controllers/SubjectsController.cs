using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SubjectService.Data;
using SubjectService.Models;
using SubjectService.Services;

namespace SubjectService.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SubjectsController : ControllerBase
    {
        private readonly SubjectDbContext _context;
        private readonly SubjectImportService _importService;

        public SubjectsController(SubjectDbContext context, SubjectImportService importService)
        {
            _context = context;
            _importService = importService;
        }

        [HttpGet]
        public async Task<IActionResult> GetSubjects() => Ok(await _context.Subjects.ToListAsync());

        [HttpPost("import")]
        public async Task<IActionResult> ImportExcel(IFormFile file)
        {
            if (file == null || file.Length == 0) return BadRequest("File không hợp lệ");
            using var stream = file.OpenReadStream();
            var result = await _importService.ImportSubjectsFromExcel(stream);
            return Ok(new { Message = "Thành công", Count = result.Count });
        }
    }
}