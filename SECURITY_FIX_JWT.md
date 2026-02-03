# Security Fix: Hardcoded JWT Secrets (Critical Issue #1)

## Summary

Fixed critical security vulnerability where JWT secrets and database passwords were hardcoded in configuration files and source code.

## Changes Made

### 1. Backend Configuration Files

#### Gateway (`Backend/gateway/appsettings.json`)
- **BEFORE**: JWT Secret was hardcoded: `"YourSuperSecretKeyForJWTTokenGeneration123456789"`
- **AFTER**: Empty string requiring environment variable or secure configuration

#### ProjectService (`Backend/services/ProjectService/ProjectService.API/appsettings.json`)
- **BEFORE**:
  - JWT Secret was hardcoded
  - Database password was hardcoded: `Password=postgres123`
  - RabbitMQ credentials were hardcoded
- **AFTER**: All sensitive values replaced with empty strings

### 2. Program.cs Validation

#### Gateway (`Backend/gateway/Program.cs`)
- **BEFORE**: Fallback values using null-coalescing operator (`??`)
```csharp
var jwtSecret = builder.Configuration["JwtSettings:Secret"] ?? "YourSuperSecretKeyForJWTTokenGeneration123456789";
```

- **AFTER**: Explicit validation with clear error messages
```csharp
var jwtSecret = builder.Configuration["JwtSettings:Secret"];
if (string.IsNullOrWhiteSpace(jwtSecret))
{
    throw new InvalidOperationException(
        "JWT Secret is required. Please set JwtSettings:Secret in appsettings.json or environment variable JWT_SECRET.");
}
```

#### ProjectService (`Backend/services/ProjectService/ProjectService.API/Program.cs`)
- Same validation pattern applied for JWT Secret, Issuer, and Audience

### 3. Docker Compose Configuration

Updated `docker-compose.yml` to use environment variables:

```yaml
environment:
  # Before: Hardcoded values
  - ConnectionStrings__DefaultConnection=Host=postgres-project;Port=5432;Database=projectdb;Username=postgres;Password=postgres123
  - RabbitMQ__Password=admin123

  # After: Environment variables
  - ConnectionStrings__DefaultConnection=Host=postgres-project;Port=5432;Database=${POSTGRES_DB:-projectdb};Username=${POSTGRES_USER:-postgres};Password=${POSTGRES_PASSWORD}
  - JwtSettings__Secret=${JWT_SECRET}
  - RabbitMQ__Username=${RABBITMQ_USER:-admin}
  - RabbitMQ__Password=${RABBITMQ_PASSWORD}
```

### 4. Environment Variable Template

Updated `.env.example` with:
- Clear documentation for required variables
- Instructions for generating secure secrets
- Placeholder values that must be changed

## How to Use

### Development Setup

1. **Copy the environment template:**
   ```bash
   cp .env.example .env
   ```

2. **Generate a strong JWT secret:**
   ```bash
   # Using OpenSSL (Linux/Mac/WSL)
   openssl rand -base64 32

   # Using PowerShell (Windows)
   [Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
   ```

3. **Edit `.env` file with your secure values:**
   ```env
   # REQUIRED: Set these values before running!
   JWT_SECRET=your_generated_secret_here_min_32_chars
   POSTGRES_PASSWORD=your_secure_postgres_password
   RABBITMQ_PASSWORD=your_secure_rabbitmq_password
   AWS_ACCESS_KEY=your_aws_access_key
   AWS_SECRET_KEY=your_aws_secret_key
   ```

4. **Start the application:**
   ```bash
   docker-compose up --build
   ```

### Production Deployment

For production, use secure secret management:

- **Azure**: Azure Key Vault
- **AWS**: AWS Secrets Manager or Parameter Store
- **Kubernetes**: Kubernetes Secrets
- **Docker Swarm**: Docker Secrets

**DO NOT** commit `.env` file to source control!

## Validation

The application will now fail to start if required secrets are not configured, with clear error messages:

```
Unhandled exception. System.InvalidOperationException: JWT Secret is required.
Please set JwtSettings:Secret in appsettings.json or environment variable JWT_SECRET.
```

This is intentional security-by-default behavior.

## Security Best Practices Applied

✅ **Fail-Fast**: Application refuses to start with missing secrets
✅ **No Fallbacks**: No default/demo credentials in production code
✅ **Clear Errors**: Helpful messages guide developers to proper configuration
✅ **Environment-Based**: Different secrets for dev/staging/production
✅ **Documentation**: Clear instructions in `.env.example`

## Testing the Fix

### 1. Verify Validation Works

Try starting without environment variables:
```bash
docker-compose up gateway
```

Expected: Service should fail with clear error message about missing JWT_SECRET.

### 2. Verify With Proper Configuration

```bash
# Set environment variables
export JWT_SECRET="your_secure_random_secret_min_32_characters"
export POSTGRES_PASSWORD="secure_postgres_pwd"
export RABBITMQ_PASSWORD="secure_rabbitmq_pwd"

# Start services
docker-compose up --build
```

Expected: Services start successfully.

## Files Modified

- `Backend/gateway/appsettings.json`
- `Backend/gateway/Program.cs`
- `Backend/services/ProjectService/ProjectService.API/appsettings.json`
- `Backend/services/ProjectService/ProjectService.API/appsettings.Development.json`
- `Backend/services/ProjectService/ProjectService.API/Program.cs`
- `docker-compose.yml`
- `.env.example`

## Next Steps

To complete the security hardening:

1. **Fix Critical Issue #2**: Remove hardcoded database passwords (partially done)
2. **Fix Critical Issue #3**: Restrict CORS policy for production
3. **Add GitHub Secret Scanning**: Prevent accidental secret commits
4. **Document Rotation**: Add secret rotation procedures
5. **Add Health Checks**: Verify secrets are loaded correctly at startup

## References

- [OWASP: Secrets Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)
- [Microsoft: Safe Storage of App Secrets](https://learn.microsoft.com/en-us/aspnet/core/security/app-secrets)
- [Docker: Use Docker Secrets](https://docs.docker.com/engine/swarm/secrets/)
