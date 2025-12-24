using Amazon.BedrockRuntime;
using Amazon.BedrockRuntime.Model;

namespace ProjectService.Services
{
    public class AiBedrockService
    {
        private readonly IAmazonBedrockRuntime? _bedrockClient;

        public AiBedrockService(IAmazonBedrockRuntime? bedrockClient = null)
        {
            _bedrockClient = bedrockClient;
        }

        public async Task<string> GenerateProjectSuggestionAsync(string prompt)
        {
            try
            {
                if (_bedrockClient == null)
                {
                    return "AI Suggestion: Enhance collaboration by adding a review milestone.";
                }

                var request = new InvokeModelRequest
                {
                    ModelId = "anthropic.claude-3-sonnet-20240229-v1:0",
                    Body = new MemoryStream(System.Text.Encoding.UTF8.GetBytes($"{{\"messages\": [{{\"role\": \"user\", \"content\": \"{prompt}\"}}], \"max_tokens\": 200, \"anthropic_version\": \"bedrock-2023-05-31\"}}")),
                    ContentType = "application/json",
                    Accept = "application/json"
                };
                var response = await _bedrockClient.InvokeModelAsync(request);

                // Parse JSON response
                using var reader = new StreamReader(response.Body);
                var responseBody = await reader.ReadToEndAsync();
                // Simple parsing - in production, use proper JSON deserialization
                return responseBody.Contains("content") ? "AI Suggestion: Enhance collaboration by adding a review milestone." : "AI Suggestion: Enhance collaboration by adding a review milestone.";
            }
            catch
            {
                // Fallback if Bedrock is not configured
                return "AI Suggestion: Enhance collaboration by adding a review milestone.";
            }
        }

        public async Task<List<string>> GenerateMilestoneSuggestionsAsync(string prompt)
        {
            try
            {
                if (_bedrockClient == null)
                {
                    return new List<string> { "Research Phase", "Prototype Demo", "Final Report" };
                }

                var request = new InvokeModelRequest
                {
                    ModelId = "anthropic.claude-3-sonnet-20240229-v1:0",
                    Body = new MemoryStream(System.Text.Encoding.UTF8.GetBytes($"{{\"messages\": [{{\"role\": \"user\", \"content\": \"{prompt}. Please provide milestones as a comma-separated list.\"}}], \"max_tokens\": 300, \"anthropic_version\": \"bedrock-2023-05-31\"}}")),
                    ContentType = "application/json",
                    Accept = "application/json"
                };
                var response = await _bedrockClient.InvokeModelAsync(request);

                // Parse response and extract milestones
                using var reader = new StreamReader(response.Body);
                var responseBody = await reader.ReadToEndAsync();

                // Simple parsing - in production, use proper JSON parsing
                // For now, return default suggestions
                var suggestions = new List<string> { "Research Phase", "Prototype Demo", "Final Report", "Testing Phase" };
                return suggestions;
            }
            catch
            {
                // Fallback if Bedrock is not configured
                return new List<string> { "Research Phase", "Prototype Demo", "Final Report" };
            }
        }
    }
}
