using DeskFlow.Core.Common;

namespace DeskFlow.Core.Entities;

public class SLAConfiguracion : TenantEntity
{
    public Guid PrioridadId { get; set; }
    public Guid? CategoriaId { get; set; }
    public int TiempoRespuesta_Horas { get; set; }
    public int TiempoResolucion_Horas { get; set; }

    // Navigation
    public Tenant Tenant { get; set; } = null!;
    public Prioridad Prioridad { get; set; } = null!;
    public Categoria? Categoria { get; set; }
}
