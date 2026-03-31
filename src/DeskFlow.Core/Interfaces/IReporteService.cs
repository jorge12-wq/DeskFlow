using DeskFlow.Core.DTOs.Reportes;

namespace DeskFlow.Core.Interfaces;

public interface IReporteService
{
    Task<byte[]> GenerarReporteTicketsExcelAsync(FiltroReporteTicketsDto filtro);
    Task<byte[]> GenerarReporteSLAExcelAsync(int mes, int anio);
    Task<byte[]> GenerarReporteTecnicosExcelAsync(FiltroReporteTecnicosDto filtro);
    Task<byte[]> GenerarReporteTicketPdfAsync(Guid ticketId);
}
