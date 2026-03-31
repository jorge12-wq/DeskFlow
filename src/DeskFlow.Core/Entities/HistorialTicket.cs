using DeskFlow.Core.Common;

namespace DeskFlow.Core.Entities;

public class HistorialTicket : BaseEntity
{
    public Guid TicketId { get; set; }
    public Guid UsuarioId { get; set; }
    public Guid? EstadoAnteriorId { get; set; }
    public Guid? EstadoNuevoId { get; set; }
    public string Descripcion { get; set; } = string.Empty;
    public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;

    // Navigation
    public Ticket Ticket { get; set; } = null!;
    public Usuario Usuario { get; set; } = null!;
    public EstadoTicket? EstadoAnterior { get; set; }
    public EstadoTicket? EstadoNuevo { get; set; }
}
