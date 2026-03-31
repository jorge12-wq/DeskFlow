using DeskFlow.Core.DTOs.AuditLogs;
using DeskFlow.Core.DTOs.Tickets;

namespace DeskFlow.Core.Interfaces;

public interface IAuditLogService
{
    Task RegistrarAsync(string accion, string entidad, Guid? entidadId, string? ip = null, string? datosAnteriores = null, string? datosNuevos = null);
    Task<PagedResultDto<AuditLogDto>> GetPagedAsync(string? entidad, Guid? entidadId, int pagina, int porPagina);
}
