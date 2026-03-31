using System.ComponentModel.DataAnnotations;

namespace DeskFlow.Core.DTOs.Conocimiento;

public class AdjuntoArticuloDto
{
    public Guid Id { get; set; }
    public string NombreOriginal { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public long TamanoBytes { get; set; }
    public DateTime FechaCreacion { get; set; }
}

public class ArticuloDto
{
    public Guid Id { get; set; }
    public string Titulo { get; set; } = string.Empty;
    public string Contenido { get; set; } = string.Empty;
    public string Categoria { get; set; } = string.Empty;
    public Guid CategoriaId { get; set; }
    public string? Subcategoria { get; set; }
    public Guid? SubcategoriaId { get; set; }
    public List<string> Etiquetas { get; set; } = new();
    public string Autor { get; set; } = string.Empty;
    public Guid AutorId { get; set; }
    public int Vistas { get; set; }
    public bool EsPublico { get; set; }
    public DateTime FechaCreacion { get; set; }
    public DateTime FechaActualizacion { get; set; }
    public List<AdjuntoArticuloDto> Adjuntos { get; set; } = new();
}

public class ArticuloListItemDto
{
    public Guid Id { get; set; }
    public string Titulo { get; set; } = string.Empty;
    public string Categoria { get; set; } = string.Empty;
    public string? Subcategoria { get; set; }
    public List<string> Etiquetas { get; set; } = new();
    public string Autor { get; set; } = string.Empty;
    public int Vistas { get; set; }
    public DateTime FechaCreacion { get; set; }
    public DateTime FechaActualizacion { get; set; }
}

public class CreateArticuloDto
{
    [Required, MinLength(5)]
    public string Titulo { get; set; } = string.Empty;

    [Required]
    public string Contenido { get; set; } = string.Empty;

    [Required]
    public Guid CategoriaId { get; set; }

    public Guid? SubcategoriaId { get; set; }
    public List<string> Etiquetas { get; set; } = new();
    public bool EsPublico { get; set; } = true;

    // Para sugerir creación desde ticket
    public Guid? TicketOrigenId { get; set; }
}

public class UpdateArticuloDto
{
    public string? Titulo { get; set; }
    public string? Contenido { get; set; }
    public Guid? CategoriaId { get; set; }
    public Guid? SubcategoriaId { get; set; }
    public List<string>? Etiquetas { get; set; }
    public bool? EsPublico { get; set; }
}
