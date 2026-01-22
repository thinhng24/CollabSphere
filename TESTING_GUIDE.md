# 🧪 Hướng Dẫn Test Server CollabSphere

## 📋 Mục Lục
1. [Chuẩn Bị Môi Trường](#1-chuẩn-bị-môi-trường)
2. [Test AuthService](#2-test-authservice)
3. [Test ProjectService](#3-test-projectservice)
4. [Test với Docker](#4-test-với-docker)
5. [Test API Gateway](#5-test-api-gateway)
6. [Troubleshooting](#6-troubleshooting)

---

## 1. Chuẩn Bị Môi Trường

### Yêu Cầu Hệ Thống
- ✅ .NET 8.0 SDK
- ✅ PostgreSQL 16
- ✅ Docker Desktop (optional)
- ✅ Postman hoặc curl
- ✅ Visual Studio Code hoặc Visual Studio 2022

### Kiểm Tra Cài Đặt

```bash
# Kiểm tra .NET
dotnet --version
# Kết quả mong đợi: 8.0.x

# Kiểm tra Docker
docker --version
# Kết quả mong đợi: Docker version 24.x.x

# Kiểm tra PostgreSQL
psql --version
# Kết quả mong đợi: psql (PostgreSQL) 16.x
```

---

## 2. Test AuthService

### Bước 1: Khởi Động Database

#### Option A: Dùng Docker (Khuyến nghị)
```bash
# Từ thư mục CollabSphere
docker-compose up postgres-auth -d

# Kiểm tra database đã chạy
docker ps | grep postgres-auth
```

#### Option B: PostgreSQL Local
```sql
-- Tạo database
CREATE DATABASE authdb;

-- Kiểm tra
\l
```

### Bước 2: Chạy AuthService

```bash
# Di chuyển vào thư mục API
cd CollabSphere/services/AuthService/AuthService.API

# Restore packages
dotnet restore

# Chạy migrations (tạo tables)
dotnet ef database update --project ../AuthService.Infrastructure

# Chạy service
dotnet run
```

**Kết quả mong đợi:**
```
info: Microsoft.Hosting.Lifetime[14]
      Now listening on: http://localhost:5001
info: Microsoft.Hosting.Lifetime[0]
      Application started. Press Ctrl+C to shut down.
✅ Database migrated successfully
🚀 AuthService is running...
```

### Bước 3: Test API với Swagger

1. Mở trình duyệt: `http://localhost:5001`
2. Bạn sẽ thấy Swagger UI
3. Test các endpoints:

#### 3.1 Register User (Đăng ký)

**Endpoint:** `POST /api/auth/register`

**Request Body:**
```json
{
  "email": "lecturer@test.com",
  "password": "Test@123",
  "fullName": "Nguyen Van A",
  "role": 4
}
```

**Roles:**
- 1 = Admin
- 2 = Staff
- 3 = HeadDepartment
- 4 = Lecturer
- 5 = Student

**Kết quả mong đợi:**
```json
{
  "isSuccess": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "guid-here",
    "expiresAt": "2025-01-15T10:00:00Z",
    "user": {
      "id": "guid-here",
      "email": "lecturer@test.com",
      "fullName": "Nguyen Van A",
      "role": 4
    }
  }
}
```

#### 3.2 Login (Đăng nhập)

**Endpoint:** `POST /api/auth/login`

**Request Body:**
```json
{
  "email": "lecturer@test.com",
  "password": "Test@123"
}
```

**Kết quả mong đợi:**
```json
{
  "isSuccess": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "guid-here",
    "expiresAt": "2025-01-15T10:00:00Z"
  }
}
```

**⚠️ LƯU Ý:** Copy token này để dùng cho các request tiếp theo!

#### 3.3 Get All Users (Lấy danh sách users)

**Endpoint:** `GET /api/users`

**Headers:**
```
Authorization: Bearer YOUR_TOKEN_HERE
```

**Trong Swagger:**
1. Click nút "Authorize" ở góc trên
2. Nhập: `Bearer YOUR_TOKEN_HERE`
3. Click "Authorize"
4. Thử endpoint GET /api/users

**Kết quả mong đợi:**
```json
{
  "isSuccess": true,
  "data": {
    "items": [
      {
        "id": "guid",
        "email": "admin@collabsphere.com",
        "fullName": "System Admin",
        "role": 1
      },
      {
        "id": "guid",
        "email": "lecturer@test.com",
        "fullName": "Nguyen Van A",
        "role": 4
      }
    ],
    "totalCount": 2,
    "pageNumber": 1,
    "pageSize": 10
  }
}
```

### Bước 4: Test với curl

```bash
# 1. Register
curl -X POST http://localhost:5001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@test.com",
    "password": "Test@123",
    "fullName": "Tran Thi B",
    "role": 5
  }'

# 2. Login
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@test.com",
    "password": "Test@123"
  }'

# 3. Get Users (thay YOUR_TOKEN)
curl -X GET http://localhost:5001/api/users \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 3. Test ProjectService

### Bước 1: Khởi Động Database

```bash
# Từ thư mục CollabSphere
docker-compose up postgres-project -d
```

### Bước 2: Chạy ProjectService

```bash
# Di chuyển vào thư mục API
cd CollabSphere/services/ProjectService/ProjectService.API

# Restore packages
dotnet restore

# Chạy migrations
dotnet ef database update --project ../ProjectService.Infrastructure

# Chạy service
dotnet run
```

**Kết quả mong đợi:**
```
info: Microsoft.Hosting.Lifetime[14]
      Now listening on: http://localhost:5003
✅ Database migrated successfully
🚀 ProjectService is running...
```

### Bước 3: Test API với Swagger

Mở: `http://localhost:5003`

#### 3.1 Create Project (Tạo dự án)

**⚠️ Cần token của Lecturer từ AuthService!**

**Endpoint:** `POST /api/projects`

**Headers:**
```
Authorization: Bearer YOUR_LECTURER_TOKEN
```

**Request Body:**
```json
{
  "name": "E-Commerce Platform",
  "description": "Xây dựng nền tảng thương mại điện tử hoàn chỉnh",
  "objectives": "Học microservices, React, payment integration",
  "syllabusId": "00000000-0000-0000-0000-000000000001",
  "classId": "00000000-0000-0000-0000-000000000002"
}
```

**Kết quả mong đợi:**
```json
{
  "isSuccess": true,
  "data": {
    "id": "project-guid",
    "name": "E-Commerce Platform",
    "description": "Xây dựng nền tảng thương mại điện tử hoàn chỉnh",
    "status": 1,
    "createdAt": "2025-01-15T10:00:00Z"
  }
}
```

#### 3.2 Get All Projects

**Endpoint:** `GET /api/projects?pageNumber=1&pageSize=10`

**Headers:**
```
Authorization: Bearer YOUR_TOKEN
```

#### 3.3 Submit for Approval

**Endpoint:** `POST /api/projects/{projectId}/submit`

**Headers:**
```
Authorization: Bearer YOUR_LECTURER_TOKEN
```

#### 3.4 Approve Project (Cần token Head Department)

**Endpoint:** `POST /api/projects/{projectId}/approve`

**Headers:**
```
Authorization: Bearer YOUR_HEAD_DEPT_TOKEN
```

**Request Body:**
```json
{
  "comments": "Dự án tốt, được phê duyệt!"
}
```

#### 3.5 Create Milestone

**Endpoint:** `POST /api/milestones`

**Request Body:**
```json
{
  "projectId": "YOUR_PROJECT_ID",
  "title": "Thiết kế Database",
  "description": "Thiết kế và implement database schema",
  "dueDate": "2025-02-15T00:00:00Z",
  "order": 1
}
```

---

## 4. Test với Docker

### Bước 1: Build và Chạy Tất Cả Services

```bash
# Từ thư mục CollabSphere
docker-compose up --build
```

**Services sẽ chạy:**
- PostgreSQL (6 databases): ports 5432-5437
- Redis: port 6379
- RabbitMQ: ports 5672, 15672
- API Gateway: port 5000
- AuthService: port 5001
- ProjectService: port 5003

### Bước 2: Kiểm Tra Services

```bash
# Xem tất cả containers
docker ps

# Xem logs của service cụ thể
docker logs collabsphere-auth-service
docker logs collabsphere-project-service

# Kiểm tra health
curl http://localhost:5001/health
curl http://localhost:5003/health
```

### Bước 3: Test qua API Gateway

```bash
# Register qua Gateway
curl -X POST http://localhost:5000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@gateway.com",
    "password": "Test@123",
    "fullName": "Gateway Test",
    "role": 4
  }'

# Get projects qua Gateway
curl -X GET http://localhost:5000/projects \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 5. Test API Gateway

### Kiểm Tra Routing

```bash
# AuthService routes
curl http://localhost:5000/auth/health
curl http://localhost:5000/users

# ProjectService routes
curl http://localhost:5000/projects
curl http://localhost:5000/milestones
```

### Test Load Balancing

```bash
# Gửi nhiều requests
for i in {1..10}; do
  curl http://localhost:5000/auth/health
  echo ""
done
```

---

## 6. Troubleshooting

### Lỗi: "Connection refused"

**Nguyên nhân:** Database chưa chạy

**Giải pháp:**
```bash
# Kiểm tra PostgreSQL
docker ps | grep postgres

# Nếu không có, start lại
docker-compose up postgres-auth postgres-project -d
```

### Lỗi: "401 Unauthorized"

**Nguyên nhân:** Token không hợp lệ hoặc hết hạn

**Giải pháp:**
1. Login lại để lấy token mới
2. Kiểm tra JWT secret trong appsettings.json
3. Đảm bảo thêm "Bearer " trước token

### Lỗi: "Database migration failed"

**Giải pháp:**
```bash
# Xóa database và tạo lại
docker-compose down -v
docker-compose up postgres-auth -d

# Chạy lại migration
cd services/AuthService/AuthService.API
dotnet ef database update --project ../AuthService.Infrastructure
```

### Lỗi: "Port already in use"

**Giải pháp:**
```bash
# Windows
netstat -ano | findstr :5001
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:5001 | xargs kill -9
```

### Lỗi: "Cannot find module"

**Giải pháp:**
```bash
# Restore lại packages
dotnet restore
dotnet clean
dotnet build
```

---

## 📊 Test Checklist

### AuthService
- [ ] Register user thành công
- [ ] Login thành công
- [ ] Get users với token
- [ ] Update user
- [ ] Change password
- [ ] Refresh token
- [ ] Logout

### ProjectService
- [ ] Create project (Lecturer)
- [ ] Get all projects
- [ ] Get project by ID
- [ ] Update project
- [ ] Submit for approval
- [ ] Approve project (Head Dept)
- [ ] Reject project
- [ ] Create milestone
- [ ] Complete milestone

### Docker
- [ ] All containers running
- [ ] Health checks passing
- [ ] Services accessible
- [ ] Database connections working

### API Gateway
- [ ] Routes working
- [ ] Authentication forwarding
- [ ] Load balancing

---

## 🎯 Test Scenarios

### Scenario 1: Complete Project Workflow

```bash
# 1. Register Lecturer
curl -X POST http://localhost:5001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"lecturer@test.com","password":"Test@123","fullName":"Lecturer","role":4}'

# 2. Login
TOKEN=$(curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"lecturer@test.com","password":"Test@123"}' \
  | jq -r '.data.token')

# 3. Create Project
PROJECT_ID=$(curl -X POST http://localhost:5003/api/projects \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Project","description":"Test","objectives":"Test"}' \
  | jq -r '.data.id')

# 4. Submit for Approval
curl -X POST http://localhost:5003/api/projects/$PROJECT_ID/submit \
  -H "Authorization: Bearer $TOKEN"

# 5. Register Head Department
curl -X POST http://localhost:5001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"head@test.com","password":"Test@123","fullName":"Head","role":3}'

# 6. Login as Head
HEAD_TOKEN=$(curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"head@test.com","password":"Test@123"}' \
  | jq -r '.data.token')

# 7. Approve Project
curl -X POST http://localhost:5003/api/projects/$PROJECT_ID/approve \
  -H "Authorization: Bearer $HEAD_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"comments":"Approved!"}'
```

---

## 📱 Test với Postman

### Import Collection

1. Tạo Collection mới: "CollabSphere"
2. Thêm Environment variables:
   - `base_url`: http://localhost:5001
   - `project_url`: http://localhost:5003
   - `token`: (sẽ set tự động)

### Pre-request Script (để auto set token)

```javascript
// Trong Login request, tab "Tests"
pm.test("Save token", function () {
    var jsonData = pm.response.json();
    pm.environment.set("token", jsonData.data.token);
});
```

### Authorization

Trong mỗi request cần auth:
- Type: Bearer Token
- Token: `{{token}}`

---

## 🔍 Monitoring

### Check Logs

```bash
# AuthService logs
docker logs -f collabsphere-auth-service

# ProjectService logs
docker logs -f collabsphere-project-service

# Database logs
docker logs -f collabsphere-postgres-auth
```

### Check Database

```bash
# Connect to database
docker exec -it collabsphere-postgres-auth psql -U postgres -d authdb

# List tables
\dt

# Check users
SELECT * FROM "Users";

# Exit
\q
```

---

## ✅ Kết Luận

Sau khi hoàn thành guide này, bạn đã:
- ✅ Biết cách chạy và test từng service
- ✅ Biết cách test với Docker
- ✅ Biết cách test API với Swagger và curl
- ✅ Biết cách troubleshoot các lỗi thường gặp
- ✅ Có thể test complete workflow

**Next Steps:**
1. Test các services còn lại khi implement xong
2. Viết automated tests (unit tests, integration tests)
3. Setup CI/CD pipeline
4. Deploy lên production

---

**Happy Testing! 🚀**
