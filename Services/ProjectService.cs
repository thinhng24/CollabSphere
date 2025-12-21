using ProjectService.Data;
using ProjectService.Models;
using Microsoft.EntityFrameworkCore;

namespace ProjectService.Services
{
    public class ProjectService
    {
        private readonly ProjectDbContext _context;

        public ProjectService(ProjectDbContext context)
        {
            _context = context;
        }

        public async Task<Project> CreateProjectAsync(Project project)
        {
            _context.Projects.Add(project);
            await _context.SaveChangesAsync();
            return project;
        }

        public async Task<IEnumerable<Project>> GetProjectsAsync()
        {
            return await _context.Projects.Include(p => p.Milestones).ToListAsync();
        }

        public async Task<Project> ApproveProjectAsync(int id)
        {
            var project = await _context.Projects.FindAsync(id);
            if (project != null)
            {
                project.IsApproved = true;
                await _context.SaveChangesAsync();
            }
            return project;
        }

        public async Task<Project> DenyProjectAsync(int id)
        {
            var project = await _context.Projects.FindAsync(id);
            if (project != null)
            {
                project.IsApproved = false;
                project.IsDenied = true;
                await _context.SaveChangesAsync();
            }
            return project;
        }

        public async Task<Project> SubmitProjectAsync(int id)
        {
            var project = await _context.Projects.FindAsync(id);
            if (project != null)
            {
                project.IsSubmitted = true;
                await _context.SaveChangesAsync();
            }
            return project;
        }

        public async Task<Project> UpdateProjectAsync(int id, Project updatedProject)
        {
            var project = await _context.Projects.FindAsync(id);
            if (project == null) return null;
            project.Name = updatedProject.Name;
            project.Description = updatedProject.Description;
            await _context.SaveChangesAsync();
            return project;
        }

        public async Task<Milestone> AddMilestoneAsync(int projectId, Milestone milestone)
        {
            milestone.ProjectId = projectId;
            _context.Milestones.Add(milestone);
            await _context.SaveChangesAsync();
            return milestone;
        }

        public async Task<Milestone> UpdateMilestoneAsync(int id, Milestone updatedMilestone)
        {
            var milestone = await _context.Milestones.FindAsync(id);
            if (milestone == null) return null;
            milestone.Title = updatedMilestone.Title;
            milestone.Description = updatedMilestone.Description;
            milestone.DueDate = updatedMilestone.DueDate;
            await _context.SaveChangesAsync();
            return milestone;
        }

        public async Task<bool> DeleteMilestoneAsync(int id)
        {
            var milestone = await _context.Milestones.FindAsync(id);
            if (milestone == null) return false;
            _context.Milestones.Remove(milestone);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}