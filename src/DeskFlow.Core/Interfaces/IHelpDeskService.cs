using DeskFlow.Core.DTOs.HelpDesks;

namespace DeskFlow.Core.Interfaces;

public interface IHelpDeskService
{
    Task<List<HelpDeskListItemDto>> GetAllAsync();
    Task<HelpDeskDetalleDto?> GetByIdAsync(Guid id);
    Task<List<MiHelpDeskDto>> GetMisHelpDesksAsync();
    Task<HelpDeskDetalleDto> CreateAsync(CreateHelpDeskDto dto);
    Task<HelpDeskDetalleDto> UpdateAsync(Guid id, UpdateHelpDeskDto dto);
    Task DeleteAsync(Guid id);
    Task AsignarAgenteAsync(Guid helpDeskId, AsignarAgenteDto dto);
    Task RemoverAgenteAsync(Guid helpDeskId, Guid usuarioId);
}
