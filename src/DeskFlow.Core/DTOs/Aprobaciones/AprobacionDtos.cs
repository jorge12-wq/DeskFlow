using System.ComponentModel.DataAnnotations;
using DeskFlow.Core.Entities;

namespace DeskFlow.Core.DTOs.Aprobaciones;

public class AprobacionDto
{
    public Guid Id { get; set; }
    public Guid TicketId { get; set; }
    public string NumeroTicket { get; set; } = string.Empty;
    public string AsuntoTicket { get; set; } = string.Empty;
    public string EstadoTicket { get; set; } = string.Empty;
    public string PrioridadTicket { get; set; } = string.Empty;
    public string PrioridadColor { get; set; } = string.Empty;
    public string SolicitanteTicket { get; set; } = string.Empty;
    public EstadoAprobacion Estado { get; set; }
    public string? Aprobador { get; set; }
    public string? Comentario { get; set; }
    public DateTime? FechaDecision { get; set; }
    public DateTime FechaCreacion { get; set; }
    public DateTime FechaCreacionTicket { get; set; }
}

public class DecidirAprobacionDto
{
    [Required]
    public bool Aprobado { get; set; }

    public string? Comentario { get; set; }
}
