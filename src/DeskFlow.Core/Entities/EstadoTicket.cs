using DeskFlow.Core.Common;

namespace DeskFlow.Core.Entities;

public class EstadoTicket : BaseEntity
{
    public string Nombre { get; set; } = string.Empty;
    public string Color { get; set; } = "#gray";
    public bool EsFinal { get; set; } = false;
    public int Orden { get; set; }

    // Navigation
    public ICollection<Ticket> Tickets { get; set; } = new List<Ticket>();
    public ICollection<HistorialTicket> HistorialesAnteriores { get; set; } = new List<HistorialTicket>();
    public ICollection<HistorialTicket> HistorialesNuevos { get; set; } = new List<HistorialTicket>();
}
