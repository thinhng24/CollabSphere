using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi.Models; 
using CollabSphere.API.Data;

var builder = WebApplication.CreateBuilder(args);


builder.WebHost.UseUrls("http://localhost:5001");

// Add services
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();


builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "CollabSphere API",
        Version = "v1.0.0",
        Description = "API for CollabSphere - Real-time Collaboration Platform",
        Contact = new OpenApiContact
        {
            Name = "CollabSphere Team",
            Email = "support@collabsphere.edu.vn",
            Url = new Uri("https://collabsphere.edu.vn")
        },
        License = new OpenApiLicense
        {
            Name = "MIT License",
            Url = new Uri("https://opensource.org/licenses/MIT")
        }
    });
    
    
    var xmlFile = $"{System.Reflection.Assembly.GetExecutingAssembly().GetName().Name}.xml";
    var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFile);
    if (File.Exists(xmlPath))
    {
        c.IncludeXmlComments(xmlPath);
    }
    
    
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Enter 'Bearer' [space] and then your token in the text input below.",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });
    
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

var app = builder.Build();

// Cấu hình pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "CollabSphere API v1");
        c.RoutePrefix = "api-docs"; 
        c.DocumentTitle = "CollabSphere API Documentation";
        c.DefaultModelsExpandDepth(-1); // Ẩn schema mặc định
        c.DisplayRequestDuration(); // Hiển thị thời gian request
        c.EnableDeepLinking(); // Cho phép deep linking
        c.EnableTryItOutByDefault(); // Mở try it out mặc định
    });
}

app.UseStaticFiles();

app.UseCors(builder => builder
    .WithOrigins(
        "http://localhost:3000",
        "https://localhost:3000",
        "http://localhost:3001",
        "http://localhost:5001"  
    )
    .AllowAnyMethod()
    .AllowAnyHeader()
    .AllowCredentials());

app.UseRouting();

// Thêm endpoint riêng để test Swagger
app.MapGet("/api-docs/test", () => "Swagger test endpoint - API docs should be available at /api-docs");

