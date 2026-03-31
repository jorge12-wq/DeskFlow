using DeskFlow.Core.Common;

namespace DeskFlow.Core.Entities;

public class Tenant : BaseEntity
{
    public string Nombre { get; set; } = string.Empty;
    public string? Dominio { get; set; }
    public string? Logo { get; set; }
    public string? ColorPrimario { get; set; }
    public bool Activo { get; set; } = true;
    public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;

    // Navigation
    public ICollection<Usuario> Usuarios { get; set; } = new List<Usuario>();
    public ICollection<Rol> Roles { get; set; } = new List<Rol>();
    public ICollection<Sucursal> Sucursales { get; set; } = new List<Sucursal>();
    public ICollection<Area> Areas { get; set; } = new List<Area>();
    public ICollection<Categoria> Categorias { get; set; } = new List<Categoria>();
    public ICollection<Prioridad> Prioridades { get; set; } = new List<Prioridad>();
    public ICollection<Ticket> Tickets { get; set; } = new List<Ticket>();
}
