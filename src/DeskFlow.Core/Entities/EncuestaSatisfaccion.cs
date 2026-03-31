using DeskFlow.Core.Common;

namespace DeskFlow.Core.Entities;

public class EncuestaConfiguracion : TenantEntity
{
    public string Pregunta { get; set; } = "¿Cómo evaluaría la atención recibida?";
    public int EscalaMinima { get; set; } = 1;
    public int EscalaMaxima { get; set; } = 5;
    public bool Activo { get; set; } = true;

    public Tenant Tenant { get; set; } = null!;
}

public class EncuestaRespuesta : TenantEntity
{
    public Guid TicketId { get; set; }
    public Guid UsuarioId { get; set; }
    public Guid? TecnicoId { get; set; }
    public int? Puntuacion { get; set; } // null = pendiente
    public string? Comentario { get; set; }
    public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;
    public DateTime? FechaRespuesta { get; set; }

    public Tenant Tenant { get; set; } = null!;
    public Ticket Ticket { get; set; } = null!;
    public Usuario Usuario { get; set; } = null!;
    public Usuario? Tecnico { get; set; }
}
