FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 8080

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy shared projects
COPY ["shared/SharedKernel/SharedKernel.csproj", "shared/SharedKernel/"]
COPY ["shared/EventBus/EventBus.csproj", "shared/EventBus/"]

# Copy AuthService projects
COPY ["services/AuthService/AuthService.API/AuthService.API.csproj", "services/AuthService/AuthService.API/"]
COPY ["services/AuthService/AuthService.Application/AuthService.Application.csproj", "services/AuthService/AuthService.Application/"]
COPY ["services/AuthService/AuthService.Domain/AuthService.Domain.csproj", "services/AuthService/AuthService.Domain/"]
COPY ["services/AuthService/AuthService.Infrastructure/AuthService.Infrastructure.csproj", "services/AuthService/AuthService.Infrastructure/"]

# Restore dependencies
RUN dotnet restore "services/AuthService/AuthService.API/AuthService.API.csproj"

# Copy all source files
COPY shared/ shared/
COPY services/AuthService/ services/AuthService/

# Build
WORKDIR "/src/services/AuthService/AuthService.API"
RUN dotnet build "AuthService.API.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "AuthService.API.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "AuthService.API.dll"]
