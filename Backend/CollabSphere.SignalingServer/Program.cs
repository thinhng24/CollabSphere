using System.Text.Json;
using Microsoft.AspNetCore.SignalR;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

builder.Services.AddSignalR();
builder.Services.AddSingleton<ConnectionManager>();
builder.Services.AddStackExchangeRedisCache(options =>
{
    options.Configuration = builder.Configuration["Redis:ConnectionString"];
});

var app = builder.Build();

app.UseCors("AllowAll");
app.UseRouting();

app.MapHub<WebRTCHub>("/webrtc-hub");

app.Run();

public class WebRTCHub : Hub
{
    private readonly ConnectionManager _connectionManager;
    private readonly ILogger<WebRTCHub> _logger;

    public WebRTCHub(ConnectionManager connectionManager, ILogger<WebRTCHub> logger)
    {
        _connectionManager = connectionManager;
        _logger = logger;
    }

    public async Task JoinMeeting(string meetingId, string userId, string userName)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, meetingId);
        _connectionManager.AddConnection(meetingId, userId, Context.ConnectionId);
        
        await Clients.Group(meetingId).SendAsync("UserJoined", new
        {
            UserId = userId,
            UserName = userName,
            ConnectionId = Context.ConnectionId
        });
        
        _logger.LogInformation($"User {userName} joined meeting {meetingId}");
    }

    public async Task LeaveMeeting(string meetingId, string userId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, meetingId);
        _connectionManager.RemoveConnection(meetingId, userId);
        
        await Clients.Group(meetingId).SendAsync("UserLeft", new
        {
            UserId = userId
        });
    }

    public async Task SendOffer(string meetingId, string targetUserId, object offer)
    {
        var targetConnection = _connectionManager.GetConnectionId(meetingId, targetUserId);
        if (targetConnection != null)
        {
            await Clients.Client(targetConnection).SendAsync("ReceiveOffer", new
            {
                FromUserId = Context.ConnectionId,
                Offer = offer
            });
        }
    }

    public async Task SendAnswer(string meetingId, string targetUserId, object answer)
    {
        var targetConnection = _connectionManager.GetConnectionId(meetingId, targetUserId);
        if (targetConnection != null)
        {
            await Clients.Client(targetConnection).SendAsync("ReceiveAnswer", new
            {
                FromUserId = Context.ConnectionId,
                Answer = answer
            });
        }
    }

    public async Task SendIceCandidate(string meetingId, string targetUserId, object candidate)
    {
        var targetConnection = _connectionManager.GetConnectionId(meetingId, targetUserId);
        if (targetConnection != null)
        {
            await Clients.Client(targetConnection).SendAsync("ReceiveIceCandidate", new
            {
                FromUserId = Context.ConnectionId,
                Candidate = candidate
            });
        }
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var connections = _connectionManager.GetConnectionsByConnectionId(Context.ConnectionId);
        foreach (var connection in connections)
        {
            await Clients.Group(connection.MeetingId).SendAsync("UserLeft", new
            {
                UserId = connection.UserId
            });
        }
        
        _connectionManager.RemoveConnection(Context.ConnectionId);
        await base.OnDisconnectedAsync(exception);
    }
}

public class ConnectionManager
{
    private readonly Dictionary<string, Dictionary<string, string>> _meetingConnections = new();
    private readonly Dictionary<string, List<MeetingConnection>> _userConnections = new();

    public void AddConnection(string meetingId, string userId, string connectionId)
    {
        lock (_meetingConnections)
        {
            if (!_meetingConnections.ContainsKey(meetingId))
            {
                _meetingConnections[meetingId] = new Dictionary<string, string>();
            }
            _meetingConnections[meetingId][userId] = connectionId;
        }

        lock (_userConnections)
        {
            if (!_userConnections.ContainsKey(connectionId))
            {
                _userConnections[connectionId] = new List<MeetingConnection>();
            }
            _userConnections[connectionId].Add(new MeetingConnection
            {
                MeetingId = meetingId,
                UserId = userId
            });
        }
    }

    public string? GetConnectionId(string meetingId, string userId)
    {
        lock (_meetingConnections)
        {
            if (_meetingConnections.TryGetValue(meetingId, out var connections))
            {
                return connections.GetValueOrDefault(userId);
            }
        }
        return null;
    }

    public List<MeetingConnection> GetConnectionsByConnectionId(string connectionId)
    {
        lock (_userConnections)
        {
            return _userConnections.GetValueOrDefault(connectionId, new List<MeetingConnection>());
        }
    }

    public void RemoveConnection(string meetingId, string userId)
    {
        lock (_meetingConnections)
        {
            if (_meetingConnections.TryGetValue(meetingId, out var connections))
            {
                connections.Remove(userId);
                if (connections.Count == 0)
                {
                    _meetingConnections.Remove(meetingId);
                }
            }
        }
    }

    public void RemoveConnection(string connectionId)
    {
        lock (_userConnections)
        {
            _userConnections.Remove(connectionId);
        }
    }
}

public class MeetingConnection
{
    public string MeetingId { get; set; } = string.Empty;
    public string UserId { get; set; } = string.Empty;
}