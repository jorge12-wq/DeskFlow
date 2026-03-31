using DeskFlow.Core.Common;

namespace DeskFlow.Core.Entities;

public class BaseConocimiento : TenantEntity
{
    public string Titulo { get; set; } = string.Empty;
    public string Contenido { get; set; } = string.Empty; // HTML enriquecido
    public Guid CategoriaId { get; set; }
    public Guid? SubcategoriaId { get; set; }
    public string? Etiquetas { get; set; } // JSON array de strings
    public Guid AutorId { get; set; }
    public int Vistas { get; set; } = 0;
    public bool EsPublico { get; set; } = true;
    public bool Activo { get; set; } = true;
    public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;
    public DateTime FechaActualizacion { get; set; } = DateTime.UtcNow;

    // Navigation
    public Tenant Tenant { get; set; } = null!;
    public Categoria Categoria { get; set; } = null!;
    public Subcategoria? Subcategoria { get; set; }
    public Usuario Autor { get; set; } = null!;
    public ICollection<ArticuloRelacionado> ArticulosRelacionados { get; set; } = new List<ArticuloRelacionado>();
    public ICollection<ConocimientoAdjunto> Adjuntos { get; set; } = new List<ConocimientoAdjunto>();
}

public class ArticuloRelacionado : BaseEntity
{
    public Guid ArticuloOrigenId { get; set; }
    public Guid ArticuloRelacionadoId { get; set; }

    public BaseConocimiento ArticuloOrigen { get; set; } = null!;
    public BaseConocimiento Articulo { get; set; } = null!;
}
