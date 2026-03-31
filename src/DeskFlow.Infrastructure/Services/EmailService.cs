using DeskFlow.Core.Interfaces;
using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using MimeKit;

namespace DeskFlow.Infrastructure.Services;

public class EmailService : IEmailService
{
    private readonly IConfiguration _config;
    private readonly ILogger<EmailService> _logger;

    public EmailService(IConfiguration config, ILogger<EmailService> logger)
    {
        _config = config;
        _logger = logger;
    }

    public async Task EnviarTicketCreadoAsync(string destinatario, string nombreDestinatario,
        string numeroTicket, string asunto, string urlTicket)
    {
        var cuerpo = $@"
<h2>Nuevo ticket creado</h2>
<p>Hola <strong>{nombreDestinatario}</strong>,</p>
<p>Se ha creado el ticket <strong>{numeroTicket}</strong>: {asunto}</p>
<p><a href=""{urlTicket}"">Ver ticket</a></p>";

        await EnviarAsync(destinatario, nombreDestinatario, $"Ticket creado: {numeroTicket}", cuerpo);
    }

    public async Task EnviarTicketAsignadoAsync(string destinatario, string nombreTecnico,
        string numeroTicket, string asunto, string urlTicket)
    {
        var cuerpo = $@"
<h2>Ticket asignado</h2>
<p>Hola <strong>{nombreTecnico}</strong>,</p>
<p>Se te ha asignado el ticket <strong>{numeroTicket}</strong>: {asunto}</p>
<p><a href=""{urlTicket}"">Ver ticket</a></p>";

        await EnviarAsync(destinatario, nombreTecnico, $"Ticket asignado: {numeroTicket}", cuerpo);
    }

    public async Task EnviarNuevoComentarioAsync(string destinatario, string nombreDestinatario,
        string numeroTicket, string asunto, string autor, string comentario, string urlTicket)
    {
        var cuerpo = $@"
<h2>Nuevo comentario en ticket</h2>
<p>Hola <strong>{nombreDestinatario}</strong>,</p>
<p><strong>{autor}</strong> comentó en el ticket <strong>{numeroTicket}</strong>: {asunto}</p>
<blockquote>{comentario}</blockquote>
<p><a href=""{urlTicket}"">Ver ticket</a></p>";

        await EnviarAsync(destinatario, nombreDestinatario, $"Nuevo comentario: {numeroTicket}", cuerpo);
    }

    public async Task EnviarAlertaSLAAsync(string destinatario, string nombreDestinatario,
        string numeroTicket, string asunto, DateTime fechaLimite, bool esVencido)
    {
        var titulo = esVencido ? $"SLA vencido: {numeroTicket}" : $"SLA en riesgo: {numeroTicket}";
        var estadoTexto = esVencido ? "ha vencido" : "está por vencer";
        var cuerpo = $@"
<h2>Alerta de SLA</h2>
<p>Hola <strong>{nombreDestinatario}</strong>,</p>
<p>El ticket <strong>{numeroTicket}</strong> ({asunto}) {estadoTexto}.</p>
<p>Fecha límite: <strong>{fechaLimite:dd/MM/yyyy HH:mm}</strong> UTC</p>";

        await EnviarAsync(destinatario, nombreDestinatario, titulo, cuerpo);
    }

    public async Task EnviarAsync(string destinatario, string nombreDestinatario, string asunto, string cuerpoHtml)
    {
        var emailConfig = _config.GetSection("Email");
        var smtpHost = emailConfig["SmtpHost"];

        if (string.IsNullOrWhiteSpace(smtpHost))
        {
            _logger.LogWarning("Email no configurado. Omitiendo envío a {Destinatario}: {Asunto}", destinatario, asunto);
            return;
        }

        try
        {
            var message = new MimeMessage();
            message.From.Add(new MailboxAddress(
                emailConfig["SenderName"] ?? "DeskFlow",
                emailConfig["SenderEmail"] ?? "noreply@deskflow.local"));
            message.To.Add(new MailboxAddress(nombreDestinatario, destinatario));
            message.Subject = asunto;

            var builder = new BodyBuilder { HtmlBody = cuerpoHtml };
            message.Body = builder.ToMessageBody();

            using var client = new SmtpClient();
            var port = int.Parse(emailConfig["SmtpPort"] ?? "587");
            var useSsl = bool.Parse(emailConfig["UseSsl"] ?? "false");
            var secureSocketOptions = useSsl ? SecureSocketOptions.SslOnConnect : SecureSocketOptions.StartTlsWhenAvailable;

            await client.ConnectAsync(smtpHost, port, secureSocketOptions);

            var user = emailConfig["SmtpUser"];
            var pass = emailConfig["SmtpPassword"];
            if (!string.IsNullOrWhiteSpace(user))
                await client.AuthenticateAsync(user, pass);

            await client.SendAsync(message);
            await client.DisconnectAsync(true);

            _logger.LogInformation("Email enviado a {Destinatario}: {Asunto}", destinatario, asunto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error enviando email a {Destinatario}: {Asunto}", destinatario, asunto);
        }
    }
}
