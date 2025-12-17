using Amazon.Bedrock;
using Amazon.Bedrock.Model;

namespace ProjectService.Services
{
    public class AiBedrockService
    {
        private readonly IAmazonBedrock _bedrockClient;

        public AiBedrockService(IAmazonBedrock bedrockClient)
        {
            _bedrockClient = bedrockClient;
        }

        public async Task<string> GenerateProjectSuggestionAsync(string prompt)
        {
            var request = new InvokeModelRequest
            {
                ModelId = "anthropic.claude-v2",
                Body = new MemoryStream(System.Text.Encoding.UTF8.GetBytes($"{{\"prompt\": \"{prompt}\", \"max_tokens\": 200}}"))
            };
            var response = await _bedrockClient.InvokeModelAsync(request);
            // Giả định parse JSON response (thay bằng logic thực tế)
            return "AI Suggestion: Enhance collaboration by adding a review milestone."; // Thay bằng parsing thực tế
        }
    }
}