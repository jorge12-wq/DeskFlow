using DeskFlow.Core.DTOs.Catalogo;
using DeskFlow.Core.DTOs.Tickets;

namespace DeskFlow.Core.Interfaces;

public interface ICatalogoService
{
    Task<IEnumerable<DepartamentoDto>> GetDepartamentosAsync();
    Task<IEnumerable<ServicioListItemDto>> GetServiciosAsync(Guid? departamentoId = null, bool soloPublicos = false);
    Task<ServicioDetalleDto> GetServicioByIdAsync(Guid id);
    Task<TicketDto> SolicitarServicioAsync(Guid servicioId, SolicitarServicioDto dto);
    Task<IEnumerable<RespuestaFormularioDto>> GetRespuestasFormularioAsync(Guid ticketId);
    Task<IEnumerable<TareaDto>> GetTareasTicketAsync(Guid ticketId);
    Task<TareaDto> CompletarTareaAsync(Guid tareaId);
}
