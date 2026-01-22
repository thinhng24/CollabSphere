FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 8080

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy shared projects
COPY ["shared/SharedKernel/SharedKernel.csproj", "shared/SharedKernel/"]
COPY ["shared/EventBus/EventBus.csproj", "shared/EventBus/"]

# Copy ProjectService projects
COPY ["services/ProjectService/ProjectService.API/ProjectService.API.csproj", "services/ProjectService/ProjectService.API/"]
COPY ["services/ProjectService/ProjectService.Application/ProjectService.Application.csproj", "services/ProjectService/ProjectService.Application/"]
COPY ["services/ProjectService/ProjectService.Domain/ProjectService.Domain.csproj", "services/ProjectService/ProjectService.Domain/"]
COPY ["services/ProjectService/ProjectService.Infrastructure/ProjectService.Infrastructure.csproj", "services/ProjectService/ProjectService.Infrastructure/"]

# Restore dependencies
RUN dotnet restore "services/ProjectService/ProjectService.API/ProjectService.API.csproj"

# Copy all source files
COPY shared/ shared/
COPY services/ProjectService/ services/ProjectService/

# Build
WORKDIR "/src/services/ProjectService/ProjectService.API"
RUN dotnet build "ProjectService.API.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "ProjectService.API.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "ProjectService.API.dll"]
