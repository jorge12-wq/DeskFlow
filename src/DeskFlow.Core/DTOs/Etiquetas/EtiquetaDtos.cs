using System.ComponentModel.DataAnnotations;

namespace DeskFlow.Core.DTOs.Etiquetas;

public class EtiquetaDto
{
    public Guid Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string Color { get; set; } = string.Empty;
    public bool Activo { get; set; }
}

public class CreateEtiquetaDto
{
    [Required, MaxLength(50)]
    public string Nombre { get; set; } = string.Empty;

    [Required, MaxLength(7)]
    public string Color { get; set; } = "#6366f1";
}

public class UpdateEtiquetaDto
{
    public string? Nombre { get; set; }
    public string? Color { get; set; }
    public bool? Activo { get; set; }
}

public class AsignarEtiquetasDto
{
    [Required]
    public List<Guid> EtiquetaIds { get; set; } = new();
}

public class EtiquetaEstadisticaDto
{
    public Guid Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string Color { get; set; } = string.Empty;
    public int CantidadTickets { get; set; }
}
