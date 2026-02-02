# ==================== CommHub Microservices Makefile ====================
# Convenience commands for Docker and development operations

.PHONY: help build up down restart logs clean dev prod \
        gateway-logs auth-logs chat-logs doc-logs notify-logs \
        frontend-logs db-logs rabbitmq-logs redis-logs \
        db-shell rabbitmq-shell redis-cli \
        infra infra-down test lint format \
        install build-frontend \
        prune reset health status

# Default target
.DEFAULT_GOAL := help

# Colors for terminal output
BLUE := \033[0;34m
GREEN := \033[0;32m
YELLOW := \033[0;33m
RED := \033[0;31m
NC := \033[0m # No Color

# ==================== Help ====================
help: ## Show this help message
	@echo ""
	@echo "$(BLUE)CommHub Microservices - Docker Commands$(NC)"
	@echo "=========================================="
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "$(GREEN)%-20s$(NC) %s\n", $$1, $$2}'
	@echo ""

# ==================== Docker Compose - Production ====================
build: ## Build all Docker images
	docker-compose build

up: ## Start all services in background
	docker-compose up -d

down: ## Stop all services
	docker-compose down

restart: ## Restart all services
	docker-compose restart

logs: ## View logs from all services
	docker-compose logs -f

stop: ## Stop all services without removing
	docker-compose stop

start: ## Start stopped services
	docker-compose start

ps: ## List running containers
	docker-compose ps

# ==================== Docker Compose - Development (Optimized) ====================
dev: ## Start development environment (infra + services)
	@echo "$(BLUE)Starting infrastructure...$(NC)"
	docker-compose -f docker-compose.infra.yml up -d
	@echo "$(YELLOW)Waiting for infrastructure to be ready (30s)...$(NC)"
	@sleep 30
	@echo "$(BLUE)Starting services...$(NC)"
	docker-compose -f docker-compose.dev.yml up -d
	@echo "$(GREEN)Development environment started!$(NC)"

dev-quick: ## Quick start services only (requires infra running)
	docker-compose -f docker-compose.dev.yml up -d

dev-build: ## Build and start development environment
	docker-compose -f docker-compose.infra.yml up -d
	@sleep 30
	docker-compose -f docker-compose.dev.yml up --build -d

dev-down: ## Stop development services (keep infrastructure)
	docker-compose -f docker-compose.dev.yml down

dev-down-all: ## Stop everything (services + infrastructure)
	docker-compose -f docker-compose.dev.yml down
	docker-compose -f docker-compose.infra.yml down

dev-logs: ## View development services logs
	docker-compose -f docker-compose.dev.yml logs -f

dev-restart: ## Restart services only (fast restart)
	docker-compose -f docker-compose.dev.yml down
	docker-compose -f docker-compose.dev.yml up -d

# ==================== Infrastructure Only ====================
infra: ## Start infrastructure only (SQL Server, RabbitMQ, Redis) - run once
	docker-compose -f docker-compose.infra.yml up -d
	@echo "$(YELLOW)Infrastructure starting... Wait ~30-60s for first time$(NC)"

infra-wait: ## Start infrastructure and wait for healthy
	docker-compose -f docker-compose.infra.yml up -d
	@echo "$(YELLOW)Waiting for SQL Server (60s)...$(NC)"
	@sleep 60
	@echo "$(GREEN)Infrastructure should be ready!$(NC)"

infra-down: ## Stop infrastructure
	docker-compose -f docker-compose.infra.yml down

infra-logs: ## View infrastructure logs
	docker-compose -f docker-compose.infra.yml logs -f

infra-status: ## Check infrastructure health status
	@echo "$(BLUE)Infrastructure Status:$(NC)"
	@docker inspect --format='{{.Name}}: {{.State.Health.Status}}' commhub-sqlserver-dev 2>/dev/null || echo "SQL Server: not running"
	@docker inspect --format='{{.Name}}: {{.State.Health.Status}}' commhub-rabbitmq-dev 2>/dev/null || echo "RabbitMQ: not running"
	@docker inspect --format='{{.Name}}: {{.State.Health.Status}}' commhub-redis-dev 2>/dev/null || echo "Redis: not running"

# ==================== Production ====================
prod: ## Start production environment
	docker-compose -f docker-compose.yml up -d

prod-build: ## Build and start production environment
	docker-compose -f docker-compose.yml up -d --build

prod-down: ## Stop production environment
	docker-compose -f docker-compose.yml down

# ==================== Service-Specific Logs ====================
gateway-logs: ## View API Gateway logs
	docker-compose logs -f api-gateway

auth-logs: ## View Auth Service logs
	docker-compose logs -f auth-service

chat-logs: ## View Chat Service logs
	docker-compose logs -f chat-service

doc-logs: ## View Document Service logs
	docker-compose logs -f document-service

notify-logs: ## View Notification Service logs
	docker-compose logs -f notification-service

frontend-logs: ## View frontend logs
	docker-compose logs -f frontend

db-logs: ## View database logs
	docker-compose logs -f sqlserver

rabbitmq-logs: ## View RabbitMQ logs
	docker-compose logs -f rabbitmq

redis-logs: ## View Redis logs
	docker-compose logs -f redis

# ==================== Shell Access ====================
gateway-shell: ## Open shell in API Gateway container
	docker-compose exec api-gateway sh

auth-shell: ## Open shell in Auth Service container
	docker-compose exec auth-service sh

chat-shell: ## Open shell in Chat Service container
	docker-compose exec chat-service sh

frontend-shell: ## Open shell in frontend container
	docker-compose exec frontend sh

db-shell: ## Open SQL Server shell
	docker-compose exec sqlserver /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "CommHub@2024!" -C

rabbitmq-shell: ## Open RabbitMQ shell
	docker-compose exec rabbitmq sh

redis-cli: ## Open Redis CLI
	docker-compose exec redis redis-cli

# ==================== Local Development (without Docker) ====================
install: ## Install frontend dependencies
	cd Frontend && npm install

run-gateway: ## Run API Gateway locally
	cd Backend/ApiGateway && dotnet run

run-auth: ## Run Auth Service locally
	cd Backend/Services/AuthService && dotnet run

run-chat: ## Run Chat Service locally
	cd Backend/Services/ChatService && dotnet run

run-doc: ## Run Document Service locally
	cd Backend/Services/DocumentService && dotnet run

run-notify: ## Run Notification Service locally
	cd Backend/Services/NotificationService && dotnet run

run-frontend: ## Run frontend locally
	cd Frontend && npm run dev

build-frontend: ## Build frontend for production
	cd Frontend && npm run build

build-gateway: ## Build API Gateway for production
	cd Backend/ApiGateway && dotnet publish -c Release -o ./publish

build-auth: ## Build Auth Service for production
	cd Backend/Services/AuthService && dotnet publish -c Release -o ./publish

build-chat: ## Build Chat Service for production
	cd Backend/Services/ChatService && dotnet publish -c Release -o ./publish

build-doc: ## Build Document Service for production
	cd Backend/Services/DocumentService && dotnet publish -c Release -o ./publish

build-notify: ## Build Notification Service for production
	cd Backend/Services/NotificationService && dotnet publish -c Release -o ./publish

# ==================== Testing ====================
test: ## Run all tests
	cd Frontend && npm run test

test-frontend: ## Run frontend tests
	cd Frontend && npm run test

test-watch: ## Run frontend tests in watch mode
	cd Frontend && npm run test:watch

# ==================== Code Quality ====================
lint: ## Run linting on all code
	cd Frontend && npm run lint

lint-fix: ## Fix linting issues
	cd Frontend && npm run lint:fix

format: ## Format code
	cd Frontend && npm run format

# ==================== Cleanup ====================
clean: ## Stop and remove all containers, networks, and volumes
	docker-compose down -v --remove-orphans
	docker-compose -f docker-compose.dev.yml down -v --remove-orphans
	docker-compose -f docker-compose.infra.yml down -v --remove-orphans

clean-images: ## Remove all CommHub Docker images
	docker images | grep commhub | awk '{print $$3}' | xargs -r docker rmi -f

clean-volumes: ## Remove all CommHub Docker volumes
	docker volume ls | grep commhub | awk '{print $$2}' | xargs -r docker volume rm

prune: ## Remove all unused Docker resources
	docker system prune -af --volumes

reset: clean clean-images clean-volumes ## Full reset - remove everything

# ==================== Health & Status ====================
health: ## Check health of all services
	@echo "$(BLUE)Checking service health...$(NC)"
	@echo ""
	@echo "$(GREEN)API Gateway (5000):$(NC)"
	@curl -s http://localhost:5000/health || echo "$(RED)Not responding$(NC)"
	@echo ""
	@echo "$(GREEN)Auth Service (5001):$(NC)"
	@curl -s http://localhost:5001/health || echo "$(RED)Not responding$(NC)"
	@echo ""
	@echo "$(GREEN)Chat Service (5002):$(NC)"
	@curl -s http://localhost:5002/health || echo "$(RED)Not responding$(NC)"
	@echo ""
	@echo "$(GREEN)Document Service (5003):$(NC)"
	@curl -s http://localhost:5003/health || echo "$(RED)Not responding$(NC)"
	@echo ""
	@echo "$(GREEN)Notification Service (5004):$(NC)"
	@curl -s http://localhost:5004/health || echo "$(RED)Not responding$(NC)"
	@echo ""
	@echo "$(GREEN)Frontend (3000):$(NC)"
	@curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 && echo " OK" || echo "$(RED)Not responding$(NC)"
	@echo ""
	@echo "$(GREEN)RabbitMQ (15672):$(NC)"
	@curl -s -o /dev/null -w "%{http_code}" http://localhost:15672 && echo " OK" || echo "$(RED)Not responding$(NC)"

status: ## Show status of all containers
	@echo "$(BLUE)Container Status:$(NC)"
	@docker-compose ps
	@echo ""
	@echo "$(BLUE)Resource Usage:$(NC)"
	@docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}" | grep commhub || true

# ==================== Utilities ====================
env-example: ## Create .env files from examples
	cp Frontend/.env.example Frontend/.env 2>/dev/null || true
	@echo "$(GREEN)Environment files created$(NC)"

swagger-gateway: ## Open API Gateway in browser
	@echo "Opening API Gateway..."
	@open http://localhost:5000 2>/dev/null || xdg-open http://localhost:5000 2>/dev/null || start http://localhost:5000

swagger-auth: ## Open Auth Service Swagger in browser
	@echo "Opening Auth Service Swagger..."
	@open http://localhost:5001/swagger 2>/dev/null || xdg-open http://localhost:5001/swagger 2>/dev/null || start http://localhost:5001/swagger

swagger-chat: ## Open Chat Service Swagger in browser
	@echo "Opening Chat Service Swagger..."
	@open http://localhost:5002/swagger 2>/dev/null || xdg-open http://localhost:5002/swagger 2>/dev/null || start http://localhost:5002/swagger

swagger-doc: ## Open Document Service Swagger in browser
	@echo "Opening Document Service Swagger..."
	@open http://localhost:5003/swagger 2>/dev/null || xdg-open http://localhost:5003/swagger 2>/dev/null || start http://localhost:5003/swagger

swagger-notify: ## Open Notification Service Swagger in browser
	@echo "Opening Notification Service Swagger..."
	@open http://localhost:5004/swagger 2>/dev/null || xdg-open http://localhost:5004/swagger 2>/dev/null || start http://localhost:5004/swagger

rabbitmq-ui: ## Open RabbitMQ Management UI in browser
	@echo "Opening RabbitMQ Management..."
	@open http://localhost:15672 2>/dev/null || xdg-open http://localhost:15672 2>/dev/null || start http://localhost:15672

adminer: ## Open Adminer (Database UI) in browser
	@echo "Opening Adminer..."
	@open http://localhost:8080 2>/dev/null || xdg-open http://localhost:8080 2>/dev/null || start http://localhost:8080

# ==================== Quick Start ====================
quick-start: ## Quick start for new developers (optimized)
	@echo "$(BLUE)Starting CommHub Microservices Quick Setup...$(NC)"
	@echo ""
	@echo "$(YELLOW)Step 1: Starting infrastructure...$(NC)"
	@docker-compose -f docker-compose.infra.yml up -d
	@echo ""
	@echo "$(YELLOW)Step 2: Waiting for infrastructure (45s)...$(NC)"
	@sleep 45
	@echo ""
	@echo "$(YELLOW)Step 3: Starting services...$(NC)"
	@docker-compose -f docker-compose.dev.yml up -d
	@echo ""
	@echo "$(GREEN)CommHub Microservices is starting!$(NC)"
	@echo ""
	@echo "$(YELLOW)Note: Services need ~60s more to build and start$(NC)"
	@echo ""
	@echo "Access the application at:"
	@echo "  - Frontend:           http://localhost:3000"
	@echo "  - API Gateway:        http://localhost:5000"
	@echo "  - Auth Service:       http://localhost:5001/swagger"
	@echo "  - Chat Service:       http://localhost:5002/swagger"
	@echo "  - Document Service:   http://localhost:5003/swagger"
	@echo "  - Notification Svc:   http://localhost:5004/swagger"
	@echo "  - RabbitMQ:           http://localhost:15672 (guest/guest)"
	@echo "  - Adminer:            http://localhost:8080"
	@echo "  - MailHog:            http://localhost:8025"
	@echo ""
	@echo "$(BLUE)Tips for faster startup next time:$(NC)"
	@echo "  - Keep infrastructure running: make infra"
	@echo "  - Then start services only:    make dev-quick"
	@echo ""
