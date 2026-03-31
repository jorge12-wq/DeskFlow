using DeskFlow.Core.DTOs.Gamificacion;

namespace DeskFlow.Core.Interfaces;

public interface IGamificacionService
{
    Task<List<RankingItemDto>> GetRankingAsync(string periodo); // semana | mes | total
    Task<PerfilGamificacionDto> GetMiPerfilAsync();
    Task<List<LogroDto>> GetMisLogrosAsync();
    Task CheckAndAwardBadgesAsync(Guid usuarioId);

    // Dashboard personalizado
    Task<List<WidgetConfigDto>> GetMisWidgetsAsync();
    Task SaveWidgetsAsync(List<WidgetConfigDto> widgets);

    // Reportes compartidos
    Task<ReporteCompartidoDto> CrearReporteCompartidoAsync(CrearReporteCompartidoDto dto);
    Task<string?> GetDatosReporteCompartidoAsync(string token);
    Task<List<ReporteCompartidoDto>> GetMisReportesAsync();
    Task EliminarReporteCompartidoAsync(Guid id);
}
