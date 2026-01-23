using MassTransit;
using CollabSphere.Consumers;

var builder = Host.CreateApplicationBuilder(args);

builder.Services.AddMassTransit(x =>
{
    // Đăng ký TẤT CẢ Consumer có trong thư mục Consumers cùng lúc
    x.AddConsumers(typeof(NotificationConsumer).Assembly);

    x.UsingRabbitMq((context, cfg) =>
    {
        cfg.Host("localhost", "/", h => {
            h.Username("guest");
            h.Password("guest");
        });

        // Tự động thiết lập Queue dựa trên tên của các Consumer
        cfg.ConfigureEndpoints(context);
    });
});

var host = builder.Build();
host.Run();