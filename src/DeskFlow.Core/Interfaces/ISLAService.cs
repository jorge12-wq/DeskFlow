using DeskFlow.Core.Entities;

namespace DeskFlow.Core.Interfaces;

public interface ISLAService
{
    /// <summary>Calcula FechaLimiteSLA usando SLAConfiguracion (prioridad+categoría) o fallback a prioridad.</summary>
    Task<DateTime> CalcularFechaLimiteAsync(Guid tenantId, Guid prioridadId, Guid categoriaId);

    /// <summary>Verifica y actualiza el SLAEstado de todos los tickets activos. Llamado por el background service.</summary>
    Task VerificarSLAAsync();

    /// <summary>Pausa el cómputo SLA (ticket pendiente).</summary>
    Task PausarSLAAsync(Ticket ticket);

    /// <summary>Reanuda el cómputo SLA exteniendo FechaLimiteSLA por el tiempo pausado.</summary>
    Task ReanudarSLAAsync(Ticket ticket);
}
