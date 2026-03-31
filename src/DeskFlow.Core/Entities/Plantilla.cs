using DeskFlow.Core.Common;

namespace DeskFlow.Core.Entities;

public class Plantilla : TenantEntity
{
    public string Nombre { get; set; } = string.Empty;
    public string Contenido { get; set; } = string.Empty;
    public Guid? CategoriaId { get; set; }
    public Guid CreadoPorId { get; set; }
    public bool Activo { get; set; } = true;
    public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;

    // Navigation
    public Tenant Tenant { get; set; } = null!;
    public Categoria? Categoria { get; set; }
    public Usuario CreadoPor { get; set; } = null!;
}
