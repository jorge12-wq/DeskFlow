using DeskFlow.Core.DTOs.Cambios;

namespace DeskFlow.Core.Interfaces;

public interface ICambioService
{
    Task<IEnumerable<CambioListItemDto>> GetAllAsync(string? estado = null, Guid? implementadorId = null);
    Task<IEnumerable<CambioCalendarioItemDto>> GetCalendarioAsync(DateTime desde, DateTime hasta);
    Task<CambioDetalleDto> GetByIdAsync(Guid id);
    Task<IEnumerable<TipoCambioDto>> GetTiposAsync();
    Task<IEnumerable<EstadoCambioDto>> GetEstadosAsync();
    Task<CambioDetalleDto> CreateAsync(CreateCambioDto dto);
    Task<CambioDetalleDto> UpdateAsync(Guid id, UpdateCambioDto dto);
    Task<CambioDetalleDto> EnviarACABAsync(Guid id, EnviarCABDto dto);
    Task<CambioDetalleDto> VotarCABAsync(Guid id, VotarCABDto dto);
    Task<CambioDetalleDto> IniciarImplementacionAsync(Guid id, IniciarImplementacionDto dto);
    Task<CambioDetalleDto> CompletarImplementacionAsync(Guid id, CompletarImplementacionDto dto);
    Task<CambioDetalleDto> CerrarAsync(Guid id);
    Task<CambioDetalleDto> RechazarAsync(Guid id, string? motivo);
}
