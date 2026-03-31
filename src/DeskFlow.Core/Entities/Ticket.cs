using DeskFlow.Core.Common;
using DeskFlow.Core.Enums;

namespace DeskFlow.Core.Entities;

public class Ticket : TenantEntity
{
    public string Numero { get; set; } = string.Empty;
    public string Asunto { get; set; } = string.Empty;
    public string Descripcion { get; set; } = string.Empty;
    public Guid CategoriaId { get; set; }
    public Guid? SubcategoriaId { get; set; }
    public Guid PrioridadId { get; set; }
    public Guid EstadoId { get; set; }
    public Guid UsuarioCreadorId { get; set; }
    public Guid? TecnicoAsignadoId { get; set; }
    public Guid? SupervisorId { get; set; }
    public Guid? SucursalId { get; set; }
    public Guid? AreaId { get; set; }
    public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;
    public DateTime? FechaAsignacion { get; set; }
    public DateTime? FechaResolucion { get; set; }
    public DateTime? FechaCierre { get; set; }
    public DateTime? FechaLimiteSLA { get; set; }
    public SLAEstado SLAEstado { get; set; } = SLAEstado.EnTiempo;
    public int TiempoPausadoMinutos { get; set; } = 0;
    public DateTime? FechaInicioUltimaPausa { get; set; }
    public DateTime? FechaEscalacion { get; set; }
    public Guid? ServicioId { get; set; }
    public Guid? HelpDeskId { get; set; }

    // Espera (pausa SLA)
    public bool   EstaEnEspera    { get; set; } = false;
    public Guid?  MotivoEsperaId  { get; set; }
    public DateTime? FechaEnEspera { get; set; }

    // Navigation
    public Tenant Tenant { get; set; } = null!;
    public Categoria Categoria { get; set; } = null!;
    public Subcategoria? Subcategoria { get; set; }
    public Prioridad Prioridad { get; set; } = null!;
    public EstadoTicket Estado { get; set; } = null!;
    public Usuario UsuarioCreador { get; set; } = null!;
    public Usuario? TecnicoAsignado { get; set; }
    public Usuario? Supervisor { get; set; }
    public Sucursal? Sucursal { get; set; }
    public Area? Area { get; set; }
    public ICollection<ComentarioTicket> Comentarios { get; set; } = new List<ComentarioTicket>();
    public ICollection<AdjuntoTicket> Adjuntos { get; set; } = new List<AdjuntoTicket>();
    public ICollection<HistorialTicket> Historial { get; set; } = new List<HistorialTicket>();
    public ICollection<TicketEtiqueta> Etiquetas { get; set; } = new List<TicketEtiqueta>();
    public ServicioCatalogo? Servicio { get; set; }
    public HelpDesk?   HelpDesk    { get; set; }
    public MotivoEspera? MotivoEspera { get; set; }
    public ICollection<RespuestaFormulario> RespuestasFormulario { get; set; } = new List<RespuestaFormulario>();
    public ICollection<Tarea> Tareas { get; set; } = new List<Tarea>();
}
