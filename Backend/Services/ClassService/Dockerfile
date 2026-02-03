FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 8080

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy shared projects
COPY ["shared/SharedKernel/SharedKernel.csproj", "shared/SharedKernel/"]

# Copy ClassService projects
COPY ["services/ClassService/ClassService.API/ClassService.API.csproj", "services/ClassService/ClassService.API/"]
COPY ["services/ClassService/ClassService.Application/ClassService.Application.csproj", "services/ClassService/ClassService.Application/"]
COPY ["services/ClassService/ClassService.Domain/ClassService.Domain.csproj", "services/ClassService/ClassService.Domain/"]
COPY ["services/ClassService/ClassService.Infrastructure/ClassService.Infrastructure.csproj", "services/ClassService/ClassService.Infrastructure/"]

# Restore dependencies
RUN dotnet restore "services/ClassService/ClassService.API/ClassService.API.csproj"

# Copy all source files
COPY shared/ shared/
COPY services/ClassService/ services/ClassService/

# Build
WORKDIR "/src/services/ClassService/ClassService.API"
RUN dotnet build "ClassService.API.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "ClassService.API.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "ClassService.API.dll"]
