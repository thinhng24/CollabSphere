#!/bin/bash

echo "🚀 CollabSphere Setup Script"
echo "=============================="

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed. Please install Docker first.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Docker is installed${NC}"

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose is not installed. Please install Docker Compose first.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Docker Compose is installed${NC}"

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo -e "${YELLOW}📝 Creating .env file from .env.example...${NC}"
    cp .env.example .env
    echo -e "${GREEN}✅ .env file created. Please update it with your actual credentials.${NC}"
else
    echo -e "${GREEN}✅ .env file already exists${NC}"
fi

# Ask user what to do
echo ""
echo "What would you like to do?"
echo "1) Build and start all services"
echo "2) Start all services (without building)"
echo "3) Stop all services"
echo "4) View logs"
echo "5) Clean up (remove containers and volumes)"
echo "6) Run database migrations"
echo "7) Exit"
echo ""
read -p "Enter your choice (1-7): " choice

case $choice in
    1)
        echo -e "${YELLOW}🔨 Building and starting all services...${NC}"
        docker-compose up --build -d
        echo -e "${GREEN}✅ All services are running!${NC}"
        echo ""
        echo "Access points:"
        echo "- API Gateway: http://localhost:5000"
        echo "- Frontend: http://localhost:3000"
        echo "- RabbitMQ Management: http://localhost:15672 (admin/admin123)"
        echo ""
        echo "To view logs: docker-compose logs -f"
        ;;
    2)
        echo -e "${YELLOW}▶️  Starting all services...${NC}"
        docker-compose up -d
        echo -e "${GREEN}✅ All services are running!${NC}"
        ;;
    3)
        echo -e "${YELLOW}⏹️  Stopping all services...${NC}"
        docker-compose down
        echo -e "${GREEN}✅ All services stopped${NC}"
        ;;
    4)
        echo -e "${YELLOW}📋 Viewing logs (Ctrl+C to exit)...${NC}"
        docker-compose logs -f
        ;;
    5)
        echo -e "${RED}⚠️  This will remove all containers and volumes. Are you sure? (y/n)${NC}"
        read -p "" confirm
        if [ "$confirm" = "y" ]; then
            echo -e "${YELLOW}🧹 Cleaning up...${NC}"
            docker-compose down -v
            echo -e "${GREEN}✅ Cleanup complete${NC}"
        else
            echo -e "${YELLOW}Cancelled${NC}"
        fi
        ;;
    6)
        echo -e "${YELLOW}🔄 Running database migrations...${NC}"
        echo "Which service?"
        echo "1) AuthService"
        echo "2) AcademicService"
        echo "3) ProjectService"
        echo "4) TeamService"
        echo "5) CommunicationService"
        echo "6) RealtimeService"
        read -p "Enter choice (1-6): " service_choice
        
        case $service_choice in
            1) SERVICE="AuthService" ;;
            2) SERVICE="AcademicService" ;;
            3) SERVICE="ProjectService" ;;
            4) SERVICE="TeamService" ;;
            5) SERVICE="CommunicationService" ;;
            6) SERVICE="RealtimeService" ;;
            *) echo -e "${RED}Invalid choice${NC}"; exit 1 ;;
        esac
        
        echo -e "${YELLOW}Running migrations for ${SERVICE}...${NC}"
        cd services/${SERVICE}/${SERVICE}.API
        dotnet ef database update --project ../${SERVICE}.Infrastructure
        echo -e "${GREEN}✅ Migrations complete${NC}"
        ;;
    7)
        echo -e "${GREEN}👋 Goodbye!${NC}"
        exit 0
        ;;
    *)
        echo -e "${RED}❌ Invalid choice${NC}"
        exit 1
        ;;
esac
