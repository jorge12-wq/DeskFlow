using DeskFlow.Core.Common;

namespace DeskFlow.Core.Entities;

public class EstadoProblema
{
    public Guid Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string Color { get; set; } = string.Empty;
    public int Orden { get; set; }
    public bool EsFinal { get; set; }
}

public class Problema : TenantEntity
{
    public string Numero { get; set; } = string.Empty;
    public string Titulo { get; set; } = string.Empty;
    public string Descripcion { get; set; } = string.Empty;
    public Guid EstadoId { get; set; }
    public Guid PrioridadId { get; set; }
    public Guid? CategoriaId { get; set; }
    public Guid? ResponsableId { get; set; }
    public Guid UsuarioCreadorId { get; set; }
    public string? CausaRaiz { get; set; }
    public string? Workaround { get; set; }
    public string? Solucion { get; set; }
    public bool EsErrorConocido { get; set; }
    public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;
    public DateTime? FechaIdentificacion { get; set; }
    public DateTime? FechaResolucion { get; set; }
    public DateTime? FechaCierre { get; set; }

    // Navigation
    public EstadoProblema Estado { get; set; } = null!;
    public Prioridad Prioridad { get; set; } = null!;
    public Categoria? Categoria { get; set; }
    public Usuario? Responsable { get; set; }
    public Usuario UsuarioCreador { get; set; } = null!;
    public ICollection<ProblemaIncidente> Incidentes { get; set; } = new List<ProblemaIncidente>();
    public ICollection<HistorialProblema> Historial { get; set; } = new List<HistorialProblema>();
}

public class ProblemaIncidente : TenantEntity
{
    public Guid ProblemaId { get; set; }
    public Guid TicketId { get; set; }
    public Guid? VinculadoPorId { get; set; }
    public DateTime FechaVinculacion { get; set; } = DateTime.UtcNow;

    public Problema Problema { get; set; } = null!;
    public Ticket Ticket { get; set; } = null!;
    public Usuario? VinculadoPor { get; set; }
}

public class HistorialProblema : TenantEntity
{
    public Guid ProblemaId { get; set; }
    public Guid? UsuarioId { get; set; }
    public string Accion { get; set; } = string.Empty;
    public string? Detalle { get; set; }
    public DateTime FechaAccion { get; set; } = DateTime.UtcNow;

    public Problema Problema { get; set; } = null!;
    public Usuario? Usuario { get; set; }
}
