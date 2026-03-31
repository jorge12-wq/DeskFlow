using DeskFlow.Core.Common;

namespace DeskFlow.Core.Entities;

public class Sucursal : TenantEntity
{
    public string Nombre { get; set; } = string.Empty;
    public string? Direccion { get; set; }
    public bool Activo { get; set; } = true;

    // Navigation
    public Tenant Tenant { get; set; } = null!;
    public ICollection<Usuario> Usuarios { get; set; } = new List<Usuario>();
    public ICollection<Ticket> Tickets { get; set; } = new List<Ticket>();
}
