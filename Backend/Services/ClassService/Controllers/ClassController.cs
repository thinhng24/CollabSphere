using ClassService.Data;
using ClassService.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ClassService.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ClassController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ClassController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var classes = await _context.Classes.ToListAsync();
            return Ok(classes);
        }

        [HttpPost]
        public async Task<IActionResult> Create(Class model)
        {
            _context.Classes.Add(model);
            await _context.SaveChangesAsync();
            return Ok(model);
        }
    }
}
