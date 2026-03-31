using DeskFlow.Core.Common;

namespace DeskFlow.Core.Entities;

/// <summary>
/// Horario laboral del tenant. Sólo existe un registro por tenant.
/// El SLA sólo corre dentro de este horario.
/// </summary>
public class ConfiguracionHorario : TenantEntity
{
    public TimeSpan HoraInicio { get; set; } = new TimeSpan(8, 0, 0);
    public TimeSpan HoraFin    { get; set; } = new TimeSpan(18, 0, 0);

    public bool Lunes     { get; set; } = true;
    public bool Martes    { get; set; } = true;
    public bool Miercoles { get; set; } = true;
    public bool Jueves    { get; set; } = true;
    public bool Viernes   { get; set; } = true;
    public bool Sabado    { get; set; } = false;
    public bool Domingo   { get; set; } = false;

    /// <summary>IANA timezone id, e.g. "America/Argentina/Buenos_Aires".</summary>
    public string ZonaHoraria { get; set; } = "UTC";

    // Navigation
    public Tenant Tenant { get; set; } = null!;
}
