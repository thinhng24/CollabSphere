FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 8080

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy shared projects
COPY ["shared/SharedKernel/SharedKernel.csproj", "shared/SharedKernel/"]

# Copy TeamService projects
COPY ["services/TeamService/TeamService.API/TeamService.API.csproj", "services/TeamService/TeamService.API/"]
COPY ["services/TeamService/TeamService.Application/TeamService.Application.csproj", "services/TeamService/TeamService.Application/"]
COPY ["services/TeamService/TeamService.Domain/TeamService.Domain.csproj", "services/TeamService/TeamService.Domain/"]
COPY ["services/TeamService/TeamService.Infrastructure/TeamService.Infrastructure.csproj", "services/TeamService/TeamService.Infrastructure/"]

# Restore dependencies
RUN dotnet restore "services/TeamService/TeamService.API/TeamService.API.csproj"

# Copy all source files
COPY shared/ shared/
COPY services/TeamService/ services/TeamService/

# Build
WORKDIR "/src/services/TeamService/TeamService.API"
RUN dotnet build "TeamService.API.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "TeamService.API.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "TeamService.API.dll"]
