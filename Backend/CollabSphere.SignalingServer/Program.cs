using System.Text.Json;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Caching.Distributed;
using System.Diagnostics;

var builder = WebApplication.CreateBuilder(args);

builder.Logging.ClearProviders();
builder.Logging.AddConsole();
builder.Logging.AddDebug();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReact", policy =>
    {
        policy
            .WithOrigins("http://localhost:3000")
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

builder.Services.AddSignalR();
builder.Services.AddSingleton<ConnectionManager>();
builder.Services.AddSingleton<StatsTracker>(); // Thêm service để theo dõi thống kê
builder.Services.AddStackExchangeRedisCache(options =>
{
    options.Configuration = builder.Configuration["Redis:ConnectionString"] ?? "localhost:6379";
});

// Thêm memory cache cho stats nhanh
builder.Services.AddMemoryCache();

var app = builder.Build();

app.UseCors("AllowReact");
app.UseRouting();

app.MapHub<WebRTCHub>("/webrtc-hub");

// Thêm endpoint gốc với giao diện dashboard
app.MapGet("/", async (HttpContext context) =>
{
    var serverStartTime = DateTime.Now.ToString("HH:mm:ss");
    var serverDateTime = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss");
    
    var html = $$"""
        <!DOCTYPE html>
        <html lang='en'>
        <head>
            <meta charset='UTF-8'>
            <meta name='viewport' content='width=device-width, initial-scale=1.0'>
            <title>CollabSphere - Signaling Server Dashboard</title>
            <link href='https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css' rel='stylesheet'>
            <link rel='stylesheet' href='https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'>
            <style>
                body {
                    background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
                    color: #fff;
                    min-height: 100vh;
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                }
                .dashboard-container {
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 20px;
                }
                .header {
                    text-align: center;
                    margin-bottom: 40px;
                    padding: 30px;
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 20px;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                }
                .status-card {
                    background: rgba(255, 255, 255, 0.08);
                    border-radius: 15px;
                    padding: 25px;
                    margin-bottom: 25px;
                    border: 1px solid rgba(255, 255, 255, 0.15);
                    transition: transform 0.3s, background 0.3s;
                }
                .status-card:hover {
                    transform: translateY(-5px);
                    background: rgba(255, 255, 255, 0.12);
                }
                .status-badge {
                    display: inline-block;
                    padding: 8px 20px;
                    border-radius: 20px;
                    font-weight: 600;
                    font-size: 0.9rem;
                }
                .status-running {
                    background: linear-gradient(45deg, #00b09b, #96c93d);
                    color: white;
                }
                .status-healthy {
                    background: linear-gradient(45deg, #4776E6, #8E54E9);
                    color: white;
                }
                .stat-number {
                    font-size: 3rem;
                    font-weight: bold;
                    background: linear-gradient(45deg, #4facfe, #00f2fe);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    margin: 15px 0;
                }
                .stat-label {
                    color: #94a3b8;
                    font-size: 0.9rem;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                }
                .info-box {
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 10px;
                    padding: 15px;
                    margin: 10px 0;
                    border-left: 4px solid #3b82f6;
                }
                .btn-gradient {
                    background: linear-gradient(45deg, #667eea, #764ba2);
                    border: none;
                    color: white;
                    padding: 12px 25px;
                    border-radius: 10px;
                    font-weight: 600;
                    transition: all 0.3s;
                }
                .btn-gradient:hover {
                    transform: translateY(-3px);
                    box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
                }
                .connection-log {
                    max-height: 300px;
                    overflow-y: auto;
                    background: rgba(0, 0, 0, 0.3);
                    border-radius: 10px;
                    padding: 15px;
                }
                .log-entry {
                    padding: 8px 12px;
                    margin: 5px 0;
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 5px;
                    border-left: 3px solid #10b981;
                    font-family: 'Courier New', monospace;
                    font-size: 0.85rem;
                }
                .service-status {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 12px 15px;
                    margin: 8px 0;
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 8px;
                }
                .endpoint-list {
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 10px;
                    padding: 15px;
                }
                .endpoint-item {
                    padding: 10px;
                    margin: 5px 0;
                    background: rgba(255, 255, 255, 0.03);
                    border-radius: 5px;
                    font-family: monospace;
                    border-left: 3px solid #8b5cf6;
                }
            </style>
        </head>
        <body>
            <div class='dashboard-container'>
                <!-- Header -->
                <div class='header'>
                    <h1><i class='fas fa-broadcast-tower me-2'></i>CollabSphere Signaling Server</h1>
                    <p class='text-muted mb-4'>Real-time WebRTC Signaling Hub for Collaborative Applications</p>
                    <div class='d-flex justify-content-center gap-3'>
                        <span class='status-badge status-running'>
                            <i class='fas fa-circle me-2'></i>ACTIVE
                        </span>
                        <span class='status-badge status-healthy'>
                            <i class='fas fa-plug me-2'></i>PORT 5001
                        </span>
                        <span class='status-badge status-healthy'>
                            <i class='fas fa-signal me-2'></i>SIGNALR HUB
                        </span>
                    </div>
                </div>

                <!-- Stats Row -->
                <div class='row'>
                    <div class='col-md-3'>
                        <div class='status-card text-center'>
                            <i class='fas fa-users fa-3x mb-3' style='color: #3b82f6;'></i>
                            <div class='stat-number' id='activeConnections'>0</div>
                            <div class='stat-label'>Active Connections</div>
                        </div>
                    </div>
                    <div class='col-md-3'>
                        <div class='status-card text-center'>
                            <i class='fas fa-video fa-3x mb-3' style='color: #10b981;'></i>
                            <div class='stat-number' id='activeMeetings'>0</div>
                            <div class='stat-label'>Active Meetings</div>
                        </div>
                    </div>
                    <div class='col-md-3'>
                        <div class='status-card text-center'>
                            <i class='fas fa-bolt fa-3x mb-3' style='color: #f59e0b;'></i>
                            <div class='stat-number' id='messagesSec'>0</div>
                            <div class='stat-label'>Messages/Sec</div>
                        </div>
                    </div>
                    <div class='col-md-3'>
                        <div class='status-card text-center'>
                            <i class='fas fa-memory fa-3x mb-3' style='color: #8b5cf6;'></i>
                            <div class='stat-number' id='memoryUsage'>0MB</div>
                            <div class='stat-label'>Memory Usage</div>
                        </div>
                    </div>
                </div>

                <!-- Main Content -->
                <div class='row mt-4'>
                    <!-- Left Column -->
                    <div class='col-md-8'>
                        <!-- Services Status -->
                        <div class='status-card'>
                            <h4><i class='fas fa-server me-2'></i>Services Status</h4>
                            <div class='mt-3'>
                                <div class='service-status'>
                                    <div>
                                        <i class='fas fa-signal me-2 text-success'></i>
                                        <span>SignalR Hub</span>
                                    </div>
                                    <span class='status-badge status-running'>Running</span>
                                </div>
                                <div class='service-status'>
                                    <div>
                                        <i class='fas fa-database me-2 text-info'></i>
                                        <span>Connection Manager</span>
                                    </div>
                                    <span class='status-badge status-running'>Healthy</span>
                                </div>
                                <div class='service-status'>
                                    <div>
                                        <i class='fas fa-exchange-alt me-2 text-warning'></i>
                                        <span>WebSocket Gateway</span>
                                    </div>
                                    <span class='status-badge status-running'>Active</span>
                                </div>
                                <div class='service-status'>
                                    <div>
                                        <i class='fas fa-chart-line me-2 text-danger'></i>
                                        <span>Stats Tracker</span>
                                    </div>
                                    <span class='status-badge status-running'>Monitoring</span>
                                </div>
                            </div>
                        </div>

                        <!-- Connection Logs -->
                        <div class='status-card'>
                            <h4><i class='fas fa-history me-2'></i>Recent Activity</h4>
                            <div class='connection-log mt-3' id='connectionLogs'>
                                <div class='log-entry'>
                                    <i class='fas fa-info-circle me-2'></i>
                                    Server started at {{serverStartTime}}
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Right Column -->
                    <div class='col-md-4'>
                        <!-- Quick Actions -->
                        <div class='status-card'>
                            <h4><i class='fas fa-rocket me-2'></i>Quick Actions</h4>
                            <div class='mt-3 d-grid gap-2'>
                                <button onclick='testSignalRConnection()' class='btn btn-gradient'>
                                    <i class='fas fa-play me-2'></i>Test SignalR Connection
                                </button>
                                <button onclick='refreshRealStats()' class='btn btn-outline-light'>
                                    <i class='fas fa-sync-alt me-2'></i>Refresh Stats
                                </button>
                                <a href='/api/stats' target='_blank' class='btn btn-outline-info'>
                                    <i class='fas fa-code me-2'></i>View Stats API
                                </a>
                                <button onclick='clearLogs()' class='btn btn-outline-warning'>
                                    <i class='fas fa-trash me-2'></i>Clear Logs
                                </button>
                            </div>
                        </div>

                        <!-- Endpoints -->
                        <div class='status-card'>
                            <h4><i class='fas fa-code me-2'></i>API Endpoints</h4>
                            <div class='endpoint-list mt-3'>
                                <div class='endpoint-item'>
                                    <small class='text-success'>GET</small>
                                    <div>/webrtc-hub</div>
                                    <small class='text-muted'>SignalR Hub endpoint</small>
                                </div>
                                <div class='endpoint-item'>
                                    <small class='text-primary'>GET</small>
                                    <div>/api/stats</div>
                                    <small class='text-muted'>Real-time statistics</small>
                                </div>
                                <div class='endpoint-item'>
                                    <small class='text-info'>GET</small>
                                    <div>/health</div>
                                    <small class='text-muted'>Health check</small>
                                </div>
                            </div>
                        </div>

                        <!-- System Info -->
                        <div class='status-card'>
                            <h4><i class='fas fa-info-circle me-2'></i>System Information</h4>
                            <div class='mt-3'>
                                <div class='info-box'>
                                    <small class='text-muted'>Server Time</small>
                                    <div id='serverTime'>{{serverDateTime}}</div>
                                </div>
                                <div class='info-box'>
                                    <small class='text-muted'>Uptime</small>
                                    <div id='uptime'>0 seconds</div>
                                </div>
                                <div class='info-box'>
                                    <small class='text-muted'>Environment</small>
                                    <div>Development</div>
                                </div>
                                <div class='info-box'>
                                    <small class='text-muted'>Version</small>
                                    <div>1.0.0</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Footer -->
                <div class='text-center mt-5 pt-4 border-top border-secondary'>
                    <p class='text-muted'>
                        <i class='fas fa-code me-1'></i> CollabSphere Signaling Server v1.0.0
                        <span class='mx-2'>•</span>
                        <i class='fas fa-heart text-danger me-1'></i> Powered by ASP.NET Core & SignalR
                        <span class='mx-2'>•</span>
                        <i class='fas fa-clock me-1'></i> <span id='refreshTime'>Last updated: Just now</span>
                    </p>
                </div>
            </div>

            <!-- Scripts -->
            <script src='https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js'></script>
            <script src='https://cdnjs.cloudflare.com/ajax/libs/microsoft-signalr/6.0.1/signalr.min.js'></script>
            <script>
                // Initialize variables
                let startTime = Date.now();
                let signalRConnection = null;

                // Update server time
                function updateServerTime() {
                    const now = new Date();
                    document.getElementById('serverTime').textContent = 
                        now.toISOString().replace('T', ' ').substring(0, 19);
                    
                    // Update uptime
                    const uptimeSeconds = Math.floor((Date.now() - startTime) / 1000);
                    const hours = Math.floor(uptimeSeconds / 3600);
                    const minutes = Math.floor((uptimeSeconds % 3600) / 60);
                    const seconds = uptimeSeconds % 60;
                    document.getElementById('uptime').textContent = 
                        `${hours}h ${minutes}m ${seconds}s`;
                }

                // Update stats từ server thực tế
                async function updateRealStats() {
                    try {
                        const response = await fetch('/api/stats');
                        if (response.ok) {
                            const data = await response.json();
                            
                            document.getElementById('activeConnections').textContent = data.activeConnections;
                            document.getElementById('activeMeetings').textContent = data.activeMeetings;
                            document.getElementById('messagesSec').textContent = data.messagesPerSecond.toFixed(1);
                            document.getElementById('memoryUsage').textContent = data.memoryUsage.toFixed(0) + 'MB';
                            
                            document.getElementById('refreshTime').textContent = 
                                'Last updated: ' + new Date().toLocaleTimeString();
                            
                            // Log activity nếu có thay đổi
                            if (data.lastActivity) {
                                addLog(data.lastActivity);
                            }
                        }
                    } catch (error) {
                        console.error('Failed to fetch stats:', error);
                        addLog('Error fetching stats: ' + error.message);
                    }
                }

                // Function để refresh thủ công
                async function refreshRealStats() {
                    addLog('Manual refresh requested...');
                    await updateRealStats();
                    showAlert('success', 'Stats refreshed successfully');
                }

                // Test SignalR connection
                async function testSignalRConnection() {
                    addLog('Testing SignalR connection...');
                    
                    try {
                        const response = await fetch('/webrtc-hub/negotiate?negotiateVersion=1');
                        if (response.ok) {
                            const data = await response.json();
                            addLog('✓ SignalR connection successful! Connection ID: ' + data.connectionId.substring(0, 20) + '...');
                            showAlert('success', 'SignalR connection successful!');
                        } else {
                            addLog('✗ SignalR connection failed');
                            showAlert('danger', 'SignalR connection failed');
                        }
                    } catch (error) {
                        addLog('✗ Connection error: ' + error.message);
                        showAlert('danger', 'Connection error: ' + error.message);
                    }
                }

                // Check health
                async function checkHealth() {
                    addLog('Checking server health...');
                    try {
                        const response = await fetch('/health');
                        if (response.ok) {
                            const data = await response.json();
                            addLog('✓ Health check passed - Status: ' + data.status);
                            showAlert('success', 'Server is healthy! Uptime: ' + data.uptime + 's');
                        } else {
                            addLog('✗ Health check failed');
                            showAlert('warning', 'Health check failed');
                        }
                    } catch (error) {
                        addLog('✗ Health check error: ' + error.message);
                        showAlert('danger', 'Health check error');
                    }
                }

                // Add log entry
                function addLog(message) {
                    const logs = document.getElementById('connectionLogs');
                    const logEntry = document.createElement('div');
                    logEntry.className = 'log-entry';
                    logEntry.innerHTML = `
                        <i class='fas fa-info-circle me-2'></i>
                        ${message}
                        <small class='float-end text-muted'>${new Date().toLocaleTimeString()}</small>
                    `;
                    logs.prepend(logEntry);
                    
                    // Limit logs to 20 entries
                    if (logs.children.length > 20) {
                        logs.removeChild(logs.lastChild);
                    }
                }

                // Clear logs
                function clearLogs() {
                    const logs = document.getElementById('connectionLogs');
                    logs.innerHTML = `
                        <div class='log-entry'>
                            <i class='fas fa-info-circle me-2'></i>
                            Logs cleared at ${new Date().toLocaleTimeString()}
                        </div>
                    `;
                    addLog('Logs cleared');
                }

                // Show alert
                function showAlert(type, message) {
                    // Create alert element
                    const alertDiv = document.createElement('div');
                    alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
                    alertDiv.style.cssText = 'top: 20px; right: 20px; z-index: 1000; min-width: 300px;';
                    alertDiv.innerHTML = `
                        ${message}
                        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                    `;
                    
                    document.body.appendChild(alertDiv);
                    
                    // Auto remove after 5 seconds
                    setTimeout(() => {
                        if (alertDiv.parentNode) {
                            alertDiv.remove();
                        }
                    }, 5000);
                }

                // Initialize SignalR connection để nhận real-time updates
                async function initializeSignalR() {
                    try {
                        signalRConnection = new signalR.HubConnectionBuilder()
                            .withUrl("/webrtc-hub")
                            .withAutomaticReconnect()
                            .build();

                        // Listen for stats updates
                        signalRConnection.on("StatsUpdated", (stats) => {
                            addLog(`Real-time update: ${stats.message}`);
                            updateRealStats();
                        });

                        await signalRConnection.start();
                        addLog('SignalR connected for real-time updates');
                    } catch (err) {
                        console.error('SignalR Connection Error: ', err);
                        addLog('SignalR connection failed: ' + err.message);
                    }
                }

                // Initialize
                updateServerTime();
                updateRealStats(); // Lấy dữ liệu thực ngay từ đầu
                initializeSignalR();
                
                // Auto-update
                setInterval(updateServerTime, 1000);
                setInterval(updateRealStats, 3000); // Cập nhật mỗi 3 giây
                
                // Add initial logs
                setTimeout(() => addLog('Dashboard initialized successfully'), 500);
                setTimeout(() => addLog('Fetching real-time statistics...'), 1000);
            </script>
        </body>
        </html>
    """;
    
    context.Response.ContentType = "text/html";
    await context.Response.WriteAsync(html);
});

// Health check endpoint
app.MapGet("/health", () =>
{
    return Results.Json(new
    {
        status = "Healthy",
        service = "CollabSphere Signaling Server",
        version = "1.0.0",
        timestamp = DateTime.UtcNow,
        uptime = Environment.TickCount / 1000,
        environment = app.Environment.EnvironmentName,
        hubEndpoint = "/webrtc-hub"
    });
});

// API endpoint để lấy server stats thực tế
app.MapGet("/api/stats", (ConnectionManager connectionManager, StatsTracker statsTracker) =>
{
    return Results.Json(new
    {
        activeConnections = connectionManager.GetActiveConnectionsCount(),
        activeMeetings = connectionManager.GetActiveMeetingsCount(),
        messagesPerSecond = statsTracker.GetMessagesPerSecond(),
        totalMessages = statsTracker.TotalMessages,
        memoryUsage = Process.GetCurrentProcess().WorkingSet64 / 1024 / 1024, // MB
        serverTime = DateTime.UtcNow,
        lastActivity = statsTracker.GetLastActivity(),
        meetingDetails = connectionManager.GetMeetingParticipantsCount(),
        cpuTime = Process.GetCurrentProcess().TotalProcessorTime.TotalSeconds
    });
});

// API để reset stats (cho testing)
app.MapPost("/api/stats/reset", (StatsTracker statsTracker) =>
{
    statsTracker.Reset();
    return Results.Ok("Statistics reset successfully");
});
// Endpoint để tạo test data
app.MapPost("/api/test/simulate", async (ConnectionManager connectionManager, StatsTracker statsTracker) =>
{
    // Simulate some activity
    var testMeetingId = $"test-meeting-{Guid.NewGuid().ToString()[..8]}";
    var testUserId = $"user-{Guid.NewGuid().ToString()[..8]}";
    
    // Simulate connections
    for (int i = 0; i < 5; i++)
    {
        var connId = $"test-conn-{i}";
        connectionManager.AddConnection(testMeetingId, $"{testUserId}-{i}", connId);
        statsTracker.IncrementMessages();
        statsTracker.RecordActivity($"Test connection {i} added");
    }
    
    return Results.Json(new
    {
        message = "Test data created",
        meetingId = testMeetingId,
        connections = 5
    });
});

// Endpoint để gửi test messages
app.MapPost("/api/test/messages", (StatsTracker statsTracker) =>
{
    var random = new Random();
    var count = random.Next(10, 50);
    
    for (int i = 0; i < count; i++)
    {
        statsTracker.IncrementMessages();
    }
    
    statsTracker.RecordActivity($"Added {count} test messages");
    
    return Results.Json(new
    {
        message = $"Added {count} test messages",
        totalMessages = statsTracker.TotalMessages
    });
});

app.Run();

public class WebRTCHub : Hub
{
    private readonly ConnectionManager _connectionManager;
    private readonly ILogger<WebRTCHub> _logger;
    private readonly StatsTracker _statsTracker;

    public WebRTCHub(ConnectionManager connectionManager, ILogger<WebRTCHub> logger, StatsTracker statsTracker)
    {
        _connectionManager = connectionManager;
        _logger = logger;
        _statsTracker = statsTracker;
    }

    public async Task JoinMeeting(string meetingId, string userId, string userName)
    {
        _statsTracker.IncrementMessages(); // Theo dõi message
        
        await Groups.AddToGroupAsync(Context.ConnectionId, meetingId);
        _connectionManager.AddConnection(meetingId, userId, Context.ConnectionId);
        
        await Clients.Group(meetingId).SendAsync("UserJoined", new
        {
            UserId = userId,
            UserName = userName,
            ConnectionId = Context.ConnectionId
        });
        
        // Gửi thông báo real-time về dashboard
        await Clients.All.SendAsync("StatsUpdated", new { 
            message = $"User {userName} joined meeting {meetingId}" 
        });
        
        _logger.LogInformation($"User {userName} joined meeting {meetingId}");
    }

    public async Task LeaveMeeting(string meetingId, string userId)
    {
        _statsTracker.IncrementMessages();
        
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, meetingId);
        _connectionManager.RemoveConnection(meetingId, userId);
        
        await Clients.Group(meetingId).SendAsync("UserLeft", new
        {
            UserId = userId
        });
        
        await Clients.All.SendAsync("StatsUpdated", new { 
            message = $"User {userId} left meeting {meetingId}" 
        });
    }

    public async Task SendOffer(string meetingId, string targetUserId, object offer)
    {
        _statsTracker.IncrementMessages();
        
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
        _statsTracker.IncrementMessages();
        
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
        _statsTracker.IncrementMessages();
        
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

    public override async Task OnConnectedAsync()
    {
        _statsTracker.IncrementMessages();
        _statsTracker.RecordActivity("New connection established");
        
        await base.OnConnectedAsync();
        await Clients.All.SendAsync("StatsUpdated", new { 
            message = $"New connection: {Context.ConnectionId}" 
        });
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        _statsTracker.IncrementMessages();
        _statsTracker.RecordActivity("Connection disconnected");
        
        var connections = _connectionManager.GetConnectionsByConnectionId(Context.ConnectionId);
        foreach (var connection in connections)
        {
            await Clients.Group(connection.MeetingId).SendAsync("UserLeft", new
            {
                UserId = connection.UserId
            });
        }
        
        _connectionManager.RemoveConnection(Context.ConnectionId);
        
        await Clients.All.SendAsync("StatsUpdated", new { 
            message = $"Connection disconnected: {Context.ConnectionId}" 
        });
        
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

    // Thêm các phương thức để lấy thống kê thực tế
    public int GetActiveConnectionsCount()
    {
        lock (_userConnections)
        {
            return _userConnections.Count;
        }
    }

    public int GetActiveMeetingsCount()
    {
        lock (_meetingConnections)
        {
            return _meetingConnections.Count;
        }
    }

    public Dictionary<string, int> GetMeetingParticipantsCount()
    {
        lock (_meetingConnections)
        {
            return _meetingConnections.ToDictionary(
                kvp => kvp.Key,
                kvp => kvp.Value.Count
            );
        }
    }
}

public class MeetingConnection
{
    public string MeetingId { get; set; } = string.Empty;
    public string UserId { get; set; } = string.Empty;
}

// Class mới để theo dõi thống kê thực tế
public class StatsTracker
{
    private long _totalMessages = 0;
    private DateTime _startTime = DateTime.UtcNow;
    private readonly List<string> _recentActivities = new();
    private readonly object _lock = new object();

    public long TotalMessages => _totalMessages;

    public void IncrementMessages()
    {
        Interlocked.Increment(ref _totalMessages);
    }

    public double GetMessagesPerSecond()
    {
        var elapsedSeconds = (DateTime.UtcNow - _startTime).TotalSeconds;
        if (elapsedSeconds < 1) return 0;
        
        lock (_lock)
        {
            return _totalMessages / elapsedSeconds;
        }
    }

    public void RecordActivity(string activity)
    {
        lock (_lock)
        {
            _recentActivities.Add($"{DateTime.UtcNow:HH:mm:ss} - {activity}");
            // Giữ tối đa 50 activities gần nhất
            if (_recentActivities.Count > 50)
            {
                _recentActivities.RemoveAt(0);
            }
        }
    }

    public string GetLastActivity()
    {
        lock (_lock)
        {
            return _recentActivities.LastOrDefault() ?? "No recent activity";
        }
    }

    public void Reset()
    {
        lock (_lock)
        {
            _totalMessages = 0;
            _startTime = DateTime.UtcNow;
            _recentActivities.Clear();
        }
    }
}   