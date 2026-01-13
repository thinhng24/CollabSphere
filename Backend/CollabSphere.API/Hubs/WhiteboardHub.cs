using Microsoft.AspNetCore.SignalR;
using System.Text.Json;
using System.Collections.Concurrent;

namespace CollabSphere.API.Hubs
{
    public class WhiteboardHub : Hub
    {
        private static readonly ConcurrentDictionary<string, WhiteboardState> _whiteboards = new();
        private readonly ILogger<WhiteboardHub> _logger;

        public WhiteboardHub(ILogger<WhiteboardHub> logger)
        {
            _logger = logger;
        }

        public async Task JoinWhiteboard(string whiteboardId, string userId)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, whiteboardId);
            
            if (!_whiteboards.ContainsKey(whiteboardId))
            {
                _whiteboards[whiteboardId] = new WhiteboardState();
            }
            
            // Send current whiteboard state to new user
            var state = _whiteboards[whiteboardId];
            await Clients.Caller.SendAsync("WhiteboardState", new
            {
                Elements = state.Elements.Values.ToList(),
                Background = state.Background,
                LastModified = state.LastModified
            });
            
            await Clients.Group(whiteboardId).SendAsync("UserJoinedWhiteboard", new
            {
                UserId = userId,
                ConnectionId = Context.ConnectionId
            });
            
            _logger.LogInformation($"User {userId} joined whiteboard {whiteboardId}");
        }

        public async Task AddElement(string whiteboardId, WhiteboardElement element)
        {
            element.Id = Guid.NewGuid().ToString();
            element.Timestamp = DateTime.UtcNow;
            
            if (_whiteboards.TryGetValue(whiteboardId, out var state))
            {
                state.Elements[element.Id] = element;
                state.LastModified = DateTime.UtcNow;
                
                await Clients.Group(whiteboardId).SendAsync("ElementAdded", element);
                _logger.LogDebug($"Element added to whiteboard {whiteboardId}: {element.Type}");
            }
        }

        public async Task UpdateElement(string whiteboardId, WhiteboardElement element)
        {
            if (_whiteboards.TryGetValue(whiteboardId, out var state))
            {
                if (state.Elements.ContainsKey(element.Id))
                {
                    element.Timestamp = DateTime.UtcNow;
                    state.Elements[element.Id] = element;
                    state.LastModified = DateTime.UtcNow;
                    
                    await Clients.OthersInGroup(whiteboardId).SendAsync("ElementUpdated", element);
                }
            }
        }

        public async Task DeleteElement(string whiteboardId, string elementId)
        {
            if (_whiteboards.TryGetValue(whiteboardId, out var state))
            {
                if (state.Elements.Remove(elementId))
                {
                    state.LastModified = DateTime.UtcNow;
                    await Clients.Group(whiteboardId).SendAsync("ElementDeleted", elementId);
                }
            }
        }

        public async Task ClearWhiteboard(string whiteboardId)
        {
            if (_whiteboards.TryGetValue(whiteboardId, out var state))
            {
                state.Elements.Clear();
                state.LastModified = DateTime.UtcNow;
                await Clients.Group(whiteboardId).SendAsync("WhiteboardCleared");
            }
        }

        public async Task ChangeBackground(string whiteboardId, string backgroundColor)
        {
            if (_whiteboards.TryGetValue(whiteboardId, out var state))
            {
                state.Background = backgroundColor;
                state.LastModified = DateTime.UtcNow;
                await Clients.Group(whiteboardId).SendAsync("BackgroundChanged", backgroundColor);
            }
        }

        public async Task LeaveWhiteboard(string whiteboardId)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, whiteboardId);
            await Clients.Group(whiteboardId).SendAsync("UserLeftWhiteboard", Context.ConnectionId);
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            _logger.LogInformation($"Client disconnected: {Context.ConnectionId}");
            await base.OnDisconnectedAsync(exception);
        }
    }

    public class WhiteboardState
    {
        public Dictionary<string, WhiteboardElement> Elements { get; set; } = new();
        public string Background { get; set; } = "#ffffff";
        public DateTime LastModified { get; set; } = DateTime.UtcNow;
    }

    public class WhiteboardElement
    {
        public string Id { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty; // "line", "rectangle", "circle", "text", "image"
        public List<Point> Points { get; set; } = new();
        public string Color { get; set; } = "#000000";
        public int StrokeWidth { get; set; } = 2;
        public string Fill { get; set; } = "transparent";
        public string Text { get; set; } = string.Empty;
        public string FontSize { get; set; } = "16px";
        public string ImageUrl { get; set; } = string.Empty;
        public DateTime Timestamp { get; set; }
        public string CreatedBy { get; set; } = string.Empty;
    }

    public class Point
    {
        public double X { get; set; }
        public double Y { get; set; }
    }
}