using DeskFlow.Core.Common;

namespace DeskFlow.Core.Entities;

public class AdjuntoTicket : BaseEntity
{
    public Guid TicketId { get; set; }
    public Guid? ComentarioId { get; set; }
    public string NombreArchivo { get; set; } = string.Empty;
    public string RutaArchivo { get; set; } = string.Empty;
    public string TipoArchivo { get; set; } = string.Empty;
    public long Tamaño { get; set; }
    public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;

    // Navigation
    public Ticket Ticket { get; set; } = null!;
    public ComentarioTicket? Comentario { get; set; }
}
