using DeskFlow.Core.Common;

namespace DeskFlow.Core.Entities;

public class AuditLog : TenantEntity
{
    public Guid UsuarioId { get; set; }
    public string Accion { get; set; } = string.Empty; // Created, Updated, Deleted, Login, Logout
    public string Entidad { get; set; } = string.Empty; // Ticket, Usuario, etc.
    public Guid? EntidadId { get; set; }
    public string? DatosAnteriores { get; set; } // JSON
    public string? DatosNuevos { get; set; } // JSON
    public string? IP { get; set; }
    public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;

    public Tenant Tenant { get; set; } = null!;
    public Usuario Usuario { get; set; } = null!;
}
