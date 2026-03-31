using DeskFlow.Core.Common;

namespace DeskFlow.Core.Entities;

public class Usuario : TenantEntity
{
    public Guid RolId { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string Apellido { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public Guid? SucursalId { get; set; }
    public Guid? AreaId { get; set; }
    public bool Activo { get; set; } = true;
    public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;
    public string? RefreshToken { get; set; }
    public DateTime? RefreshTokenExpiry { get; set; }

    // Navigation
    public Tenant Tenant { get; set; } = null!;
    public Rol Rol { get; set; } = null!;
    public Sucursal? Sucursal { get; set; }
    public Area? Area { get; set; }
    public ICollection<Ticket> TicketsCreados { get; set; } = new List<Ticket>();
    public ICollection<Ticket> TicketsAsignados { get; set; } = new List<Ticket>();
    public ICollection<Ticket> TicketsSupervisados { get; set; } = new List<Ticket>();
    public ICollection<ComentarioTicket> Comentarios { get; set; } = new List<ComentarioTicket>();
    public ICollection<HistorialTicket> Historial { get; set; } = new List<HistorialTicket>();
}
