using MassTransit;
using System;
using System.Collections.Generic;
using System.Text;
using CollabSphere.Shared.Contracts;
using Microsoft.Extensions.Logging;

namespace CollabSphere.Consumers;

public class MediaConsumer : IConsumer<IMediaProcessingEvent>
{
    private readonly ILogger<MediaConsumer> _logger;

    public MediaConsumer(ILogger<MediaConsumer> logger)
    {
        _logger = logger;
    }

    public async Task Consume(ConsumeContext<IMediaProcessingEvent> context)
    {
        var data = context.Message;

        _logger.LogInformation("[Media Worker] Đang nhận tệp tin: {FileId}", data.FileId);
        _logger.LogInformation("[Media Worker] Đường dẫn gốc: {RawUrl}", data.RawUrl);
        _logger.LogInformation("[Media Worker] Chế độ xử lý: {ProcessType}", data.ProcessType);

        // Giả lập logic xử lý nặng (ví dụ: Nén ảnh hoặc tạo Thumbnail)
        try
        {
            _logger.LogInformation("--- Đang tiến hành nén tệp và tối ưu dung lượng... ---");
            await Task.Delay(3000); // Giả lập xử lý mất 3 giây
            _logger.LogInformation("[Media Worker] HOÀN THÀNH: Tệp {FileId} đã sẵn sàng phục vụ.", data.FileId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[Media Worker] LỖI khi xử lý tệp {FileId}", data.FileId);
        }
    }
}
