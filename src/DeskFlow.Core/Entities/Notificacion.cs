using DeskFlow.Core.Common;
using DeskFlow.Core.Enums;

namespace DeskFlow.Core.Entities;

public class Notificacion : TenantEntity
{
    public Guid UsuarioId { get; set; }
    public string Titulo { get; set; } = string.Empty;
    public string Mensaje { get; set; } = string.Empty;
    public TipoNotificacion Tipo { get; set; }
    public bool Leida { get; set; } = false;
    public Guid? TicketId { get; set; }
    public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;

    // Navigation
    public Tenant Tenant { get; set; } = null!;
    public Usuario Usuario { get; set; } = null!;
    public Ticket? Ticket { get; set; }
}
