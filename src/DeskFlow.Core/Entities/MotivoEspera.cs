using DeskFlow.Core.Common;

namespace DeskFlow.Core.Entities;

/// <summary>
/// Motivo pre-configurado para poner un ticket en espera.
/// Puede ser global (HelpDeskId = null) o específico de un Help Desk.
/// </summary>
public class MotivoEspera : TenantEntity
{
    public string Nombre       { get; set; } = string.Empty;
    public string? Descripcion { get; set; }
    public string Icono        { get; set; } = "⏳";
    public Guid?  HelpDeskId   { get; set; }  // null = disponible en todos
    public bool   Activo       { get; set; } = true;
    public int    Orden        { get; set; } = 0;

    // Navigation
    public Tenant    Tenant   { get; set; } = null!;
    public HelpDesk? HelpDesk { get; set; }
}
