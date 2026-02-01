using Microsoft.EntityFrameworkCore;
using SubjectService.Data;
using SubjectService.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<SubjectDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddScoped<SubjectImportService>();
builder.Services.AddControllers();

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    // CHIÊU CUỐI: Cấu hình Swagger mà không dùng đến class OpenApiInfo 
    // để tránh hoàn toàn việc gọi đến namespace Microsoft.OpenApi.Models
    c.SwaggerDoc("v1", new() { Title = "Subject Service API", Version = "v1" });
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "v1");
        c.RoutePrefix = "swagger";
    });
}

app.UseHttpsRedirection();
app.MapControllers();
app.Run();