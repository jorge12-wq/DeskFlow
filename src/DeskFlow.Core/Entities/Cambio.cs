using DeskFlow.Core.Common;

namespace DeskFlow.Core.Entities;

public class TipoCambio
{
    public Guid Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string? Descripcion { get; set; }
    public string Color { get; set; } = "#6B7280";
    public int Orden { get; set; }
}

public class EstadoCambio
{
    public Guid Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string Color { get; set; } = string.Empty;
    public int Orden { get; set; }
    public bool EsFinal { get; set; }
}

public class Cambio : TenantEntity
{
    public string Numero { get; set; } = string.Empty;
    public string Titulo { get; set; } = string.Empty;
    public string Descripcion { get; set; } = string.Empty;
    public Guid TipoCambioId { get; set; }
    public Guid EstadoId { get; set; }
    public Guid PrioridadId { get; set; }
    public Guid? CategoriaId { get; set; }
    public Guid SolicitanteId { get; set; }
    public Guid? ImplementadorId { get; set; }
    public string Riesgo { get; set; } = "Bajo";           // Bajo/Medio/Alto/Crítico
    public string Impacto { get; set; } = "Bajo";          // Bajo/Medio/Alto
    public string Urgencia { get; set; } = "Baja";         // Baja/Media/Alta
    public string? DescripcionImpacto { get; set; }
    public string? PlanImplementacion { get; set; }
    public string? PlanPruebas { get; set; }
    public string? PlanBackout { get; set; }
    public string? ResultadoPostImpl { get; set; }
    public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;
    public DateTime? FechaInicioPlaneado { get; set; }
    public DateTime? FechaFinPlaneado { get; set; }
    public DateTime? FechaInicioReal { get; set; }
    public DateTime? FechaFinReal { get; set; }
    public DateTime? FechaCierre { get; set; }

    // Navigation
    public TipoCambio TipoCambio { get; set; } = null!;
    public EstadoCambio Estado { get; set; } = null!;
    public Prioridad Prioridad { get; set; } = null!;
    public Categoria? Categoria { get; set; }
    public Usuario Solicitante { get; set; } = null!;
    public Usuario? Implementador { get; set; }
    public ICollection<AprobadorCAB> AprobadoresCAB { get; set; } = new List<AprobadorCAB>();
    public ICollection<HistorialCambio> Historial { get; set; } = new List<HistorialCambio>();
    public ICollection<CambioProblema> Problemas { get; set; } = new List<CambioProblema>();
}

public class AprobadorCAB : TenantEntity
{
    public Guid CambioId { get; set; }
    public Guid AprobadorId { get; set; }
    public EstadoAprobacionCAB Estado { get; set; } = EstadoAprobacionCAB.Pendiente;
    public string? Comentario { get; set; }
    public DateTime? FechaDecision { get; set; }
    public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;

    public Cambio Cambio { get; set; } = null!;
    public Usuario Aprobador { get; set; } = null!;
}

public enum EstadoAprobacionCAB { Pendiente = 0, Aprobado = 1, Rechazado = 2 }

public class HistorialCambio : TenantEntity
{
    public Guid CambioId { get; set; }
    public Guid? UsuarioId { get; set; }
    public string Accion { get; set; } = string.Empty;
    public string? Detalle { get; set; }
    public DateTime FechaAccion { get; set; } = DateTime.UtcNow;

    public Cambio Cambio { get; set; } = null!;
    public Usuario? Usuario { get; set; }
}

public class CambioProblema : TenantEntity
{
    public Guid CambioId { get; set; }
    public Guid ProblemaId { get; set; }
    public DateTime FechaVinculacion { get; set; } = DateTime.UtcNow;

    public Cambio Cambio { get; set; } = null!;
    public Problema Problema { get; set; } = null!;
}
