# ==================== CommHub Startup Script for Windows ====================
# This script helps manage the CommHub Docker environment on Windows
# Usage: .\start.ps1 [command]
#
# Commands:
#   dev       - Start development environment
#   prod      - Start production environment
#   stop      - Stop all services
#   restart   - Restart all services
#   logs      - View logs
#   clean     - Clean up containers and volumes
#   status    - Show service status
#   help      - Show this help message

param(
    [Parameter(Position=0)]
    [ValidateSet("dev", "prod", "stop", "restart", "logs", "clean", "status", "build", "help", "")]
    [string]$Command = "help"
)

# Colors for output
$Colors = @{
    Info = "Cyan"
    Success = "Green"
    Warning = "Yellow"
    Error = "Red"
}

function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    Write-Host $Message -ForegroundColor $Color
}

function Write-Banner {
    Write-ColorOutput ""
    Write-ColorOutput "╔══════════════════════════════════════════════════════════╗" $Colors.Info
    Write-ColorOutput "║              CommHub - Communication Platform            ║" $Colors.Info
    Write-ColorOutput "║                   Docker Management Script               ║" $Colors.Info
    Write-ColorOutput "╚══════════════════════════════════════════════════════════╝" $Colors.Info
    Write-ColorOutput ""
}

function Show-Help {
    Write-Banner
    Write-ColorOutput "Available Commands:" $Colors.Info
    Write-ColorOutput ""
    Write-ColorOutput "  dev       " -NoNewline; Write-Host "Start development environment with hot reload"
    Write-ColorOutput "  prod      " -NoNewline; Write-Host "Start production environment"
    Write-ColorOutput "  build     " -NoNewline; Write-Host "Build all Docker images"
    Write-ColorOutput "  stop      " -NoNewline; Write-Host "Stop all services"
    Write-ColorOutput "  restart   " -NoNewline; Write-Host "Restart all services"
    Write-ColorOutput "  logs      " -NoNewline; Write-Host "View logs from all services"
    Write-ColorOutput "  status    " -NoNewline; Write-Host "Show status of all containers"
    Write-ColorOutput "  clean     " -NoNewline; Write-Host "Clean up containers, networks, and volumes"
    Write-ColorOutput "  help      " -NoNewline; Write-Host "Show this help message"
    Write-ColorOutput ""
    Write-ColorOutput "Examples:" $Colors.Info
    Write-ColorOutput "  .\start.ps1 dev       # Start development environment"
    Write-ColorOutput "  .\start.ps1 prod      # Start production environment"
    Write-ColorOutput "  .\start.ps1 logs      # View real-time logs"
    Write-ColorOutput ""
}

function Test-DockerRunning {
    try {
        $null = docker info 2>&1
        return $true
    }
    catch {
        return $false
    }
}

function Start-Development {
    Write-ColorOutput "Starting development environment..." $Colors.Info
    Write-ColorOutput ""

    # Check if docker is running
    if (-not (Test-DockerRunning)) {
        Write-ColorOutput "Error: Docker is not running. Please start Docker Desktop first." $Colors.Error
        return
    }

    # Navigate to project root
    $scriptPath = Split-Path -Parent $MyInvocation.ScriptName
    $projectRoot = Split-Path -Parent $scriptPath
    Set-Location $projectRoot

    Write-ColorOutput "Building and starting services..." $Colors.Info
    docker-compose -f docker-compose.dev.yml up --build
}

function Start-Production {
    Write-ColorOutput "Starting production environment..." $Colors.Info
    Write-ColorOutput ""

    if (-not (Test-DockerRunning)) {
        Write-ColorOutput "Error: Docker is not running. Please start Docker Desktop first." $Colors.Error
        return
    }

    $scriptPath = Split-Path -Parent $MyInvocation.ScriptName
    $projectRoot = Split-Path -Parent $scriptPath
    Set-Location $projectRoot

    Write-ColorOutput "Building images..." $Colors.Info
    docker-compose build

    Write-ColorOutput "Starting services..." $Colors.Info
    docker-compose up -d

    Write-ColorOutput ""
    Write-ColorOutput "Services started successfully!" $Colors.Success
    Write-ColorOutput ""
    Write-ColorOutput "Access the application:" $Colors.Info
    Write-ColorOutput "  Frontend:   http://localhost:3000"
    Write-ColorOutput "  Backend:    http://localhost:5000"
    Write-ColorOutput "  Swagger:    http://localhost:5000/swagger"
    Write-ColorOutput "  RabbitMQ:   http://localhost:15672 (guest/guest)"
    Write-ColorOutput ""
    Write-ColorOutput "Use '.\start.ps1 logs' to view logs"
    Write-ColorOutput "Use '.\start.ps1 stop' to stop services"
    Write-ColorOutput ""
}

