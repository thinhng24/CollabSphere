using AuthService.Data;
using Microsoft.AspNetCore.Mvc;
using System;

[ApiController]
[Route("api/reports")]
public class ReportController : ControllerBase
{
    private readonly AuthDbContext _context;
    private readonly EmailService _emailService;

    public ReportController(AuthDbContext context, EmailService emailService)
    {
        _context = context;
        _emailService = emailService;
    }

    // 🔵 User gửi report
    [HttpPost]
    public async Task<IActionResult> CreateReport(CreateReportRequest request)
    {
        var report = new Report
        {
            Email = request.Email,
            Subject = request.Subject,
            Message = request.Message
        };

        _context.Reports.Add(report);
        await _context.SaveChangesAsync();

        _emailService.SendReportEmail(
            request.Email,
            request.Subject,
            request.Message
        );

        return Ok(new { message = "Report sent successfully" });
    }
}
