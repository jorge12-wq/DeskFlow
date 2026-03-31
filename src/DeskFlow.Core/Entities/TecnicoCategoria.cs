using DeskFlow.Core.Common;

namespace DeskFlow.Core.Entities;

public class TecnicoCategoria : TenantEntity
{
    public Guid TecnicoId { get; set; }
    public Guid CategoriaId { get; set; }

    // Navigation
    public Tenant Tenant { get; set; } = null!;
    public Usuario Tecnico { get; set; } = null!;
    public Categoria Categoria { get; set; } = null!;
}
