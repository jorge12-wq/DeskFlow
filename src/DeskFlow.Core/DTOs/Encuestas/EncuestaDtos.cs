using System.ComponentModel.DataAnnotations;

namespace DeskFlow.Core.DTOs.Encuestas;

public class EncuestaPendienteDto
{
    public Guid Id { get; set; }
    public Guid TicketId { get; set; }
    public string TicketNumero { get; set; } = string.Empty;
    public string TicketAsunto { get; set; } = string.Empty;
    public string? Tecnico { get; set; }
    public DateTime FechaCierre { get; set; }
    public string Pregunta { get; set; } = string.Empty;
    public int EscalaMinima { get; set; }
    public int EscalaMaxima { get; set; }
}

public class ResponderEncuestaDto
{
    [Required]
    public Guid EncuestaId { get; set; }

    [Required, Range(1, 5)]
    public int Puntuacion { get; set; }

    public string? Comentario { get; set; }
}

public class EncuestaRespuestaDto
{
    public Guid Id { get; set; }
    public Guid TicketId { get; set; }
    public int Puntuacion { get; set; }
    public string? Comentario { get; set; }
    public DateTime FechaRespuesta { get; set; }
}

public class PromedioTecnicoDto
{
    public Guid TecnicoId { get; set; }
    public string Tecnico { get; set; } = string.Empty;
    public decimal Promedio { get; set; }
    public int TotalEncuestas { get; set; }
}

public class PromedioMesDto
{
    public int Anio { get; set; }
    public int Mes { get; set; }
    public decimal Promedio { get; set; }
    public int TotalEncuestas { get; set; }
}

public class EncuestaDetalleDto
{
    public Guid Id { get; set; }
    public string TicketNumero { get; set; } = string.Empty;
    public string TicketAsunto { get; set; } = string.Empty;
    public string Usuario { get; set; } = string.Empty;
    public string? Tecnico { get; set; }
    public int Puntuacion { get; set; }
    public string? Comentario { get; set; }
    public DateTime FechaRespuesta { get; set; }
}
