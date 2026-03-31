using DeskFlow.Core.DTOs.Tickets;
using DeskFlow.Core.Entities;
using DeskFlow.Core.Enums;
using DeskFlow.Core.Interfaces.Repositories;
using DeskFlow.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace DeskFlow.Infrastructure.Repositories;

public class TicketRepository : ITicketRepository
{
    private readonly DeskFlowDbContext _context;

    public TicketRepository(DeskFlowDbContext context)
    {
        _context = context;
    }

    public async Task<Ticket?> GetByIdAsync(Guid id)
    {
        return await _context.Tickets
            .Include(t => t.Categoria)
            .Include(t => t.Subcategoria)
            .Include(t => t.Prioridad)
            .Include(t => t.Estado)
            .Include(t => t.UsuarioCreador)
            .Include(t => t.TecnicoAsignado)
            .Include(t => t.Supervisor)
            .Include(t => t.Sucursal)
            .Include(t => t.Area)
            .Include(t => t.HelpDesk)
            .Include(t => t.Comentarios).ThenInclude(c => c.Usuario)
            .Include(t => t.Historial).ThenInclude(h => h.Usuario)
            .Include(t => t.Historial).ThenInclude(h => h.EstadoAnterior)
            .Include(t => t.Historial).ThenInclude(h => h.EstadoNuevo)
            .Include(t => t.Adjuntos)
            .Include(t => t.MotivoEspera)
            .FirstOrDefaultAsync(t => t.Id == id);
    }

    public async Task<Ticket?> GetByNumeroAsync(string numero)
    {
        return await _context.Tickets
            .Include(t => t.Estado)
            .Include(t => t.Prioridad)
            .FirstOrDefaultAsync(t => t.Numero == numero);
    }

    public async Task<(IEnumerable<Ticket> Items, int Total)> GetPagedAsync(TicketFilterDto filter)
    {
        var query = _context.Tickets
            .Include(t => t.Categoria)
            .Include(t => t.Prioridad)
            .Include(t => t.Estado)
            .Include(t => t.UsuarioCreador)
            .Include(t => t.TecnicoAsignado)
            .AsQueryable();

        if (filter.EstadoId.HasValue)
            query = query.Where(t => t.EstadoId == filter.EstadoId.Value);

        if (filter.PrioridadId.HasValue)
            query = query.Where(t => t.PrioridadId == filter.PrioridadId.Value);

        if (filter.TecnicoId.HasValue)
            query = query.Where(t => t.TecnicoAsignadoId == filter.TecnicoId.Value);

        if (filter.CategoriaId.HasValue)
            query = query.Where(t => t.CategoriaId == filter.CategoriaId.Value);

        if (filter.SucursalId.HasValue)
            query = query.Where(t => t.SucursalId == filter.SucursalId.Value);

        if (filter.AreaId.HasValue)
            query = query.Where(t => t.AreaId == filter.AreaId.Value);

        if (filter.FechaDesde.HasValue)
            query = query.Where(t => t.FechaCreacion >= filter.FechaDesde.Value);

        if (filter.FechaHasta.HasValue)
            query = query.Where(t => t.FechaCreacion <= filter.FechaHasta.Value.AddDays(1));

        if (filter.SLAEstado.HasValue)
            query = query.Where(t => t.SLAEstado == filter.SLAEstado.Value);

        if (filter.UsuarioCreadorId.HasValue)
            query = query.Where(t => t.UsuarioCreadorId == filter.UsuarioCreadorId.Value);

        if (filter.SoloSinAsignar == true)
            query = query.Where(t => t.TecnicoAsignadoId == null);

        if (filter.SoloFinales == true)
            query = query.Where(t => t.Estado.EsFinal);
        else if (filter.SoloFinales == false)
            query = query.Where(t => !t.Estado.EsFinal);

        if (filter.HelpDeskId.HasValue)
            query = query.Where(t => t.HelpDeskId == filter.HelpDeskId.Value);

        if (filter.HelpDeskIds != null)
        {
            if (filter.HelpDeskIds.Count == 0)
                return (Enumerable.Empty<Ticket>(), 0);
            query = query.Where(t => t.HelpDeskId != null && filter.HelpDeskIds.Contains(t.HelpDeskId.Value));
        }

        if (!string.IsNullOrWhiteSpace(filter.Busqueda))
        {
            var busqueda = filter.Busqueda.ToLower();
            query = query.Where(t =>
                t.Numero.ToLower().Contains(busqueda) ||
                t.Asunto.ToLower().Contains(busqueda) ||
                t.Descripcion.ToLower().Contains(busqueda));
        }

        // Ordenación dinámica
        query = (filter.OrdenarPor?.ToLower(), filter.Direccion?.ToLower()) switch
        {
            ("asunto", "asc")          => query.OrderBy(t => t.Asunto),
            ("asunto", _)              => query.OrderByDescending(t => t.Asunto),
            ("prioridad", "asc")       => query.OrderBy(t => t.Prioridad.Nombre),
            ("prioridad", _)           => query.OrderByDescending(t => t.Prioridad.Nombre),
            ("estado", "asc")          => query.OrderBy(t => t.Estado.Nombre),
            ("estado", _)              => query.OrderByDescending(t => t.Estado.Nombre),
            ("fechalimitesla", "asc")  => query.OrderBy(t => t.FechaLimiteSLA),
            ("fechalimitesla", _)      => query.OrderByDescending(t => t.FechaLimiteSLA),
            ("fechacreacion", "asc")   => query.OrderBy(t => t.FechaCreacion),
            _                          => query.OrderByDescending(t => t.FechaCreacion)
        };

        var total = await query.CountAsync();
        var items = await query
            .Skip((filter.Page - 1) * filter.PageSize)
            .Take(filter.PageSize)
            .ToListAsync();

        return (items, total);
    }

    public async Task<Ticket> CreateAsync(Ticket ticket)
    {
        await _context.Tickets.AddAsync(ticket);
        await _context.SaveChangesAsync();
        return ticket;
    }

    public async Task UpdateAsync(Ticket ticket)
    {
        _context.Tickets.Update(ticket);
        await _context.SaveChangesAsync();
    }

    public async Task<string> GenerateNumeroAsync(Guid tenantId)
    {
        var count = await _context.Tickets
            .IgnoreQueryFilters()
            .CountAsync(t => t.TenantId == tenantId);
        return $"TKT-{(count + 1):D6}";
    }

    public async Task<Dictionary<string, int>> GetCountsByEstadoAsync()
    {
        return await _context.Tickets
            .Include(t => t.Estado)
            .GroupBy(t => t.Estado.Nombre)
            .Select(g => new { Estado = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.Estado, x => x.Count);
    }

    public async Task<Dictionary<string, int>> GetCountsByPrioridadAsync()
    {
        return await _context.Tickets
            .Include(t => t.Prioridad)
            .GroupBy(t => t.Prioridad.Nombre)
            .Select(g => new { Prioridad = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.Prioridad, x => x.Count);
    }

    public async Task<int> GetTicketsVencidosSLAAsync()
    {
        return await _context.Tickets
            .Where(t => t.SLAEstado == SLAEstado.Vencido && !t.Estado.EsFinal)
            .CountAsync();
    }
}
