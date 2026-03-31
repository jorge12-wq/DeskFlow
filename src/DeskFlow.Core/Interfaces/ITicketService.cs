using DeskFlow.Core.DTOs.Tickets;

namespace DeskFlow.Core.Interfaces;

public interface ITicketService
{
    Task<TicketDto> GetByIdAsync(Guid id);
    Task<PagedResultDto<TicketListItemDto>> GetPagedAsync(TicketFilterDto filter);
    Task<TicketDto> CreateAsync(CreateTicketDto dto);
    Task<TicketDto> UpdateAsync(Guid id, UpdateTicketDto dto);
    Task<TicketDto> CambiarEstadoAsync(Guid id, CambiarEstadoDto dto);
    Task<TicketDto> AsignarTecnicoAsync(Guid id, AsignarTecnicoDto dto);
    Task<ComentarioDto> AgregarComentarioAsync(Guid ticketId, CreateComentarioDto dto);
    Task<IEnumerable<ComentarioDto>> GetComentariosAsync(Guid ticketId);
    Task<IEnumerable<HistorialDto>> GetHistorialAsync(Guid ticketId);
    Task<TicketDto> TomarTicketAsync(Guid id);
    Task<TicketDto> SetSlaAsync(Guid id, DateTime fechaLimite, string? comentario);
    Task<TicketDto> EscalarAsync(Guid id, string? motivo);
    Task<MiTrabajoStatsDto> GetMiTrabajoStatsAsync();
    Task<TicketDto> PonerEnEsperaAsync(Guid id, PonerEnEsperaDto dto);
    Task<TicketDto> ReanudarEsperaAsync(Guid id, ReanudarEsperaDto dto);
    Task<IEnumerable<MotivoEsperaDto>> GetMotivosEsperaAsync(Guid? helpDeskId);
}
