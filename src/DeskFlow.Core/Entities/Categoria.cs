using DeskFlow.Core.Common;

namespace DeskFlow.Core.Entities;

public class Categoria : TenantEntity
{
    public string Nombre { get; set; } = string.Empty;
    public string? Descripcion { get; set; }
    public string? Icono { get; set; }
    public bool Activo { get; set; } = true;
    public Guid? HelpDeskId { get; set; }

    // Navigation
    public Tenant Tenant { get; set; } = null!;
    public HelpDesk? HelpDesk { get; set; }
    public ICollection<Subcategoria> Subcategorias { get; set; } = new List<Subcategoria>();
    public ICollection<Ticket> Tickets { get; set; } = new List<Ticket>();
    public ICollection<SLAConfiguracion> SLAConfiguraciones { get; set; } = new List<SLAConfiguracion>();
}

public class Subcategoria : TenantEntity
{
    public Guid CategoriaId { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string? Descripcion { get; set; }
    public bool Activo { get; set; } = true;

    // Navigation
    public Tenant Tenant { get; set; } = null!;
    public Categoria Categoria { get; set; } = null!;
    public ICollection<Ticket> Tickets { get; set; } = new List<Ticket>();
}
