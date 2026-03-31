using DeskFlow.Core.Common;

namespace DeskFlow.Core.Entities;

public class Prioridad : TenantEntity
{
    public string Nombre { get; set; } = string.Empty;
    public string Color { get; set; } = "#gray";
    public int TiempoRespuestaSLA_Horas { get; set; }
    public int TiempoResolucionSLA_Horas { get; set; }
    public int Orden { get; set; }

    // Navigation
    public Tenant Tenant { get; set; } = null!;
    public ICollection<Ticket> Tickets { get; set; } = new List<Ticket>();
    public ICollection<SLAConfiguracion> SLAConfiguraciones { get; set; } = new List<SLAConfiguracion>();
}
