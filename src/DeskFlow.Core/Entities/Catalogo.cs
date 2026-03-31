using DeskFlow.Core.Common;

namespace DeskFlow.Core.Entities;

public class Departamento : TenantEntity
{
    public string Nombre { get; set; } = string.Empty;
    public string? Descripcion { get; set; }
    public string? Icono { get; set; }   // emoji
    public string? Color { get; set; }   // hex color
    public int Orden { get; set; } = 0;
    public bool Activo { get; set; } = true;

    // Navigation
    public Tenant Tenant { get; set; } = null!;
    public ICollection<ServicioCatalogo> Servicios { get; set; } = new List<ServicioCatalogo>();
}

public class ServicioCatalogo : TenantEntity
{
    public Guid DepartamentoId { get; set; }
    public Guid? CategoriaId { get; set; }       // links to Categoria for ticket creation
    public Guid? PrioridadId { get; set; }        // default priority for tickets
    public string Nombre { get; set; } = string.Empty;
    public string? Descripcion { get; set; }
    public string? Icono { get; set; }             // emoji
    public string? Color { get; set; }             // hex color
    public int Orden { get; set; } = 0;
    public int? TiempoEntregaHoras { get; set; }   // SLA for this service
    public bool RequiereAprobacion { get; set; } = false;
    public bool Activo { get; set; } = true;
    public bool EsPublico { get; set; } = true;    // visible to end users

    // Navigation
    public Tenant Tenant { get; set; } = null!;
    public Departamento Departamento { get; set; } = null!;
    public Categoria? Categoria { get; set; }
    public Prioridad? Prioridad { get; set; }
    public ICollection<CampoServicio> Campos { get; set; } = new List<CampoServicio>();
    public ICollection<PlantillaTarea> PlantillasTareas { get; set; } = new List<PlantillaTarea>();
    public ICollection<Ticket> Tickets { get; set; } = new List<Ticket>();
}

public class CampoServicio : TenantEntity
{
    public Guid ServicioId { get; set; }
    public string Nombre { get; set; } = string.Empty;      // internal camelCase key
    public string Etiqueta { get; set; } = string.Empty;    // display label
    public string TipoCampo { get; set; } = string.Empty;   // texto/textarea/numero/fecha/select/multiselect/checkbox/email
    public string? Placeholder { get; set; }
    public bool Requerido { get; set; } = false;
    public int Orden { get; set; } = 0;
    public string? OpcionesJson { get; set; }                // JSON array of options for select/multiselect

    // Navigation
    public Tenant Tenant { get; set; } = null!;
    public ServicioCatalogo Servicio { get; set; } = null!;
    public ICollection<RespuestaFormulario> Respuestas { get; set; } = new List<RespuestaFormulario>();
}

public class PlantillaTarea : TenantEntity
{
    public Guid ServicioId { get; set; }
    public string Titulo { get; set; } = string.Empty;
    public string? Descripcion { get; set; }
    public int Orden { get; set; } = 0;
    public string? AsignarARol { get; set; }   // "Tecnico" / "Agente" / "Supervisor"

    // Navigation
    public Tenant Tenant { get; set; } = null!;
    public ServicioCatalogo Servicio { get; set; } = null!;
}

public class RespuestaFormulario : TenantEntity
{
    public Guid TicketId { get; set; }
    public Guid CampoId { get; set; }
    public string? Valor { get; set; }

    // Navigation
    public Tenant Tenant { get; set; } = null!;
    public Ticket Ticket { get; set; } = null!;
    public CampoServicio Campo { get; set; } = null!;
}

public class Tarea : TenantEntity
{
    public Guid? TicketId { get; set; }
    public string Titulo { get; set; } = string.Empty;
    public string? Descripcion { get; set; }
    public Guid CreadoPorId { get; set; }
    public Guid? AsignadoAId { get; set; }
    public DateTime? FechaVencimiento { get; set; }
    public bool Completada { get; set; } = false;
    public DateTime? FechaCompletada { get; set; }
    public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;

    // Navigation
    public Tenant Tenant { get; set; } = null!;
    public Ticket? Ticket { get; set; }
    public Usuario CreadoPor { get; set; } = null!;
    public Usuario? AsignadoA { get; set; }
}