// Endpoint gốc với giao diện Dashboard
app.MapGet("/", async (HttpContext context) =>
{
    var html = $$"""
        <!DOCTYPE html>
        <html lang='en'>
        <head>
            <meta charset='UTF-8'>
            <meta name='viewport' content='width=device-width, initial-scale=1.0'>
            <title>CollabSphere - Backend Dashboard</title>
            <link href='https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css' rel='stylesheet'>
            <link href='https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css' rel='stylesheet'>
            <style>
                :root {
                    --primary-color: #4361ee;
                    --secondary-color: #3a0ca3;
                    --success-color: #4cc9f0;
                    --dark-color: #1a1a2e;
                }
                body {
                    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
                    color: #fff;
                    min-height: 100vh;
                }
                .dashboard-card {
                    background: rgba(255, 255, 255, 0.1);
                    backdrop-filter: blur(10px);
                    border-radius: 15px;
                    padding: 25px;
                    margin-bottom: 25px;
                    transition: transform 0.3s;
                    border: 1px solid rgba(255, 255, 255, 0.2);
                }
                .dashboard-card:hover {
                    transform: translateY(-5px);
                    background: rgba(255, 255, 255, 0.15);
                }
                .stat-card {
                    text-align: center;
                    padding: 20px;
                }
                .stat-icon {
                    font-size: 2.5rem;
                    margin-bottom: 15px;
                    opacity: 0.8;
                }
                .stat-number {
                    font-size: 2.5rem;
                    font-weight: bold;
                    margin: 10px 0;
                }
                .stat-label {
                    font-size: 0.9rem;
                    opacity: 0.7;
                }
                .nav-tabs .nav-link {
                    color: rgba(255, 255, 255, 0.7);
                    border: none;
                }
                .nav-tabs .nav-link.active {
                    background: transparent;
                    color: var(--success-color);
                    border-bottom: 2px solid var(--success-color);
                }
                .api-endpoint {
                    background: rgba(0, 0, 0, 0.3);
                    padding: 10px 15px;
                    border-radius: 8px;
                    margin: 10px 0;
                    border-left: 4px solid var(--primary-color);
                }
                .btn-custom {
                    background: linear-gradient(45deg, var(--primary-color), var(--secondary-color));
                    border: none;
                    color: white;
                    padding: 10px 25px;
                    border-radius: 8px;
                    font-weight: 500;
                    transition: all 0.3s;
                }
                .btn-custom:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 5px 15px rgba(67, 97, 238, 0.4);
                }
                .status-badge {
                    padding: 5px 15px;
                    border-radius: 20px;
                    font-size: 0.8rem;
                    font-weight: 600;
                }
                .status-running {
                    background: rgba(76, 201, 240, 0.2);
                    color: #4cc9f0;
                }
                .status-healthy {
                    background: rgba(0, 255, 128, 0.2);
                    color: #00ff80;
                }
                .server-monitor {
                    height: 200px;
                    background: rgba(0, 0, 0, 0.2);
                    border-radius: 10px;
                    padding: 15px;
                }
                .log-entry {
                    padding: 8px 12px;
                    margin: 5px 0;
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 5px;
                    border-left: 3px solid var(--success-color);
                }
            </style>
        </head>
        <body>
            <div class='container-fluid py-4'>
                <!-- Header -->
                <div class='row mb-4'>
                    <div class='col-12'>
                        <div class='d-flex justify-content-between align-items-center'>
                            <div>
                                <h1><i class='fas fa-video me-2'></i> CollabSphere Backend</h1>
                                <p class='text-muted'>Real-time Collaboration Platform Dashboard</p>
                            </div>
                            <div class='d-flex gap-3 align-items-center'>
                                <span class='status-badge status-running'>
                                    <i class='fas fa-circle me-2'></i>RUNNING ON PORT 5001
                                </span>
                                <div class='dropdown'>
                                    <button class='btn btn-custom dropdown-toggle' type='button' data-bs-toggle='dropdown'>
                                        <i class='fas fa-cog me-2'></i>Settings
                                    </button>
                                    <ul class='dropdown-menu dropdown-menu-dark'>
                                        <li><a class='dropdown-item' href='http://localhost:5001/api-docs' target='_blank'><i class='fas fa-book me-2'></i>API Documentation</a></li>
                                        <li><a class='dropdown-item' href='http://localhost:5001/health'><i class='fas fa-heartbeat me-2'></i>Health Check</a></li>
                                        <li><a class='dropdown-item' href='http://localhost:5001/api-docs/test'><i class='fas fa-vial me-2'></i>Test Swagger</a></li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Stats Row -->
                <div class='row mb-4'>
                    <div class='col-md-3'>
                        <div class='dashboard-card stat-card'>
                            <div class='stat-icon text-primary'>
                                <i class='fas fa-users'></i>
                            </div>
                            <div class='stat-number' id='activeUsers'>0</div>
                            <div class='stat-label'>Active Users</div>
                        </div>
                    </div>
                    <div class='col-md-3'>
                        <div class='dashboard-card stat-card'>
                            <div class='stat-icon text-success'>
                                <i class='fas fa-video'></i>
                            </div>
                            <div class='stat-number' id='activeMeetings'>0</div>
                            <div class='stat-label'>Active Meetings</div>
                        </div>
                    </div>
                    <div class='col-md-3'>
                        <div class='dashboard-card stat-card'>
                            <div class='stat-icon text-warning'>
                                <i class='fas fa-database'></i>
                            </div>
                            <div class='stat-number' id='apiCalls'>0</div>
                            <div class='stat-label'>API Calls Today</div>
                        </div>
                    </div>
                    <div class='col-md-3'>
                        <div class='dashboard-card stat-card'>
                            <div class='stat-icon text-info'>
                                <i class='fas fa-signal'></i>
                            </div>
                            <div class='stat-number' id='responseTime'>0ms</div>
                            <div class='stat-label'>Avg Response Time</div>
                        </div>
                    </div>
                </div>

                <!-- Main Content -->
                <div class='row'>
                    <!-- Left Column -->
                    <div class='col-md-8'>
                        <div class='dashboard-card'>
                            <h4><i class='fas fa-tachometer-alt me-2'></i>System Monitor</h4>
                            <div class='server-monitor mt-3'>
                                <canvas id='systemChart'></canvas>
                            </div>
                        </div>

                        <div class='dashboard-card'>
                            <h4><i class='fas fa-history me-2'></i>Recent Activity</h4>
                            <div id='activityLogs' class='mt-3'>
                                <div class='log-entry'>
                                    <i class='fas fa-server me-2'></i>System started on port 5001 at {{DateTime.Now.ToString("HH:mm:ss")}}
                                </div>
                                <div class='log-entry'>
                                    <i class='fas fa-book me-2'></i>API Documentation available at <a href='http://localhost:5001/api-docs' target='_blank' class='text-success'>/api-docs</a>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Right Column -->
                    <div class='col-md-4'>
                        <div class='dashboard-card'>
                            <h4><i class='fas fa-plug me-2'></i>Services Status</h4>
                            <div class='mt-3'>
                                <div class='d-flex justify-content-between align-items-center mb-3'>
                                    <span>Main API Server</span>
                                    <span class='status-badge status-healthy'>Port 5001</span>
                                </div>
                                <div class='d-flex justify-content-between align-items-center mb-3'>
                                    <span>Swagger UI</span>
                                    <span id='swaggerStatus' class='status-badge'>Checking...</span>
                                </div>
                                <div class='d-flex justify-content-between align-items-center mb-3'>
                                    <span>API Health</span>
                                    <span id='apiHealthStatus' class='status-badge'>Checking...</span>
                                </div>
                            </div>
                        </div>

                        <div class='dashboard-card'>
                            <h4><i class='fas fa-code me-2'></i>API Endpoints</h4>
                            <div class='mt-3'>
                                <div class='api-endpoint'>
                                    <small>GET</small>
                                    <div><a href='http://localhost:5001/api-docs' class='text-white text-decoration-none'>/api-docs</a></div>
                                    <small class='text-muted'>Interactive API documentation</small>
                                </div>
                                <div class='api-endpoint'>
                                    <small>GET</small>
                                    <div><a href='http://localhost:5001/swagger/v1/swagger.json' class='text-white text-decoration-none'>/swagger/v1/swagger.json</a></div>
                                    <small class='text-muted'>OpenAPI specification</small>
                                </div>
                                <div class='api-endpoint'>
                                    <small>GET</small>
                                    <div><a href='http://localhost:5001/health' class='text-white text-decoration-none'>/health</a></div>
                                    <small class='text-muted'>System health check</small>
                                </div>
                                <div class='api-endpoint'>
                                    <small>GET</small>
                                    <div><a href='http://localhost:5001/api/Meeting' class='text-white text-decoration-none'>/api/Meeting</a></div>
                                    <small class='text-muted'>Get all meetings</small>
                                </div>
                            </div>
                        </div>

                        <div class='dashboard-card'>
                            <h4><i class='fas fa-rocket me-2'></i>Quick Actions</h4>
                            <div class='mt-3 d-grid gap-2'>
                                <a href='http://localhost:5001/api-docs' target='_blank' class='btn btn-custom'>
                                    <i class='fas fa-book me-2'></i>Open API Docs
                                </a>
                                <button onclick='testSwagger()' class='btn btn-outline-success'>
                                    <i class='fas fa-vial me-2'></i>Test Swagger
                                </button>
                                <button onclick='checkAPIHealth()' class='btn btn-outline-info'>
                                    <i class='fas fa-heartbeat me-2'></i>Check API Health
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Footer -->
                <div class='row mt-4'>
                    <div class='col-12 text-center text-muted'>
                        <p>CollabSphere Backend v1.0.0 | © 2024 | Running on localhost:5001 | <i class='fas fa-heart text-danger'></i> Powered by ASP.NET Core</p>
                    </div>
                </div>
            </div>

            <script src='https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js'></script>
            <script src='https://cdn.jsdelivr.net/npm/chart.js'></script>
            <script>
                // Initialize Chart
                const ctx = document.getElementById('systemChart').getContext('2d');
                const systemChart = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: ['1m', '2m', '3m', '4m', '5m', '6m'],
                        datasets: [{
                            label: 'CPU Usage',
                            data: [12, 19, 15, 25, 22, 30],
                            borderColor: '#4361ee',
                            backgroundColor: 'rgba(67, 97, 238, 0.1)',
                            tension: 0.4
                        }, {
                            label: 'Memory Usage',
                            data: [20, 25, 22, 30, 28, 35],
                            borderColor: '#4cc9f0',
                            backgroundColor: 'rgba(76, 201, 240, 0.1)',
                            tension: 0.4
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                labels: {
                                    color: '#fff'
                                }
                            }
                        },
                        scales: {
                            y: {
                                beginAtZero: true,
                                grid: {
                                    color: 'rgba(255, 255, 255, 0.1)'
                                },
                                ticks: {
                                    color: '#fff'
                                }
                            },
                            x: {
                                grid: {
                                    color: 'rgba(255, 255, 255, 0.1)'
                                },
                                ticks: {
                                    color: '#fff'
                                }
                            }
                        }
                    }
                });

                // Kiểm tra Swagger status
                async function checkSwaggerStatus() {
                    try {
                        const response = await fetch('/swagger/v1/swagger.json');
                        if (response.ok) {
                            document.getElementById('swaggerStatus').textContent = 'Available';
                            document.getElementById('swaggerStatus').className = 'status-badge status-healthy';
                            return true;
                        }
                    } catch (error) {
                        console.error('Swagger check failed:', error);
                    }
                    
                    document.getElementById('swaggerStatus').textContent = 'Not Available';
                    document.getElementById('swaggerStatus').className = 'status-badge status-running';
                    return false;
                }

                // Kiểm tra API health
                async function checkAPIHealth() {
                    try {
                        const response = await fetch('/health');
                        if (response.ok) {
                            const data = await response.json();
                            document.getElementById('apiHealthStatus').textContent = data.status;
                            document.getElementById('apiHealthStatus').className = 'status-badge status-healthy';
                            addLog('API health check: ' + data.status);
                            return true;
                        }
                    } catch (error) {
                        console.error('Health check failed:', error);
                    }
                    
                    document.getElementById('apiHealthStatus').textContent = 'Unhealthy';
                    document.getElementById('apiHealthStatus').className = 'status-badge status-running';
                    addLog('API health check failed');
                    return false;
                }

                // Test Swagger
                async function testSwagger() {
                    addLog('Testing Swagger documentation...');
                    const swaggerOk = await checkSwaggerStatus();
                    const healthOk = await checkAPIHealth();
                    
                    if (swaggerOk && healthOk) {
                        addLog('✅ Swagger documentation is working correctly');
                        alert('Swagger is working correctly! You can access it at http://localhost:5001/api-docs');
                    } else {
                        addLog('❌ Swagger documentation test failed');
                        alert('There might be an issue with Swagger. Check the console for details.');
                    }
                }

                // Update stats - using relative URLs
                async function updateStats() {
                    try {
                        const response = await fetch('/api/Meeting');
                        if (response.ok) {
                            const meetings = await response.json();
                            document.getElementById('activeMeetings').textContent = meetings.length;
                            document.getElementById('activeUsers').textContent = meetings.reduce((acc, m) => acc + (m.participantCount || 0), 0);
                            document.getElementById('apiCalls').textContent = Math.floor(Math.random() * 100) + 50;
                            document.getElementById('responseTime').textContent = (Math.random() * 50 + 20).toFixed(0) + 'ms';
                        }
                    } catch (error) {
                        console.error('Error updating stats:', error);
                    }
                }

                // Add log entry
                function addLog(message) {
                    const logs = document.getElementById('activityLogs');
                    const logEntry = document.createElement('div');
                    logEntry.className = 'log-entry';
                    logEntry.innerHTML = `<i class='fas fa-info-circle me-2'></i>${message} <small class='text-muted float-end'>${new Date().toLocaleTimeString()}</small>`;
                    logs.prepend(logEntry);
                }

                // Initialize
                checkSwaggerStatus();
                checkAPIHealth();
                updateStats();
                
                // Auto-update every 30 seconds
                setInterval(updateStats, 30000);
                setInterval(checkSwaggerStatus, 60000);

                // Simulate random activity
                setInterval(() => {
                    if (Math.random() > 0.7) {
                        const activities = [
                            'New user joined meeting',
                            'Meeting created',
                            'API request processed',
                            'Database query executed'
                        ];
                        addLog(activities[Math.floor(Math.random() * activities.length)]);
                    }
                }, 10000);
            </script>
        </body>
        </html>
    """;
    
    context.Response.ContentType = "text/html";
    await context.Response.WriteAsync(html);
});

// Health check endpoint - enhanced with Swagger info
app.MapGet("/health", () =>
{
    return Results.Json(new
    {
        status = "Healthy",
        service = "CollabSphere Backend",
        version = "1.0.0",
        timestamp = DateTime.UtcNow,
        uptime = Environment.TickCount / 1000,
        environment = app.Environment.EnvironmentName,
        url = "http://localhost:5001",
        apiDocumentation = "http://localhost:5001/api-docs",
        openApiSpec = "http://localhost:5001/swagger/v1/swagger.json"
    });
});

// API endpoints
app.MapControllers();

app.Run();