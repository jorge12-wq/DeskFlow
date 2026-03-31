using DeskFlow.Core.Common;

namespace DeskFlow.Core.Entities;

public class Etiqueta : TenantEntity
{
    public string Nombre { get; set; } = string.Empty;
    public string Color { get; set; } = "#6366f1"; // hex color
    public bool Activo { get; set; } = true;

    public Tenant Tenant { get; set; } = null!;
    public ICollection<TicketEtiqueta> TicketEtiquetas { get; set; } = new List<TicketEtiqueta>();
}

public class TicketEtiqueta : BaseEntity
{
    public Guid TicketId { get; set; }
    public Guid EtiquetaId { get; set; }

    public Ticket Ticket { get; set; } = null!;
    public Etiqueta Etiqueta { get; set; } = null!;
}
