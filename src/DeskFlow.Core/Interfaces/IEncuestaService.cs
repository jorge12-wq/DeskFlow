using DeskFlow.Core.DTOs.Encuestas;

namespace DeskFlow.Core.Interfaces;

public interface IEncuestaService
{
    Task CrearEncuestaPendienteAsync(Guid ticketId, Guid usuarioId, Guid? tecnicoId);
    Task<IEnumerable<EncuestaPendienteDto>> GetPendientesAsync();
    Task<EncuestaRespuestaDto> ResponderAsync(ResponderEncuestaDto dto);
    Task<decimal> GetPromedioGeneralAsync();
    Task<IEnumerable<PromedioTecnicoDto>> GetPorTecnicoAsync();
    Task<IEnumerable<PromedioMesDto>> GetPorMesAsync();
    Task<IEnumerable<EncuestaDetalleDto>> GetDetalleAsync(Guid? tecnicoId);
}
