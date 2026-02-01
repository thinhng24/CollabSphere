using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SyllabusService.Data;
using SyllabusService.Models;

namespace SyllabusService.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class SyllabusController : ControllerBase
    {
        private readonly SyllabusDbContext _context;

        public SyllabusController(SyllabusDbContext context)
        {
            _context = context;
        }

        // GET: api/syllabus
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Syllabus>>> GetAll()
        {
            return await _context.Syllabuses.ToListAsync();
        }

        // GET: api/syllabus/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Syllabus>> GetById(int id)
        {
            var syllabus = await _context.Syllabuses.FindAsync(id);

            if (syllabus == null)
                return NotFound();

            return syllabus;
        }

        // POST: api/syllabus
        [HttpPost]
        public async Task<ActionResult<Syllabus>> Create(Syllabus syllabus)
        {
            _context.Syllabuses.Add(syllabus);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetById), new { id = syllabus.Id }, syllabus);
        }

        // PUT: api/syllabus/5
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, Syllabus syllabus)
        {
            if (id != syllabus.Id)
                return BadRequest();

            _context.Entry(syllabus).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!_context.Syllabuses.Any(e => e.Id == id))
                    return NotFound();
                else
                    throw;
            }

            return NoContent();
        }

        // DELETE: api/syllabus/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var syllabus = await _context.Syllabuses.FindAsync(id);
            if (syllabus == null)
                return NotFound();

            _context.Syllabuses.Remove(syllabus);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}
