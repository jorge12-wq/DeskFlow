using DeskFlow.Core.Enums;

namespace DeskFlow.Core.DTOs.Notificaciones;

public class NotificacionDto
{
    public Guid Id { get; set; }
    public string Titulo { get; set; } = string.Empty;
    public string Mensaje { get; set; } = string.Empty;
    public TipoNotificacion Tipo { get; set; }
    public bool Leida { get; set; }
    public Guid? TicketId { get; set; }
    public string? TicketNumero { get; set; }
    public DateTime FechaCreacion { get; set; }
}
