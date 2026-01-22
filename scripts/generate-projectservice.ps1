# PowerShell Script to Generate Complete ProjectService
Write-Host "🚀 Generating ProjectService..." -ForegroundColor Green

$baseDir = "CollabSphere/services/ProjectService"

# Create all directories
$directories = @(
    "$baseDir/ProjectService.Domain/Entities",
    "$baseDir/ProjectService.Application/DTOs",
    "$baseDir/ProjectService.Application/Interfaces",
    "$baseDir/ProjectService.Application/Services",
    "$baseDir/ProjectService.Infrastructure/Data",
    "$baseDir/ProjectService.Infrastructure/Repositories",
    "$baseDir/ProjectService.API/Controllers"
)

foreach ($dir in $directories) {
    New-Item -ItemType Directory -Force -Path $dir | Out-Null
}

Write-Host "✅ Directories created" -ForegroundColor Green

# Generate all files with content
Write-Host "📝 Generating files..." -ForegroundColor Yellow

# Copy from COMPLETE_CODE.md and create actual files
# This is a template - you need to manually copy code from COMPLETE_CODE.md

Write-Host @"

📋 Next Steps:
1. Open COMPLETE_CODE.md in ProjectService folder
2. Copy each code block to corresponding file
3. Run: cd services/ProjectService/ProjectService.API
4. Run: dotnet ef migrations add InitialCreate --project ../ProjectService.Infrastructure
5. Run: dotnet ef database update --project ../ProjectService.Infrastructure
6. Run: dotnet run

Or use Docker:
docker-compose up project-service --build

"@ -ForegroundColor Cyan

Write-Host "✅ ProjectService structure ready!" -ForegroundColor Green
