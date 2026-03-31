using DeskFlow.Core.Common;

namespace DeskFlow.Core.Entities;

public class ComentarioTicket : BaseEntity
{
    public Guid TicketId { get; set; }
    public Guid UsuarioId { get; set; }
    public string Contenido { get; set; } = string.Empty;
    public bool EsInterno { get; set; } = false;
    public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;

    // Navigation
    public Ticket Ticket { get; set; } = null!;
    public Usuario Usuario { get; set; } = null!;
    public ICollection<AdjuntoTicket> Adjuntos { get; set; } = new List<AdjuntoTicket>();
}
