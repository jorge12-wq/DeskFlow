using DeskFlow.Core.DTOs.Problemas;

namespace DeskFlow.Core.Interfaces;

public interface IProblemaService
{
    Task<IEnumerable<ProblemaListItemDto>> GetAllAsync(bool? soloErroresConocidos = null, Guid? responsableId = null);
    Task<ProblemaDetalleDto> GetByIdAsync(Guid id);
    Task<IEnumerable<EstadoProblemaDto>> GetEstadosAsync();
    Task<ProblemaDetalleDto> CreateAsync(CreateProblemaDto dto);
    Task<ProblemaDetalleDto> UpdateAsync(Guid id, UpdateProblemaDto dto);
    Task<ProblemaDetalleDto> VincularIncidenteAsync(Guid problemaId, Guid ticketId);
    Task DesvincularIncidenteAsync(Guid problemaId, Guid ticketId);
    Task<ProblemaDetalleDto> MarcarErrorConocidoAsync(Guid id);
    Task<ProblemaDetalleDto> ResolverAsync(Guid id, ResolverProblemaDto dto);
    Task<ProblemaDetalleDto> CerrarAsync(Guid id);
}
