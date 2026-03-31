using DeskFlow.Core.Common;

namespace DeskFlow.Core.Entities;

public class Logro
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Clave { get; set; } = string.Empty;
    public string Nombre { get; set; } = string.Empty;
    public string Descripcion { get; set; } = string.Empty;
    public string Icono { get; set; } = "🏆";
    public string Criterio { get; set; } = string.Empty;
    public int PuntosRecompensa { get; set; }
    public int Orden { get; set; }
}

public class LogroAgente : TenantEntity
{
    public Guid UsuarioId { get; set; }
    public Guid LogroId { get; set; }
    public DateTime FechaObtenido { get; set; } = DateTime.UtcNow;

    public Tenant Tenant { get; set; } = null!;
    public Usuario Usuario { get; set; } = null!;
    public Logro Logro { get; set; } = null!;
}

public class DashboardPersonalizado : TenantEntity
{
    public Guid UsuarioId { get; set; }
    public string WidgetsJson { get; set; } = "[]";
    public DateTime FechaModif { get; set; } = DateTime.UtcNow;

    public Tenant Tenant { get; set; } = null!;
    public Usuario Usuario { get; set; } = null!;
}

public class ReporteCompartido : TenantEntity
{
    public string Token { get; set; } = string.Empty;
    public string Titulo { get; set; } = string.Empty;
    public string ConfigJson { get; set; } = "{}";
    public string? DatosJson { get; set; }
    public Guid? CreadoPorId { get; set; }
    public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;
    public DateTime? FechaExpiracion { get; set; }

    public Tenant Tenant { get; set; } = null!;
    public Usuario? CreadoPor { get; set; }
}
