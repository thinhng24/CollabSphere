# ==================== ChatService Dockerfile ====================
# Multi-stage build for optimized production image

# Stage 1: Build
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy all project files first
COPY ["Services/ChatService/ChatService.csproj", "Services/ChatService/"]
COPY ["Shared/Common/Common.csproj", "Shared/Common/"]
COPY ["Shared/EventBus/EventBus.csproj", "Shared/EventBus/"]

# Restore dependencies
RUN dotnet restore "Services/ChatService/ChatService.csproj"

# Copy all source files
COPY . .

# Build the project
WORKDIR "/src/Services/ChatService"
RUN dotnet build "ChatService.csproj" -c Release -o /app/build

# Stage 2: Publish
FROM build AS publish
WORKDIR "/src/Services/ChatService"
RUN dotnet publish "ChatService.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Stage 3: Runtime
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app

# Install curl for health checks
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Create non-root user for security
RUN groupadd -r appgroup && useradd -r -g appgroup appuser

# Copy published files
COPY --from=publish /app/publish .

# Set ownership
RUN chown -R appuser:appgroup /app

# Switch to non-root user
USER appuser

EXPOSE 5002

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:5002/health || exit 1

ENV ASPNETCORE_URLS=http://+:5002
ENV ASPNETCORE_ENVIRONMENT=Production

ENTRYPOINT ["dotnet", "ChatService.dll"]
