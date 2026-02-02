using CollabSphere.File.API.Services;
using Microsoft.AspNetCore.Mvc;

namespace CollabSphere.File.API.Controllers
{
    [ApiController]
    [Route("api/excel")]
    public class ExcelController : ControllerBase
    {
        private readonly SubjectImportService _service;

        public ExcelController(SubjectImportService service)
        {
            _service = service;
        }

        [HttpPost("subjects")]
        public IActionResult ImportSubjects(IFormFile file)
        {
            using var stream = file.OpenReadStream();
            var result = _service.ImportSubjectsFromExcel(stream);
            return Ok(result);
        }
    }
}
