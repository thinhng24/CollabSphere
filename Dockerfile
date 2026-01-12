FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 80

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["src/CollabSphere.Api/CollabSphere.Api.csproj", "CollabSphere.Api/"]
RUN dotnet restore "CollabSphere.Api/CollabSphere.Api.csproj"
COPY src/CollabSphere.Api/. CollabSphere.Api/
WORKDIR "/src/CollabSphere.Api"
RUN dotnet build "CollabSphere.Api.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "CollabSphere.Api.csproj" -c Release -o /app/publish

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "CollabSphere.Api.dll"]