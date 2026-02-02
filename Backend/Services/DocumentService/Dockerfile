# ==================== DocumentService Dockerfile ====================
# Multi-stage build for optimized production image

# Stage 1: Build
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy solution and project files first for better layer caching
COPY ["Services/DocumentService/DocumentService.csproj", "Services/DocumentService/"]
COPY ["Shared/Common/Common.csproj", "Shared/Common/"]
COPY ["Shared/EventBus/EventBus.csproj", "Shared/EventBus/"]

# Restore dependencies
RUN dotnet restore "Services/DocumentService/DocumentService.csproj"

# Copy all source files
COPY . .

# Build the project
WORKDIR "/src/Services/DocumentService"
RUN dotnet build "DocumentService.csproj" -c Release -o /app/build

# Stage 2: Publish
FROM build AS publish
RUN dotnet publish "DocumentService.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Stage 3: Runtime
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app

# Install curl for health checks
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Create non-root user for security
RUN groupadd -r appgroup && useradd -r -g appgroup appuser

# Create uploads directory
RUN mkdir -p /app/uploads && chown -R appuser:appgroup /app/uploads

# Copy published files
COPY --from=publish /app/publish .

# Set ownership
RUN chown -R appuser:appgroup /app

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 5003

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:5003/health || exit 1

# Set environment variables
ENV ASPNETCORE_URLS=http://+:5003
ENV ASPNETCORE_ENVIRONMENT=Production
ENV FileStorage__UploadPath=/app/uploads

# Entry point
ENTRYPOINT ["dotnet", "DocumentService.dll"]
