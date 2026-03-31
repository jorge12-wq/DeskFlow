using System.ComponentModel.DataAnnotations;
using DeskFlow.Core.Enums;

namespace DeskFlow.Core.DTOs.Tickets;

public class TicketDto
{
    public Guid Id { get; set; }
    public string Numero { get; set; } = string.Empty;
    public string Asunto { get; set; } = string.Empty;
    public string Descripcion { get; set; } = string.Empty;
    public string Categoria { get; set; } = string.Empty;
    public Guid CategoriaId { get; set; }
    public string? Subcategoria { get; set; }
    public Guid? SubcategoriaId { get; set; }
    public string Prioridad { get; set; } = string.Empty;
    public string PrioridadColor { get; set; } = string.Empty;
    public Guid PrioridadId { get; set; }
    public string Estado { get; set; } = string.Empty;
    public string EstadoColor { get; set; } = string.Empty;
    public Guid EstadoId { get; set; }
    public UsuarioResumenDto UsuarioCreador { get; set; } = null!;
    public UsuarioResumenDto? TecnicoAsignado { get; set; }
    public UsuarioResumenDto? Supervisor { get; set; }
    public string? Sucursal { get; set; }
    public string? Area { get; set; }
    public Guid? AreaId { get; set; }
    public string? HelpDesk { get; set; }
    public Guid? HelpDeskId { get; set; }
    public DateTime FechaCreacion { get; set; }
    public DateTime? FechaAsignacion { get; set; }
    public DateTime? FechaResolucion { get; set; }
    public DateTime? FechaCierre { get; set; }
    public DateTime? FechaLimiteSLA { get; set; }
    public bool SlaVencido { get; set; }
    public SLAEstado SLAEstado { get; set; }
    public bool EstaEnEspera { get; set; }
    public Guid? MotivoEsperaId { get; set; }
    public string? MotivoEspera { get; set; }
    public string? MotivoEsperaIcono { get; set; }
    public DateTime? FechaEnEspera { get; set; }
    public IEnumerable<ComentarioDto> Comentarios { get; set; } = new List<ComentarioDto>();
    public IEnumerable<HistorialDto> Historial { get; set; } = new List<HistorialDto>();
    public IEnumerable<AdjuntoDto> Adjuntos { get; set; } = new List<AdjuntoDto>();
}

public class TicketListItemDto
{
    public Guid Id { get; set; }
    public string Numero { get; set; } = string.Empty;
    public string Asunto { get; set; } = string.Empty;
    public string Categoria { get; set; } = string.Empty;
    public string? Subcategoria { get; set; }
    public string Prioridad { get; set; } = string.Empty;
    public string PrioridadColor { get; set; } = string.Empty;
    public string Estado { get; set; } = string.Empty;
    public string EstadoColor { get; set; } = string.Empty;
    public Guid UsuarioCreadorId { get; set; }
    public string UsuarioCreador { get; set; } = string.Empty;
    public Guid? TecnicoAsignadoId { get; set; }
    public string? TecnicoAsignado { get; set; }
    public DateTime FechaCreacion { get; set; }
    public DateTime? FechaAsignacion { get; set; }
    public DateTime? FechaResolucion { get; set; }
    public DateTime? FechaCierre { get; set; }
    public DateTime? FechaLimiteSLA { get; set; }
    public bool SlaVencido { get; set; }
    public SLAEstado SLAEstado { get; set; }
}

public class MiTrabajoStatsDto
{
    public int TotalActivos { get; set; }
    public int EsperandoPorMi { get; set; }
    public int AsignadosAMi { get; set; }
    public int SinAsignar { get; set; }
    public int AprobacionesPendientes { get; set; }
    public int VencimientosProximos { get; set; }
    public IEnumerable<TicketListItemDto> TicketsRecientes { get; set; } = [];
}

public class AdjuntoDto
{
    public Guid Id { get; set; }
    public string NombreArchivo { get; set; } = string.Empty;
    public string TipoArchivo { get; set; } = string.Empty;
    public long Tamaño { get; set; }
    public DateTime FechaCreacion { get; set; }
}

