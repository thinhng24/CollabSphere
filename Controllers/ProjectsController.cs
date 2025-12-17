using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ProjectService.Models;
using ProjectService.Services;

namespace ProjectService.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ProjectsController : ControllerBase
    {
        private readonly ProjectService _projectService;
        private readonly AiBedrockService _aiService;

        public ProjectsController(ProjectService projectService, AiBedrockService aiService)
        {
            _projectService = projectService;
            _aiService = aiService;
        }

        [HttpPost]
        public async Task<IActionResult> CreateProject([FromBody] Project project)
        {
            var created = await _projectService.CreateProjectAsync(project);
            return CreatedAtAction(nameof(GetProject), new { id = created.Id }, created);
        }

        [HttpGet]
        public async Task<IActionResult> GetProjects()
        {
            var projects = await _projectService.GetProjectsAsync();
            return Ok(projects);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetProject(int id)
        {
            var projects = await _projectService.GetProjectsAsync();
            var project = projects.FirstOrDefault(p => p.Id == id);
            return project != null ? Ok(project) : NotFound();
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateProject(int id, [FromBody] Project project)
        {
            var updated = await _projectService.UpdateProjectAsync(id, project);
            return updated != null ? Ok(updated) : NotFound();
        }

        [HttpPut("{id}/approve")]
        public async Task<IActionResult> ApproveProject(int id)
        {
            var project = await _projectService.ApproveProjectAsync(id);
            return project != null ? Ok(project) : NotFound();
        }

        [HttpPost("{id}/milestones")]
        public async Task<IActionResult> AddMilestone(int id, [FromBody] Milestone milestone)
        {
            var added = await _projectService.AddMilestoneAsync(id, milestone);
            return Ok(added);
        }

        [HttpPut("milestones/{id}")]
        public async Task<IActionResult> UpdateMilestone(int id, [FromBody] Milestone milestone)
        {
            var updated = await _projectService.UpdateMilestoneAsync(id, milestone);
            return updated != null ? Ok(updated) : NotFound();
        }

        [HttpGet("{id}/ai-analyze")]
        public async Task<IActionResult> AnalyzeProjectWithAi(int id)
        {
            var projects = await _projectService.GetProjectsAsync();
            var project = projects.FirstOrDefault(p => p.Id == id);
            if (project == null) return NotFound();
            var prompt = $"Analyze this project: {project.Description}. Milestones: {string.Join(", ", project.Milestones.Select(m => $"{m.Title} (Due: {m.DueDate}, Completed: {m.IsCompleted})"))}. Suggest improvements or new milestones.";
            var analysis = await _aiService.GenerateProjectSuggestionAsync(prompt);
            return Ok(new { Analysis = analysis });
        }
    }
}