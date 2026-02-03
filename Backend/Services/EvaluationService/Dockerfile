FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 5009

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy shared projects
COPY ["shared/SharedKernel/SharedKernel.csproj", "shared/SharedKernel/"]

# Copy EvaluationService projects
COPY ["services/EvaluationService/EvaluationService.API/EvaluationService.API.csproj", "services/EvaluationService/EvaluationService.API/"]
COPY ["services/EvaluationService/EvaluationService.Application/EvaluationService.Application.csproj", "services/EvaluationService/EvaluationService.Application/"]
COPY ["services/EvaluationService/EvaluationService.Domain/EvaluationService.Domain.csproj", "services/EvaluationService/EvaluationService.Domain/"]
COPY ["services/EvaluationService/EvaluationService.Infrastructure/EvaluationService.Infrastructure.csproj", "services/EvaluationService/EvaluationService.Infrastructure/"]

# Restore dependencies
RUN dotnet restore "services/EvaluationService/EvaluationService.API/EvaluationService.API.csproj"

# Copy all source files
COPY shared/ shared/
COPY services/EvaluationService/ services/EvaluationService/

# Build
WORKDIR "/src/services/EvaluationService/EvaluationService.API"
RUN dotnet build "EvaluationService.API.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "EvaluationService.API.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "EvaluationService.API.dll"]
