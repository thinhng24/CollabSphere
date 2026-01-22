#!/bin/bash

# CollabSphere Quick Test Script
# Sử dụng: ./quick-test.sh [service_name]
# Ví dụ: ./quick-test.sh auth
#        ./quick-test.sh project
#        ./quick-test.sh all

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Base URLs
AUTH_URL="http://localhost:5001"
PROJECT_URL="http://localhost:5003"
GATEWAY_URL="http://localhost:5000"

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   CollabSphere Quick Test Script      ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""

# Function to test AuthService
test_auth() {
    echo -e "${YELLOW}🔐 Testing AuthService...${NC}"
    echo ""
    
    # Test 1: Health Check
    echo -e "${BLUE}1. Health Check${NC}"
    if curl -s "$AUTH_URL/health" > /dev/null; then
        echo -e "${GREEN}✅ AuthService is running${NC}"
    else
        echo -e "${RED}❌ AuthService is not responding${NC}"
        return 1
    fi
    echo ""
    
    # Test 2: Register
    echo -e "${BLUE}2. Register User${NC}"
    REGISTER_RESPONSE=$(curl -s -X POST "$AUTH_URL/api/auth/register" \
        -H "Content-Type: application/json" \
        -d '{
            "email": "test'$(date +%s)'@test.com",
            "password": "Test@123",
            "fullName": "Test User",
            "role": 4
        }')
    
    if echo "$REGISTER_RESPONSE" | grep -q "token"; then
        echo -e "${GREEN}✅ User registered successfully${NC}"
        TOKEN=$(echo "$REGISTER_RESPONSE" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
        echo -e "${YELLOW}Token: ${TOKEN:0:50}...${NC}"
    else
        echo -e "${RED}❌ Registration failed${NC}"
        echo "$REGISTER_RESPONSE"
        return 1
    fi
    echo ""
    
    # Test 3: Login
    echo -e "${BLUE}3. Login${NC}"
    LOGIN_RESPONSE=$(curl -s -X POST "$AUTH_URL/api/auth/login" \
        -H "Content-Type: application/json" \
        -d '{
            "email": "admin@collabsphere.com",
            "password": "Admin@123"
        }')
    
    if echo "$LOGIN_RESPONSE" | grep -q "token"; then
        echo -e "${GREEN}✅ Login successful${NC}"
        ADMIN_TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
    else
        echo -e "${RED}❌ Login failed${NC}"
        echo "$LOGIN_RESPONSE"
        return 1
    fi
    echo ""
    
    # Test 4: Get Users
    echo -e "${BLUE}4. Get Users (with authentication)${NC}"
    USERS_RESPONSE=$(curl -s -X GET "$AUTH_URL/api/users" \
        -H "Authorization: Bearer $ADMIN_TOKEN")
    
    if echo "$USERS_RESPONSE" | grep -q "items"; then
        echo -e "${GREEN}✅ Retrieved users successfully${NC}"
        USER_COUNT=$(echo "$USERS_RESPONSE" | grep -o '"totalCount":[0-9]*' | cut -d':' -f2)
        echo -e "${YELLOW}Total users: $USER_COUNT${NC}"
    else
        echo -e "${RED}❌ Failed to get users${NC}"
        echo "$USERS_RESPONSE"
        return 1
    fi
    echo ""
    
    echo -e "${GREEN}✅ AuthService tests completed successfully!${NC}"
    echo ""
}

# Function to test ProjectService
test_project() {
    echo -e "${YELLOW}📊 Testing ProjectService...${NC}"
    echo ""
    
    # Test 1: Health Check
    echo -e "${BLUE}1. Health Check${NC}"
    if curl -s "$PROJECT_URL/health" > /dev/null; then
        echo -e "${GREEN}✅ ProjectService is running${NC}"
    else
        echo -e "${RED}❌ ProjectService is not responding${NC}"
        return 1
    fi
    echo ""
    
    # Get token from AuthService first
    echo -e "${BLUE}2. Getting authentication token...${NC}"
    LOGIN_RESPONSE=$(curl -s -X POST "$AUTH_URL/api/auth/login" \
        -H "Content-Type: application/json" \
        -d '{
            "email": "admin@collabsphere.com",
            "password": "Admin@123"
        }')
    
    if echo "$LOGIN_RESPONSE" | grep -q "token"; then
        TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
        echo -e "${GREEN}✅ Token obtained${NC}"
    else
        echo -e "${RED}❌ Failed to get token${NC}"
        return 1
    fi
    echo ""
    
    # Test 3: Create Project
    echo -e "${BLUE}3. Create Project${NC}"
    PROJECT_RESPONSE=$(curl -s -X POST "$PROJECT_URL/api/projects" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d '{
            "name": "Test Project '$(date +%s)'",
            "description": "Automated test project",
            "objectives": "Testing project creation",
            "syllabusId": "00000000-0000-0000-0000-000000000001",
            "classId": "00000000-0000-0000-0000-000000000002"
        }')
    
    if echo "$PROJECT_RESPONSE" | grep -q '"id"'; then
        echo -e "${GREEN}✅ Project created successfully${NC}"
        PROJECT_ID=$(echo "$PROJECT_RESPONSE" | grep -o '"id":"[^"]*' | cut -d'"' -f4)
        echo -e "${YELLOW}Project ID: $PROJECT_ID${NC}"
    else
        echo -e "${RED}❌ Failed to create project${NC}"
        echo "$PROJECT_RESPONSE"
        return 1
    fi
    echo ""
    
    # Test 4: Get Projects
    echo -e "${BLUE}4. Get All Projects${NC}"
    PROJECTS_RESPONSE=$(curl -s -X GET "$PROJECT_URL/api/projects?pageNumber=1&pageSize=10" \
        -H "Authorization: Bearer $TOKEN")
    
    if echo "$PROJECTS_RESPONSE" | grep -q "items"; then
        echo -e "${GREEN}✅ Retrieved projects successfully${NC}"
        PROJECT_COUNT=$(echo "$PROJECTS_RESPONSE" | grep -o '"totalCount":[0-9]*' | cut -d':' -f2)
        echo -e "${YELLOW}Total projects: $PROJECT_COUNT${NC}"
    else
        echo -e "${RED}❌ Failed to get projects${NC}"
        echo "$PROJECTS_RESPONSE"
        return 1
    fi
    echo ""
    
    # Test 5: Create Milestone
    if [ ! -z "$PROJECT_ID" ]; then
        echo -e "${BLUE}5. Create Milestone${NC}"
        MILESTONE_RESPONSE=$(curl -s -X POST "$PROJECT_URL/api/milestones" \
            -H "Authorization: Bearer $TOKEN" \
            -H "Content-Type: application/json" \
            -d '{
                "projectId": "'$PROJECT_ID'",
                "title": "Test Milestone",
                "description": "Automated test milestone",
                "dueDate": "2025-12-31T00:00:00Z",
                "order": 1
            }')
        
        if echo "$MILESTONE_RESPONSE" | grep -q '"id"'; then
            echo -e "${GREEN}✅ Milestone created successfully${NC}"
        else
            echo -e "${RED}❌ Failed to create milestone${NC}"
            echo "$MILESTONE_RESPONSE"
        fi
        echo ""
    fi
    
    echo -e "${GREEN}✅ ProjectService tests completed successfully!${NC}"
    echo ""
}

# Function to test API Gateway
test_gateway() {
    echo -e "${YELLOW}🌐 Testing API Gateway...${NC}"
    echo ""
    
    # Test 1: Health Check
    echo -e "${BLUE}1. Gateway Health Check${NC}"
    if curl -s "$GATEWAY_URL/health" > /dev/null; then
        echo -e "${GREEN}✅ API Gateway is running${NC}"
    else
        echo -e "${RED}❌ API Gateway is not responding${NC}"
        return 1
    fi
    echo ""
    
    # Test 2: Auth Route
    echo -e "${BLUE}2. Test Auth Route through Gateway${NC}"
    GATEWAY_AUTH_RESPONSE=$(curl -s "$GATEWAY_URL/auth/health")
    if [ ! -z "$GATEWAY_AUTH_RESPONSE" ]; then
        echo -e "${GREEN}✅ Auth route working${NC}"
    else
        echo -e "${RED}❌ Auth route failed${NC}"
    fi
    echo ""
    
    # Test 3: Project Route
    echo -e "${BLUE}3. Test Project Route through Gateway${NC}"
    GATEWAY_PROJECT_RESPONSE=$(curl -s "$GATEWAY_URL/projects/health")
    if [ ! -z "$GATEWAY_PROJECT_RESPONSE" ]; then
        echo -e "${GREEN}✅ Project route working${NC}"
    else
        echo -e "${RED}❌ Project route failed${NC}"
    fi
    echo ""
    
    echo -e "${GREEN}✅ API Gateway tests completed successfully!${NC}"
    echo ""
}

# Function to test Docker services
test_docker() {
    echo -e "${YELLOW}🐳 Testing Docker Services...${NC}"
    echo ""
    
    # Check if Docker is running
    if ! docker info > /dev/null 2>&1; then
        echo -e "${RED}❌ Docker is not running${NC}"
        return 1
    fi
    
    echo -e "${BLUE}1. Checking Docker Containers${NC}"
    
    # Check PostgreSQL
    if docker ps | grep -q "collabsphere-postgres-auth"; then
        echo -e "${GREEN}✅ PostgreSQL (Auth) is running${NC}"
    else
        echo -e "${RED}❌ PostgreSQL (Auth) is not running${NC}"
    fi
    
    if docker ps | grep -q "collabsphere-postgres-project"; then
        echo -e "${GREEN}✅ PostgreSQL (Project) is running${NC}"
    else
        echo -e "${RED}❌ PostgreSQL (Project) is not running${NC}"
    fi
    
    # Check Redis
    if docker ps | grep -q "collabsphere-redis"; then
        echo -e "${GREEN}✅ Redis is running${NC}"
    else
        echo -e "${YELLOW}⚠️  Redis is not running${NC}"
    fi
    
    # Check RabbitMQ
    if docker ps | grep -q "collabsphere-rabbitmq"; then
        echo -e "${GREEN}✅ RabbitMQ is running${NC}"
    else
        echo -e "${YELLOW}⚠️  RabbitMQ is not running${NC}"
    fi
    
    echo ""
    echo -e "${GREEN}✅ Docker services check completed!${NC}"
    echo ""
}

# Main script
case "${1:-all}" in
    auth)
        test_auth
        ;;
    project)
        test_project
        ;;
    gateway)
        test_gateway
        ;;
    docker)
        test_docker
        ;;
    all)
        test_docker
        echo ""
        test_auth
        echo ""
        test_project
        echo ""
        test_gateway
        ;;
    *)
        echo -e "${RED}Invalid option: $1${NC}"
        echo "Usage: $0 [auth|project|gateway|docker|all]"
        exit 1
        ;;
esac

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║         All Tests Completed!          ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
