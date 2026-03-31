using DeskFlow.Core.Common;

namespace DeskFlow.Core.Entities;

public class HelpDesk : TenantEntity
{
    public string Nombre { get; set; } = string.Empty;
    public string? Descripcion { get; set; }
    public string? Icono { get; set; }
    public string Color { get; set; } = "#3B82F6";
    public bool Activo { get; set; } = true;
    public int Orden { get; set; }
    public bool EsPublico { get; set; } = true;
    public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;

    // Navigation
    public Tenant Tenant { get; set; } = null!;
    public ICollection<HelpDeskAgente> Agentes { get; set; } = new List<HelpDeskAgente>();
    public ICollection<Ticket> Tickets { get; set; } = new List<Ticket>();
    public ICollection<Categoria> Categorias { get; set; } = new List<Categoria>();
}

public class HelpDeskAgente : TenantEntity
{
    public Guid HelpDeskId { get; set; }
    public Guid UsuarioId { get; set; }
    public bool EsResponsable { get; set; }
    public DateTime FechaAsignacion { get; set; } = DateTime.UtcNow;

    // Navigation
    public Tenant Tenant { get; set; } = null!;
    public HelpDesk HelpDesk { get; set; } = null!;
    public Usuario Usuario { get; set; } = null!;
}
