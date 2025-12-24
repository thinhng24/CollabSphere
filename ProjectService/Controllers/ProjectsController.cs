using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ProjectService.Models;
using ProjectService.Services;
using ProjectServiceService = ProjectService.Services.ProjectService;
using AiBedrockServiceType = ProjectService.Services.AiBedrockService;

namespace ProjectService.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ProjectsController : ControllerBase
    {
        private readonly Services.ProjectService _projectService;
        private readonly Services.AiBedrockService _aiService;

        public ProjectsController(Services.ProjectService projectService, Services.AiBedrockService aiService)
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
            return updated is not null ? Ok(updated) : NotFound();
        }

        [HttpPut("{id}/approve")]
        public async Task<IActionResult> ApproveProject(int id)
        {
            var project = await _projectService.ApproveProjectAsync(id);
            return project is not null ? Ok(project) : NotFound();
        }

        [HttpPut("{id}/deny")]
        public async Task<IActionResult> DenyProject(int id)
        {
            var project = await _projectService.DenyProjectAsync(id);
            return project is not null ? Ok(project) : NotFound();
        }

        [HttpPut("{id}/submit")]
        public async Task<IActionResult> SubmitProject(int id)
        {
            var project = await _projectService.SubmitProjectAsync(id);
            return project is not null ? Ok(project) : NotFound();
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

        [HttpDelete("milestones/{id}")]
        public async Task<IActionResult> DeleteMilestone(int id)
        {
            var deleted = await _projectService.DeleteMilestoneAsync(id);
            return deleted ? Ok() : NotFound();
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

        [HttpPost("ai-suggest-milestones")]
        public async Task<IActionResult> SuggestMilestones([FromBody] SyllabusRequest request)
        {
            var prompt = $"Given this syllabus, suggest a list of project milestones: {request.Syllabus}";
            var suggestions = await _aiService.GenerateMilestoneSuggestionsAsync(prompt);
            return Ok(new { Milestones = suggestions });
        }
    }
}