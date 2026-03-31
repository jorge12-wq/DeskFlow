using DeskFlow.Core.Common;

namespace DeskFlow.Core.Entities;

public class ConocimientoAdjunto : TenantEntity
{
    public Guid ArticuloId { get; set; }
    public string NombreOriginal { get; set; } = string.Empty;
    public string RutaAlmacenada { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public long TamanoBytes { get; set; }
    public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;

    public BaseConocimiento Articulo { get; set; } = null!;
    public Tenant Tenant { get; set; } = null!;
}
