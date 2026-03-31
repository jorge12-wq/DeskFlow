using DeskFlow.Core.Common;

namespace DeskFlow.Core.Entities;

public class Workflow : TenantEntity
{
    public string Nombre { get; set; } = string.Empty;
    public string? Descripcion { get; set; }
    public string Tipo { get; set; } = "General"; // General | Servicio | Cambio
    public Guid? ServicioId { get; set; }
    public bool Activo { get; set; } = true;
    public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;
    public DateTime? FechaActualizacion { get; set; }
    public Guid? CreadoPorId { get; set; }

    // Navigation
    public Tenant Tenant { get; set; } = null!;
    public ServicioCatalogo? Servicio { get; set; }
    public Usuario? CreadoPor { get; set; }
    public ICollection<WorkflowNodo> Nodos { get; set; } = new List<WorkflowNodo>();
    public ICollection<WorkflowConexion> Conexiones { get; set; } = new List<WorkflowConexion>();
}

public class WorkflowNodo
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid WorkflowId { get; set; }

    // Tipo: inicio | formulario | aprobacion | tareas | condicional | email | fin | cancelar
    public string TipoNodo { get; set; } = string.Empty;
    public string Nombre { get; set; } = string.Empty;
    public float PosicionX { get; set; }
    public float PosicionY { get; set; }
    public string? ConfigJson { get; set; }

    // Navigation
    public Workflow Workflow { get; set; } = null!;
}

public class WorkflowConexion
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid WorkflowId { get; set; }
    public Guid NodoOrigenId { get; set; }
    public Guid NodoDestinoId { get; set; }
    public string? Etiqueta { get; set; }
    public int Orden { get; set; }
    public string? OrigenLado  { get; set; }   // right | left | top | bottom
    public string? DestinoLado { get; set; }  // right | left | top | bottom
    public float?  MidOffsetX  { get; set; }  // desplazamiento del punto de control en X
    public float?  MidOffsetY  { get; set; }  // desplazamiento del punto de control en Y

    // Navigation
    public Workflow Workflow { get; set; } = null!;
    public WorkflowNodo NodoOrigen { get; set; } = null!;
    public WorkflowNodo NodoDestino { get; set; } = null!;
}
