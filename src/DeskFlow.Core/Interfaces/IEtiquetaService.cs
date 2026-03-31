using DeskFlow.Core.DTOs.Etiquetas;

namespace DeskFlow.Core.Interfaces;

public interface IEtiquetaService
{
    Task<IEnumerable<EtiquetaDto>> GetAllAsync();
    Task<EtiquetaDto> CreateAsync(CreateEtiquetaDto dto);
    Task<EtiquetaDto> UpdateAsync(Guid id, UpdateEtiquetaDto dto);
    Task DeleteAsync(Guid id);
    Task AsignarEtiquetasAsync(Guid ticketId, List<Guid> etiquetaIds);
    Task QuitarEtiquetaAsync(Guid ticketId, Guid etiquetaId);
    Task<IEnumerable<EtiquetaEstadisticaDto>> GetEstadisticasAsync();
}
