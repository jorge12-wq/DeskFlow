namespace DeskFlow.Core.Interfaces;

public interface IEmailService
{
    Task EnviarTicketCreadoAsync(string destinatario, string nombreDestinatario,
        string numeroTicket, string asunto, string urlTicket);

    Task EnviarTicketAsignadoAsync(string destinatario, string nombreTecnico,
        string numeroTicket, string asunto, string urlTicket);

    Task EnviarNuevoComentarioAsync(string destinatario, string nombreDestinatario,
        string numeroTicket, string asunto, string autor, string comentario, string urlTicket);

    Task EnviarAlertaSLAAsync(string destinatario, string nombreDestinatario,
        string numeroTicket, string asunto, DateTime fechaLimite, bool esVencido);

    Task EnviarAsync(string destinatario, string nombreDestinatario, string asunto, string cuerpoHtml);
}
