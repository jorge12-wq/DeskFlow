namespace DeskFlow.Core.DTOs.AuditLogs;

public class AuditLogDto
{
    public Guid Id { get; set; }
    public string Usuario { get; set; } = string.Empty;
    public string Accion { get; set; } = string.Empty;
    public string Entidad { get; set; } = string.Empty;
    public Guid? EntidadId { get; set; }
    public string? DatosAnteriores { get; set; }
    public string? DatosNuevos { get; set; }
    public string? IP { get; set; }
    public DateTime FechaCreacion { get; set; }
}
