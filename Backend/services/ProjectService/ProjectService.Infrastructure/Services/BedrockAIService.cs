using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using ProjectService.Application.DTOs;
using ProjectService.Application.Interfaces;
using SharedKernel.Common;
using System.Text.Json;
using System.Text;

namespace ProjectService.Infrastructure.Services;

public class BedrockAIService : IAIService
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<BedrockAIService> _logger;
    private readonly HttpClient _httpClient;

    public BedrockAIService(
        IConfiguration configuration,
        ILogger<BedrockAIService> logger,
        HttpClient httpClient)
    {
        _configuration = configuration;
        _logger = logger;
        _httpClient = httpClient;
    }

    public async Task<Result<List<MilestoneGenerationResult>>> GenerateMilestonesAsync(
        string projectName,
        string projectDescription,
        string projectObjectives,
        string? syllabusContent,
        int numberOfMilestones)
    {
        try
        {
            _logger.LogInformation("Generating {Count} milestones for project: {Name}",
                numberOfMilestones, projectName);

            // Build prompt for AI
            var prompt = BuildPrompt(projectName, projectDescription, projectObjectives,
                syllabusContent, numberOfMilestones);

            // For demo purposes, return mock data
            // In production, this would call AWS Bedrock API
            var milestones = await GenerateMockMilestones(projectName, projectObjectives, numberOfMilestones);

            _logger.LogInformation("Successfully generated {Count} milestones", milestones.Count);
            return Result<List<MilestoneGenerationResult>>.Success(milestones);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating milestones with AI");
            return Result<List<MilestoneGenerationResult>>.Failure(
                "Failed to generate milestones with AI: " + ex.Message);
        }
    }

    private string BuildPrompt(string projectName, string projectDescription,
        string projectObjectives, string? syllabusContent, int numberOfMilestones)
    {
        var sb = new StringBuilder();
        sb.AppendLine($"Generate {numberOfMilestones} project milestones for the following project:");
        sb.AppendLine($"\nProject Name: {projectName}");
        sb.AppendLine($"\nDescription: {projectDescription}");
        sb.AppendLine($"\nObjectives: {projectObjectives}");

        if (!string.IsNullOrEmpty(syllabusContent))
        {
            sb.AppendLine($"\nSyllabus Context: {syllabusContent}");
        }

        sb.AppendLine("\nPlease generate milestones in JSON format with: title, description, order, and estimatedDurationDays.");
        sb.AppendLine("Each milestone should be specific, measurable, and aligned with the project objectives.");

        return sb.ToString();
    }

    private async Task<List<MilestoneGenerationResult>> GenerateMockMilestones(
        string projectName, string objectives, int count)
    {
        // Simulate AI processing delay
        await Task.Delay(1500);

        var milestones = new List<MilestoneGenerationResult>();
        var objectiveParts = objectives.Split(',', StringSplitOptions.RemoveEmptyEntries);

        // Generate context-aware milestones
        var templates = new[]
        {
            new { Title = "Project Setup & Environment Configuration",
                  Description = "Initialize project repository, setup development environment, install required dependencies and configure build tools.",
                  Days = 7 },
            new { Title = "Requirements Analysis & Design",
                  Description = "Gather detailed requirements, create system architecture diagrams, design database schema and define API specifications.",
                  Days = 10 },
            new { Title = "Core Feature Development - Phase 1",
                  Description = $"Implement fundamental features related to {(objectiveParts.Length > 0 ? objectiveParts[0].Trim() : "core functionality")}.",
                  Days = 14 },
            new { Title = "Core Feature Development - Phase 2",
                  Description = $"Complete implementation of {(objectiveParts.Length > 1 ? objectiveParts[1].Trim() : "advanced features")}.",
                  Days = 14 },
            new { Title = "Integration & API Development",
                  Description = "Integrate third-party services, develop REST APIs, implement authentication and authorization mechanisms.",
                  Days = 10 },
            new { Title = "Testing & Quality Assurance",
                  Description = "Write unit tests, perform integration testing, conduct code reviews, and fix identified bugs.",
                  Days = 10 },
            new { Title = "UI/UX Implementation",
                  Description = "Design and implement user interface, ensure responsive design, optimize user experience and accessibility.",
                  Days = 12 },
            new { Title = "Performance Optimization",
                  Description = "Optimize database queries, implement caching strategies, improve load times and application performance.",
                  Days = 7 },
            new { Title = "Documentation & Deployment Preparation",
                  Description = "Write technical documentation, user guides, prepare deployment scripts and configure production environment.",
                  Days = 7 },
            new { Title = "Final Testing & Production Deployment",
                  Description = "Conduct final acceptance testing, perform security audit, deploy to production and monitor system stability.",
                  Days = 7 }
        };

        for (int i = 0; i < Math.Min(count, templates.Length); i++)
        {
            milestones.Add(new MilestoneGenerationResult
            {
                Title = templates[i].Title,
                Description = templates[i].Description,
                Order = i + 1,
                EstimatedDurationDays = templates[i].Days
            });
        }

        return milestones;
    }

    /*
     * PRODUCTION IMPLEMENTATION:
     * Uncomment and configure this method to use actual AWS Bedrock API
     *
    private async Task<List<MilestoneGenerationResult>> CallBedrockAPI(string prompt)
    {
        var region = _configuration["AWS:Region"];
        var accessKey = _configuration["AWS:AccessKey"];
        var secretKey = _configuration["AWS:SecretKey"];

        // Use AWS SDK to call Bedrock
        var bedrockClient = new AmazonBedrockRuntimeClient(accessKey, secretKey,
            Amazon.RegionEndpoint.GetBySystemName(region));

        var request = new InvokeModelRequest
        {
            ModelId = "anthropic.claude-v2",
            ContentType = "application/json",
            Body = new MemoryStream(Encoding.UTF8.GetBytes(JsonSerializer.Serialize(new
            {
                prompt = prompt,
                max_tokens_to_sample = 2000,
                temperature = 0.7
            })))
        };

        var response = await bedrockClient.InvokeModelAsync(request);
        var responseBody = await new StreamReader(response.Body).ReadToEndAsync();

        // Parse and return milestones
        return ParseBedrockResponse(responseBody);
    }
    */
}
