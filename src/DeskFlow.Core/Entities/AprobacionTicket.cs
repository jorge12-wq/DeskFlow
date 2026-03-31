using DeskFlow.Core.Common;

namespace DeskFlow.Core.Entities;

public class AprobacionTicket : TenantEntity
{
    public Guid TicketId { get; set; }
    public Guid? AprobadorId { get; set; }
    public EstadoAprobacion Estado { get; set; } = EstadoAprobacion.Pendiente;
    public string? Comentario { get; set; }
    public DateTime? FechaDecision { get; set; }
    public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;

    // Navigation
    public Ticket Ticket { get; set; } = null!;
    public Usuario? Aprobador { get; set; }
}

public enum EstadoAprobacion
{
    Pendiente = 0,
    Aprobado  = 1,
    Rechazado = 2
}
