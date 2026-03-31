using DeskFlow.Core.DTOs.Aprobaciones;
using DeskFlow.Core.DTOs.Tickets;

namespace DeskFlow.Core.Interfaces;

public interface IAprobacionService
{
    Task<AprobacionDto> SolicitarAprobacionAsync(Guid ticketId, string? comentario);
    Task<TicketDto> DecidirAsync(Guid aprobacionId, bool aprobado, string? comentario);
    Task<IEnumerable<AprobacionDto>> GetPendientesAsync();
    Task<IEnumerable<AprobacionDto>> GetHistorialAsync();
}
