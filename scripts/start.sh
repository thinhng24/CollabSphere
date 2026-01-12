#!/bin/bash

# ==================== CommHub Startup Script ====================
# Cross-platform startup script for Linux and macOS

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# ==================== Helper Functions ====================

print_header() {
    echo ""
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}  CommHub - Communication Platform${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""
}

print_step() {
    echo -e "${YELLOW}➜ $1${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

check_command() {
    if ! command -v "$1" &> /dev/null; then
        print_error "$1 is not installed. Please install it first."
        return 1
    fi
    return 0
}

wait_for_service() {
    local url=$1
    local name=$2
    local max_attempts=${3:-30}
    local attempt=1

    print_step "Waiting for $name to be ready..."

    while [ $attempt -le $max_attempts ]; do
        if curl -s -o /dev/null -w "%{http_code}" "$url" | grep -q "200\|301\|302"; then
            print_success "$name is ready!"
            return 0
        fi
        echo -n "."
        sleep 2
        attempt=$((attempt + 1))
    done

    echo ""
    print_error "$name failed to start within expected time"
    return 1
}

# ==================== Prerequisite Checks ====================

check_prerequisites() {
    print_step "Checking prerequisites..."

    local all_ok=true

    if ! check_command "docker"; then
        all_ok=false
    fi

    if ! check_command "docker-compose" && ! docker compose version &> /dev/null; then
        print_error "docker-compose is not installed"
        all_ok=false
    fi

    # Check if Docker daemon is running
    if ! docker info &> /dev/null; then
        print_error "Docker daemon is not running. Please start Docker first."
        all_ok=false
    fi

    if [ "$all_ok" = false ]; then
        echo ""
        print_error "Please install missing prerequisites and try again."
        exit 1
    fi

    print_success "All prerequisites are met!"
}

# ==================== Environment Setup ====================

setup_environment() {
    print_step "Setting up environment..."

    cd "$PROJECT_ROOT"

    # Create .env file for frontend if it doesn't exist
    if [ ! -f "Frontend/.env" ]; then
        if [ -f "Frontend/.env.example" ]; then
            cp "Frontend/.env.example" "Frontend/.env"
            print_success "Created Frontend/.env from example"
        else
            cat > "Frontend/.env" << EOF
VITE_API_URL=http://localhost:5000
VITE_API_BASE_URL=http://localhost:5000/api
VITE_SIGNALR_URL=http://localhost:5000/hubs
VITE_APP_NAME=CommHub
VITE_DEBUG_MODE=true
EOF
            print_success "Created Frontend/.env with defaults"
        fi
    else
        print_info "Frontend/.env already exists"
    fi
}

# ==================== Docker Operations ====================

build_images() {
    print_step "Building Docker images..."
    cd "$PROJECT_ROOT"

    docker-compose build --parallel

    print_success "Docker images built successfully!"
}

start_services() {
    print_step "Starting services..."
    cd "$PROJECT_ROOT"

    docker-compose up -d

    print_success "Services started!"
}

start_dev_services() {
    print_step "Starting development services..."
    cd "$PROJECT_ROOT"

    docker-compose -f docker-compose.dev.yml up -d

    print_success "Development services started!"
}

stop_services() {
    print_step "Stopping services..."
    cd "$PROJECT_ROOT"

    docker-compose down
    docker-compose -f docker-compose.dev.yml down 2>/dev/null || true

    print_success "Services stopped!"
}

show_status() {
    print_step "Service Status:"
    cd "$PROJECT_ROOT"

    echo ""
    docker-compose ps
    echo ""
}

view_logs() {
    local service=${1:-""}
    cd "$PROJECT_ROOT"

    if [ -z "$service" ]; then
        docker-compose logs -f
    else
        docker-compose logs -f "$service"
    fi
}

# ==================== Health Checks ====================

check_health() {
    echo ""
    print_step "Checking service health..."
    echo ""

    # Backend health
    echo -n "Backend API: "
    if curl -s http://localhost:5000/health | grep -q "Healthy"; then
        echo -e "${GREEN}Healthy${NC}"
    else
        echo -e "${RED}Not responding${NC}"
    fi

    # Frontend health
    echo -n "Frontend:    "
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 | grep -q "200"; then
        echo -e "${GREEN}Running${NC}"
    else
        echo -e "${RED}Not responding${NC}"
    fi

    # RabbitMQ health
    echo -n "RabbitMQ:    "
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:15672 | grep -q "200"; then
        echo -e "${GREEN}Running${NC}"
    else
        echo -e "${YELLOW}Not responding (optional)${NC}"
    fi

    # SQL Server health
    echo -n "SQL Server:  "
    if docker-compose exec -T sqlserver /opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P "CommHub@2024!" -Q "SELECT 1" &>/dev/null; then
        echo -e "${GREEN}Running${NC}"
    else
        echo -e "${RED}Not responding${NC}"
    fi

    echo ""
}

# ==================== Display URLs ====================

show_urls() {
    echo ""
    echo -e "${GREEN}CommHub is running!${NC}"
    echo ""
    echo "Access the application at:"
    echo ""
    echo -e "  ${BLUE}Frontend:${NC}     http://localhost:3000"
    echo -e "  ${BLUE}Backend API:${NC}  http://localhost:5000"
    echo -e "  ${BLUE}Swagger UI:${NC}   http://localhost:5000/swagger"
    echo -e "  ${BLUE}RabbitMQ:${NC}     http://localhost:15672 (guest/guest)"
    echo -e "  ${BLUE}Health:${NC}       http://localhost:5000/health"
    echo ""
    echo "Useful commands:"
    echo "  $0 logs          - View all logs"
    echo "  $0 logs backend  - View backend logs"
    echo "  $0 status        - Check service status"
    echo "  $0 stop          - Stop all services"
    echo ""
}

# ==================== Main Menu ====================

show_help() {
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  start       Start all services (default)"
    echo "  dev         Start development environment with hot reload"
    echo "  stop        Stop all services"
    echo "  restart     Restart all services"
    echo "  build       Build Docker images"
    echo "  logs        View logs (optionally specify service)"
    echo "  status      Show service status"
    echo "  health      Check service health"
    echo "  clean       Stop and remove all containers and volumes"
    echo "  help        Show this help message"
    echo ""
}

# ==================== Command Handlers ====================

cmd_start() {
    print_header
    check_prerequisites
    setup_environment

    print_step "Starting CommHub..."

    build_images
    start_services

    print_step "Waiting for services to be ready..."
    sleep 10

    wait_for_service "http://localhost:5000/health" "Backend API" 60

    show_urls
}

cmd_dev() {
    print_header
    check_prerequisites
    setup_environment

    print_step "Starting CommHub in development mode..."

    start_dev_services

    print_step "Waiting for services to be ready..."
    sleep 15

    echo ""
    echo -e "${GREEN}Development environment is starting!${NC}"
    echo ""
    echo "Services will be available at:"
    echo -e "  ${BLUE}Frontend:${NC}  http://localhost:3000 (hot reload enabled)"
    echo -e "  ${BLUE}Backend:${NC}   http://localhost:5000 (hot reload enabled)"
    echo ""
    echo "Run '$0 logs' to view the logs."
    echo ""
}

cmd_stop() {
    print_header
    stop_services
    print_success "CommHub stopped!"
}

cmd_restart() {
    print_header
    stop_services
    start_services

    print_step "Waiting for services to restart..."
    sleep 10

    show_urls
}

cmd_clean() {
    print_header
    print_step "Cleaning up CommHub..."

    cd "$PROJECT_ROOT"

    docker-compose down -v --remove-orphans
    docker-compose -f docker-compose.dev.yml down -v --remove-orphans 2>/dev/null || true

    print_success "Cleanup complete!"
}

# ==================== Main Entry Point ====================

main() {
    local command=${1:-start}

    case "$command" in
        start)
            cmd_start
            ;;
        dev)
            cmd_dev
            ;;
        stop)
            cmd_stop
            ;;
        restart)
            cmd_restart
            ;;
        build)
            print_header
            check_prerequisites
            build_images
            ;;
        logs)
            view_logs "$2"
            ;;
        status)
            print_header
            show_status
            ;;
        health)
            print_header
            check_health
            ;;
        clean)
            cmd_clean
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            print_error "Unknown command: $command"
            echo ""
            show_help
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"
