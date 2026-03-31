namespace DeskFlow.Core.DTOs.Reportes;

public class FiltroReporteTicketsDto
{
    public DateTime? FechaDesde { get; set; }
    public DateTime? FechaHasta { get; set; }
    public string? Estado { get; set; }
    public Guid? TecnicoId { get; set; }
}

public class FiltroReporteTecnicosDto
{
    public DateTime? FechaDesde { get; set; }
    public DateTime? FechaHasta { get; set; }
}
