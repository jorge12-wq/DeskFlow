using DeskFlow.Core.Common;

namespace DeskFlow.Core.Entities;

public class Area : TenantEntity
{
    public string Nombre { get; set; } = string.Empty;
    public string? Descripcion { get; set; }
    public bool Activo { get; set; } = true;
    /// <summary>Help desk asociado a esta área. Los agentes del área solo ven tickets de este portal.</summary>
    public Guid? HelpDeskId { get; set; }

    // Navigation
    public Tenant Tenant { get; set; } = null!;
    public HelpDesk? HelpDesk { get; set; }
    public ICollection<Usuario> Usuarios { get; set; } = new List<Usuario>();
    public ICollection<Ticket> Tickets { get; set; } = new List<Ticket>();
}
