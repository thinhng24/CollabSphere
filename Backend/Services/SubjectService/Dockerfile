FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 8080

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy shared projects
COPY ["shared/SharedKernel/SharedKernel.csproj", "shared/SharedKernel/"]

# Copy SubjectService projects
COPY ["services/SubjectService/SubjectService.API/SubjectService.API.csproj", "services/SubjectService/SubjectService.API/"]
COPY ["services/SubjectService/SubjectService.Application/SubjectService.Application.csproj", "services/SubjectService/SubjectService.Application/"]
COPY ["services/SubjectService/SubjectService.Domain/SubjectService.Domain.csproj", "services/SubjectService/SubjectService.Domain/"]
COPY ["services/SubjectService/SubjectService.Infrastructure/SubjectService.Infrastructure.csproj", "services/SubjectService/SubjectService.Infrastructure/"]

# Restore dependencies
RUN dotnet restore "services/SubjectService/SubjectService.API/SubjectService.API.csproj"

# Copy all source files
COPY shared/ shared/
COPY services/SubjectService/ services/SubjectService/

# Build
WORKDIR "/src/services/SubjectService/SubjectService.API"
RUN dotnet build "SubjectService.API.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "SubjectService.API.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "SubjectService.API.dll"]
