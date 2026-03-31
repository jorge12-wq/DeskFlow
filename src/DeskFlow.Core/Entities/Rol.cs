using DeskFlow.Core.Common;

namespace DeskFlow.Core.Entities;

public class Rol : TenantEntity
{
    public string Nombre { get; set; } = string.Empty;
    public string? Descripcion { get; set; }

    // Navigation
    public Tenant Tenant { get; set; } = null!;
    public ICollection<Usuario> Usuarios { get; set; } = new List<Usuario>();
}