public class CreateTicketDto
{
    [Required, MinLength(5)]
    public string Asunto { get; set; } = string.Empty;

    [Required, MinLength(10)]
    public string Descripcion { get; set; } = string.Empty;

    [Required]
    public Guid CategoriaId { get; set; }

    public Guid? SubcategoriaId { get; set; }

    [Required]
    public Guid PrioridadId { get; set; }

    public Guid? SucursalId { get; set; }
    public Guid? AreaId { get; set; }
    public Guid? HelpDeskId { get; set; }
}

public class UpdateTicketDto
{
    public string? Asunto { get; set; }
    public string? Descripcion { get; set; }
    public Guid? CategoriaId { get; set; }
    public Guid? SubcategoriaId { get; set; }
    public Guid? PrioridadId { get; set; }
    public Guid? SucursalId { get; set; }
    public Guid? AreaId { get; set; }
}

public class CambiarEstadoDto
{
    [Required]
    public Guid EstadoId { get; set; }

    public string? Comentario { get; set; }
}

public class AsignarTecnicoDto
{
    [Required]
    public Guid TecnicoId { get; set; }

    public Guid? SupervisorId { get; set; }
    public string? Comentario { get; set; }
}

public class CreateComentarioDto
{
    [Required, MinLength(1)]
    public string Contenido { get; set; } = string.Empty;
    public bool EsInterno { get; set; } = false;
}

public class ComentarioDto
{
    public Guid Id { get; set; }
    public UsuarioResumenDto Usuario { get; set; } = null!;
    public string Contenido { get; set; } = string.Empty;
    public bool EsInterno { get; set; }
    public DateTime FechaCreacion { get; set; }
}

public class HistorialDto
{
    public Guid Id { get; set; }
    public UsuarioResumenDto Usuario { get; set; } = null!;
    public string? EstadoAnterior { get; set; }
    public string? EstadoNuevo { get; set; }
    public string Descripcion { get; set; } = string.Empty;
    public DateTime FechaCreacion { get; set; }
}

public class UsuarioResumenDto
{
    public Guid Id { get; set; }
    public string NombreCompleto { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
}

public class TicketFilterDto
{
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public Guid? EstadoId { get; set; }
    public Guid? PrioridadId { get; set; }
    public Guid? TecnicoId { get; set; }
    public Guid? CategoriaId { get; set; }
    public Guid? SucursalId { get; set; }
    public Guid? AreaId { get; set; }
    public string? Busqueda { get; set; }
    public DateTime? FechaDesde { get; set; }
    public DateTime? FechaHasta { get; set; }
    public SLAEstado? SLAEstado { get; set; }
    public Guid? EtiquetaId { get; set; }
    public Guid? UsuarioCreadorId { get; set; }
    public bool? SoloSinAsignar { get; set; }
    public bool? SoloFinales { get; set; }
    public Guid? HelpDeskId { get; set; }
    /// <summary>Filtro interno: solo tickets de estos help desks (aplica automáticamente para Agentes).</summary>
    [System.Text.Json.Serialization.JsonIgnore]
    public List<Guid>? HelpDeskIds { get; set; }
    public string? OrdenarPor { get; set; } = "FechaCreacion";
    public string? Direccion { get; set; } = "desc";
}

public class PagedResultDto<T>
{
    public IEnumerable<T> Items { get; set; } = new List<T>();
    public int Total { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalPages => (int)Math.Ceiling((double)Total / PageSize);
}

public class PonerEnEsperaDto
{
    public Guid? MotivoEsperaId { get; set; }
    public string? Comentario { get; set; }
}

public class ReanudarEsperaDto
{
    public string? Comentario { get; set; }
}

public class MotivoEsperaDto
{
    public Guid Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string? Descripcion { get; set; }
    public string Icono { get; set; } = "⏳";
    public Guid? HelpDeskId { get; set; }
    public string? HelpDesk { get; set; }
    public bool Activo { get; set; }
    public int Orden { get; set; }
}
