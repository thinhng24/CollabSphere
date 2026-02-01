using Ocelot.DependencyInjection;
using Ocelot.Middleware;

var builder = WebApplication.CreateBuilder(args);

// Cấu hình để nạp file ocelot.json
builder.Configuration.AddJsonFile("ocelot.json", optional: false, reloadOnChange: true);

// Đăng ký dịch vụ Ocelot
builder.Services.AddOcelot();

var app = builder.Build();

// Sử dụng Ocelot Middleware
await app.UseOcelot();

app.Run();