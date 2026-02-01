using SyllabusService.Data;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// ================= DB =================
builder.Services.AddDbContext<SyllabusDbContext>(options =>
    options.UseSqlServer(
        builder.Configuration.GetConnectionString("DefaultConnection")));

// ================= Services =================
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// ================= Middleware =================
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// ⚠️ Tạm tắt HTTPS khi dev nếu chưa cấu hình SSL
// app.UseHttpsRedirection();

app.MapControllers();

app.Run();