function Stop-Services {
    Write-ColorOutput "Stopping all services..." $Colors.Info

    $scriptPath = Split-Path -Parent $MyInvocation.ScriptName
    $projectRoot = Split-Path -Parent $scriptPath
    Set-Location $projectRoot

    docker-compose down
    docker-compose -f docker-compose.dev.yml down 2>$null

    Write-ColorOutput "All services stopped." $Colors.Success
}

function Restart-Services {
    Write-ColorOutput "Restarting services..." $Colors.Info

    $scriptPath = Split-Path -Parent $MyInvocation.ScriptName
    $projectRoot = Split-Path -Parent $scriptPath
    Set-Location $projectRoot

    docker-compose restart

    Write-ColorOutput "Services restarted." $Colors.Success
}

function Show-Logs {
    Write-ColorOutput "Showing logs (Ctrl+C to exit)..." $Colors.Info

    $scriptPath = Split-Path -Parent $MyInvocation.ScriptName
    $projectRoot = Split-Path -Parent $scriptPath
    Set-Location $projectRoot

    docker-compose logs -f
}

function Show-Status {
    Write-ColorOutput "Container Status:" $Colors.Info
    Write-ColorOutput ""

    $scriptPath = Split-Path -Parent $MyInvocation.ScriptName
    $projectRoot = Split-Path -Parent $scriptPath
    Set-Location $projectRoot

    docker-compose ps

    Write-ColorOutput ""
    Write-ColorOutput "Health Checks:" $Colors.Info

    # Check backend health
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:5000/health" -UseBasicParsing -TimeoutSec 5
        Write-ColorOutput "  Backend:    OK (Status: $($response.StatusCode))" $Colors.Success
    }
    catch {
        Write-ColorOutput "  Backend:    Not responding" $Colors.Error
    }

    # Check frontend
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing -TimeoutSec 5
        Write-ColorOutput "  Frontend:   OK (Status: $($response.StatusCode))" $Colors.Success
    }
    catch {
        Write-ColorOutput "  Frontend:   Not responding" $Colors.Error
    }

    # Check RabbitMQ
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:15672" -UseBasicParsing -TimeoutSec 5
        Write-ColorOutput "  RabbitMQ:   OK (Status: $($response.StatusCode))" $Colors.Success
    }
    catch {
        Write-ColorOutput "  RabbitMQ:   Not responding" $Colors.Error
    }

    Write-ColorOutput ""
}

function Build-Images {
    Write-ColorOutput "Building Docker images..." $Colors.Info

    if (-not (Test-DockerRunning)) {
        Write-ColorOutput "Error: Docker is not running. Please start Docker Desktop first." $Colors.Error
        return
    }

    $scriptPath = Split-Path -Parent $MyInvocation.ScriptName
    $projectRoot = Split-Path -Parent $scriptPath
    Set-Location $projectRoot

    docker-compose build

    Write-ColorOutput "Build complete." $Colors.Success
}

function Clean-Environment {
    Write-ColorOutput "Cleaning up Docker environment..." $Colors.Warning
    Write-ColorOutput "This will remove all CommHub containers, networks, and volumes." $Colors.Warning
    Write-ColorOutput ""

    $confirm = Read-Host "Are you sure? (y/N)"
    if ($confirm -ne "y" -and $confirm -ne "Y") {
        Write-ColorOutput "Cancelled." $Colors.Info
        return
    }

    $scriptPath = Split-Path -Parent $MyInvocation.ScriptName
    $projectRoot = Split-Path -Parent $scriptPath
    Set-Location $projectRoot

    Write-ColorOutput "Stopping and removing containers..." $Colors.Info
    docker-compose down -v --remove-orphans
    docker-compose -f docker-compose.dev.yml down -v --remove-orphans 2>$null

    Write-ColorOutput "Removing CommHub images..." $Colors.Info
    $images = docker images --filter "reference=*commhub*" -q
    if ($images) {
        docker rmi $images -f 2>$null
    }

    Write-ColorOutput "Removing CommHub volumes..." $Colors.Info
    $volumes = docker volume ls --filter "name=commhub" -q
    if ($volumes) {
        docker volume rm $volumes -f 2>$null
    }

    Write-ColorOutput ""
    Write-ColorOutput "Cleanup complete." $Colors.Success
}

# Main script execution
Write-Banner

switch ($Command) {
    "dev" { Start-Development }
    "prod" { Start-Production }
    "build" { Build-Images }
    "stop" { Stop-Services }
    "restart" { Restart-Services }
    "logs" { Show-Logs }
    "status" { Show-Status }
    "clean" { Clean-Environment }
    "help" { Show-Help }
    default { Show-Help }
}
