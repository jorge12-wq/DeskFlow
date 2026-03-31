using DeskFlow.Core.Common;

namespace DeskFlow.Core.Entities;

public class PermisoModulo : TenantEntity
{
    public Guid RolId { get; set; }
    public string ModuloClave { get; set; } = string.Empty;
    public bool Activo { get; set; } = true;

    public Rol Rol { get; set; } = null!;
    public Tenant Tenant { get; set; } = null!;
}
