using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CollabSphere.API.Data;
using CollabSphere.API.Models;

namespace CollabSphere.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
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
            var classes = await _context.Classes
                .Include(c => c.Subject)
                .ToListAsync();

            return Ok(classes);
        }

        [HttpPost]
        public async Task<IActionResult> Create(Class model)
        {
            _context.Classes.Add(model);
            await _context.SaveChangesAsync();
            return Ok(model);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var cls = await _context.Classes.FindAsync(id);
            if (cls == null) return NotFound();

            _context.Classes.Remove(cls);
            await _context.SaveChangesAsync();
            return Ok();
        }
    }
}
