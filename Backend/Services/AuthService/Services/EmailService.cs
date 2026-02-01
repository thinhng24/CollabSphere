using System.Net;
using System.Net.Mail;

public class EmailService
{
    public void SendReportEmail(string fromEmail, string subject, string message)
    {
        var mail = new MailMessage();
        mail.From = new MailAddress("system@gmail.com");
        mail.To.Add("admin@gmail.com");
        mail.Subject = "[System Report] " + subject;
        mail.Body = $"From: {fromEmail}\n\n{message}";

        var smtp = new SmtpClient("smtp.gmail.com", 587)
        {
            Credentials = new NetworkCredential(
                "system@gmail.com",
                "app-password"
            ),
            EnableSsl = true
        };

        smtp.Send(mail);
    }
}
