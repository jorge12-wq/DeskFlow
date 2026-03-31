using DeskFlow.Core.DTOs.Dashboard;

namespace DeskFlow.Core.Interfaces;

public interface IDashboardService
{
    Task<DashboardDto> GetDashboardAsync();
    Task<DashboardResumenDto> GetResumenAsync();
    Task<IEnumerable<TicketsPorMesDto>> GetTicketsPorMesAsync(int anio);
    Task<IEnumerable<TicketsPorTecnicoDto>> GetTicketsPorTecnicoAsync();
    Task<IEnumerable<TicketsPorCategoriaDto>> GetTicketsPorCategoriaAsync();
    Task<IEnumerable<TiempoPromedioDto>> GetTiempoPromedioAsync();
    Task<IEnumerable<SLACumplimientoDto>> GetSLACumplimientoAsync(int anio);
}
