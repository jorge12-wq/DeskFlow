using DeskFlow.Core.DTOs.Conocimiento;
using DeskFlow.Core.DTOs.Tickets;

namespace DeskFlow.Core.Interfaces;

public interface IBaseConocimientoService
{
    Task<PagedResultDto<ArticuloListItemDto>> BuscarAsync(string? buscar, Guid? categoriaId, int pagina, int porPagina);
    Task<ArticuloDto> GetByIdAsync(Guid id);
    Task<IEnumerable<ArticuloListItemDto>> GetPopularesAsync();
    Task<IEnumerable<ArticuloListItemDto>> GetRelacionadosAsync(Guid id);
    Task<IEnumerable<ArticuloListItemDto>> SugerirPorTicketAsync(Guid ticketId);
    Task<ArticuloDto> CreateAsync(CreateArticuloDto dto);
    Task<ArticuloDto> UpdateAsync(Guid id, UpdateArticuloDto dto);
    Task DeleteAsync(Guid id);

    // Adjuntos
    Task<AdjuntoArticuloDto> AddAdjuntoAsync(Guid articuloId, string nombreOriginal, string rutaAlmacenada, string contentType, long tamanoBytes);
    Task<(string RutaAlmacenada, string NombreOriginal, string ContentType)> GetAdjuntoAsync(Guid adjuntoId);
    Task DeleteAdjuntoAsync(Guid adjuntoId);
}
