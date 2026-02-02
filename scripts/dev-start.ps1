# ==================== CommHub Development Quick Start ====================
# Script khởi động nhanh cho môi trường development
# Usage: .\scripts\dev-start.ps1 [options]
#
# Options:
#   -All        : Khởi động tất cả (infrastructure + services)
#   -Infra      : Chỉ khởi động infrastructure
#   -Services   : Chỉ khởi động services (yêu cầu infra đang chạy)
#   -Stop       : Dừng tất cả containers
#   -Restart    : Restart services (giữ infrastructure)
#   -Logs       : Xem logs của tất cả services
#   -Status     : Kiểm tra trạng thái các containers

param(
    [switch]$All,
    [switch]$Infra,
    [switch]$Services,
    [switch]$Stop,
    [switch]$Restart,
    [switch]$Logs,
    [switch]$Status,
    [switch]$Help
)

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
Set-Location $ProjectRoot

# Colors for output
function Write-Info { Write-Host "[INFO] $args" -ForegroundColor Cyan }
function Write-Success { Write-Host "[OK] $args" -ForegroundColor Green }
function Write-Warn { Write-Host "[WARN] $args" -ForegroundColor Yellow }
function Write-Err { Write-Host "[ERROR] $args" -ForegroundColor Red }

function Show-Help {
    Write-Host ""
    Write-Host "CommHub Development Quick Start" -ForegroundColor Cyan
    Write-Host "================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Usage: .\scripts\dev-start.ps1 [option]"
    Write-Host ""
    Write-Host "Options:"
    Write-Host "  -All        Khởi động tất cả (infrastructure + services)" -ForegroundColor Yellow
    Write-Host "  -Infra      Chỉ khởi động infrastructure (SQL, RabbitMQ, Redis)" -ForegroundColor Yellow
    Write-Host "  -Services   Chỉ khởi động services (yêu cầu infra đang chạy)" -ForegroundColor Yellow
    Write-Host "  -Stop       Dừng tất cả containers" -ForegroundColor Yellow
    Write-Host "  -Restart    Restart services (giữ infrastructure)" -ForegroundColor Yellow
    Write-Host "  -Logs       Xem logs của tất cả services" -ForegroundColor Yellow
    Write-Host "  -Status     Kiểm tra trạng thái các containers" -ForegroundColor Yellow
    Write-Host "  -Help       Hiển thị help này" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Ví dụ:"
    Write-Host "  .\scripts\dev-start.ps1 -All       # Lần đầu tiên"
    Write-Host "  .\scripts\dev-start.ps1 -Services  # Các lần sau (nhanh hơn)"
    Write-Host ""
}

function Wait-ForHealthy {
    param([string]$ContainerName, [int]$TimeoutSeconds = 120)

    Write-Info "Đợi $ContainerName healthy..."
    $elapsed = 0
    $interval = 5

    while ($elapsed -lt $TimeoutSeconds) {
        $status = docker inspect --format='{{.State.Health.Status}}' $ContainerName 2>$null
        if ($status -eq "healthy") {
            Write-Success "$ContainerName đã healthy!"
            return $true
        }
        Start-Sleep -Seconds $interval
        $elapsed += $interval
        Write-Host "." -NoNewline
    }

    Write-Warn "$ContainerName chưa healthy sau ${TimeoutSeconds}s (có thể vẫn hoạt động được)"
    return $false
}

function Start-Infrastructure {
    Write-Info "Khởi động Infrastructure (SQL Server, RabbitMQ, Redis)..."
    docker-compose -f docker-compose.infra.yml up -d

    Write-Host ""
    Write-Info "Đợi infrastructure sẵn sàng..."

    # Đợi các services healthy
    Wait-ForHealthy "commhub-redis-dev" 30
    Wait-ForHealthy "commhub-rabbitmq-dev" 60
    Wait-ForHealthy "commhub-sqlserver-dev" 120

    Write-Host ""
    Write-Success "Infrastructure đã sẵn sàng!"
}

function Start-Services {
    # Kiểm tra network tồn tại
    $networkExists = docker network ls --format "{{.Name}}" | Select-String -Pattern "^commhub-network-dev$"
    if (-not $networkExists) {
        Write-Err "Network 'commhub-network-dev' chưa tồn tại!"
        Write-Info "Chạy '-Infra' hoặc '-All' trước để tạo network."
        exit 1
    }

    Write-Info "Khởi động Services (API Gateway, Auth, Chat, Document, Notification, Frontend)..."
    docker-compose -f docker-compose.dev.yml up -d

    Write-Host ""
    Write-Success "Services đã được khởi động!"
    Write-Host ""
    Write-Info "Các services đang build và khởi động. Truy cập:"
    Write-Host "  - Frontend:      http://localhost:3000" -ForegroundColor Green
    Write-Host "  - API Gateway:   http://localhost:5000" -ForegroundColor Green
    Write-Host "  - RabbitMQ UI:   http://localhost:15672 (guest/guest)" -ForegroundColor Green
    Write-Host "  - Adminer:       http://localhost:8080" -ForegroundColor Green
    Write-Host "  - MailHog:       http://localhost:8025" -ForegroundColor Green
    Write-Host ""
    Write-Info "Xem logs: docker-compose -f docker-compose.dev.yml logs -f"
}

function Stop-All {
    Write-Info "Dừng tất cả containers..."
    docker-compose -f docker-compose.dev.yml down 2>$null
    docker-compose -f docker-compose.infra.yml down 2>$null
    Write-Success "Đã dừng tất cả containers!"
}

function Restart-Services {
    Write-Info "Restart services..."
    docker-compose -f docker-compose.dev.yml down
    Start-Services
}

function Show-Status {
    Write-Host ""
    Write-Host "=== Infrastructure ===" -ForegroundColor Cyan
    docker-compose -f docker-compose.infra.yml ps
    Write-Host ""
    Write-Host "=== Services ===" -ForegroundColor Cyan
    docker-compose -f docker-compose.dev.yml ps
    Write-Host ""
}

function Show-Logs {
    docker-compose -f docker-compose.dev.yml logs -f --tail=100
}

# Main logic
if ($Help -or (-not $All -and -not $Infra -and -not $Services -and -not $Stop -and -not $Restart -and -not $Logs -and -not $Status)) {
    Show-Help
    exit 0
}

if ($Stop) {
    Stop-All
    exit 0
}

if ($Status) {
    Show-Status
    exit 0
}

if ($Logs) {
    Show-Logs
    exit 0
}

if ($Infra) {
    Start-Infrastructure
    exit 0
}

if ($Services) {
    Start-Services
    exit 0
}

if ($Restart) {
    Restart-Services
    exit 0
}

if ($All) {
    Start-Infrastructure
    Write-Host ""
    Start-Services
    exit 0
}
