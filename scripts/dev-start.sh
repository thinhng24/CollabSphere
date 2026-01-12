#!/bin/bash
# ==================== CommHub Development Quick Start ====================
# Script khởi động nhanh cho môi trường development
# Usage: ./scripts/dev-start.sh [options]
#
# Options:
#   all        : Khởi động tất cả (infrastructure + services)
#   infra      : Chỉ khởi động infrastructure
#   services   : Chỉ khởi động services (yêu cầu infra đang chạy)
#   stop       : Dừng tất cả containers
#   restart    : Restart services (giữ infrastructure)
#   logs       : Xem logs của tất cả services
#   status     : Kiểm tra trạng thái các containers

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Get script directory and project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_ROOT"

# Helper functions
info() { echo -e "${CYAN}[INFO]${NC} $1"; }
success() { echo -e "${GREEN}[OK]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; }

show_help() {
    echo ""
    echo -e "${CYAN}CommHub Development Quick Start${NC}"
    echo -e "${CYAN}================================${NC}"
    echo ""
    echo "Usage: ./scripts/dev-start.sh [option]"
    echo ""
    echo "Options:"
    echo -e "  ${YELLOW}all${NC}        Khởi động tất cả (infrastructure + services)"
    echo -e "  ${YELLOW}infra${NC}      Chỉ khởi động infrastructure (SQL, RabbitMQ, Redis)"
    echo -e "  ${YELLOW}services${NC}   Chỉ khởi động services (yêu cầu infra đang chạy)"
    echo -e "  ${YELLOW}stop${NC}       Dừng tất cả containers"
    echo -e "  ${YELLOW}restart${NC}    Restart services (giữ infrastructure)"
    echo -e "  ${YELLOW}logs${NC}       Xem logs của tất cả services"
    echo -e "  ${YELLOW}status${NC}     Kiểm tra trạng thái các containers"
    echo -e "  ${YELLOW}help${NC}       Hiển thị help này"
    echo ""
    echo "Ví dụ:"
    echo "  ./scripts/dev-start.sh all       # Lần đầu tiên"
    echo "  ./scripts/dev-start.sh services  # Các lần sau (nhanh hơn)"
    echo ""
}

wait_for_healthy() {
    local container_name=$1
    local timeout=${2:-120}
    local elapsed=0
    local interval=5

    info "Đợi $container_name healthy..."

    while [ $elapsed -lt $timeout ]; do
        status=$(docker inspect --format='{{.State.Health.Status}}' "$container_name" 2>/dev/null || echo "not_found")

        if [ "$status" = "healthy" ]; then
            success "$container_name đã healthy!"
            return 0
        fi

        printf "."
        sleep $interval
        elapsed=$((elapsed + interval))
    done

    echo ""
    warn "$container_name chưa healthy sau ${timeout}s (có thể vẫn hoạt động được)"
    return 1
}

start_infrastructure() {
    info "Khởi động Infrastructure (SQL Server, RabbitMQ, Redis)..."
    docker-compose -f docker-compose.infra.yml up -d

    echo ""
    info "Đợi infrastructure sẵn sàng..."

    # Đợi các services healthy
    wait_for_healthy "commhub-redis-dev" 30 || true
    wait_for_healthy "commhub-rabbitmq-dev" 60 || true
    wait_for_healthy "commhub-sqlserver-dev" 120 || true

    echo ""
    success "Infrastructure đã sẵn sàng!"
}

start_services() {
    # Kiểm tra network tồn tại
    if ! docker network ls --format "{{.Name}}" | grep -q "^commhub-network-dev$"; then
        error "Network 'commhub-network-dev' chưa tồn tại!"
        info "Chạy 'infra' hoặc 'all' trước để tạo network."
        exit 1
    fi

    info "Khởi động Services (API Gateway, Auth, Chat, Document, Notification, Frontend)..."
    docker-compose -f docker-compose.dev.yml up -d

    echo ""
    success "Services đã được khởi động!"
    echo ""
    info "Các services đang build và khởi động. Truy cập:"
    echo -e "  - ${GREEN}Frontend:${NC}      http://localhost:3000"
    echo -e "  - ${GREEN}API Gateway:${NC}   http://localhost:5000"
    echo -e "  - ${GREEN}RabbitMQ UI:${NC}   http://localhost:15672 (guest/guest)"
    echo -e "  - ${GREEN}Adminer:${NC}       http://localhost:8080"
    echo -e "  - ${GREEN}MailHog:${NC}       http://localhost:8025"
    echo ""
    info "Xem logs: docker-compose -f docker-compose.dev.yml logs -f"
}

stop_all() {
    info "Dừng tất cả containers..."
    docker-compose -f docker-compose.dev.yml down 2>/dev/null || true
    docker-compose -f docker-compose.infra.yml down 2>/dev/null || true
    success "Đã dừng tất cả containers!"
}

restart_services() {
    info "Restart services..."
    docker-compose -f docker-compose.dev.yml down
    start_services
}

show_status() {
    echo ""
    echo -e "${CYAN}=== Infrastructure ===${NC}"
    docker-compose -f docker-compose.infra.yml ps
    echo ""
    echo -e "${CYAN}=== Services ===${NC}"
    docker-compose -f docker-compose.dev.yml ps
    echo ""
}

show_logs() {
    docker-compose -f docker-compose.dev.yml logs -f --tail=100
}

# Main logic
case "${1:-help}" in
    all)
        start_infrastructure
        echo ""
        start_services
        ;;
    infra)
        start_infrastructure
        ;;
    services)
        start_services
        ;;
    stop)
        stop_all
        ;;
    restart)
        restart_services
        ;;
    logs)
        show_logs
        ;;
    status)
        show_status
        ;;
    help|*)
        show_help
        ;;
esac
