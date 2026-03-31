using System.ComponentModel.DataAnnotations;

namespace DeskFlow.Core.DTOs.Plantillas;

public class PlantillaDto
{
    public Guid Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string Contenido { get; set; } = string.Empty;
    public Guid? CategoriaId { get; set; }
    public string? Categoria { get; set; }
    public string CreadoPor { get; set; } = string.Empty;
    public DateTime FechaCreacion { get; set; }
}

public class CreatePlantillaDto
{
    [Required, MinLength(3)]
    public string Nombre { get; set; } = string.Empty;

    [Required, MinLength(10)]
    public string Contenido { get; set; } = string.Empty;

    public Guid? CategoriaId { get; set; }
}

public class UpdatePlantillaDto
{
    public string? Nombre { get; set; }
    public string? Contenido { get; set; }
    public Guid? CategoriaId { get; set; }
}
