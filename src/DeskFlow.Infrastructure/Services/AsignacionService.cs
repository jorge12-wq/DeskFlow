using DeskFlow.Core.Interfaces;
using DeskFlow.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace DeskFlow.Infrastructure.Services;

public class AsignacionService : IAsignacionService
{
    private readonly DeskFlowDbContext _context;

    public AsignacionService(DeskFlowDbContext context)
    {
        _context = context;
    }

    public async Task<Guid?> ObtenerTecnicoAutoAsync(Guid tenantId, Guid categoriaId)
    {
        // Obtener técnicos habilitados para la categoría
        var tecnicosIds = await _context.TecnicoCategorias
            .IgnoreQueryFilters()
            .Where(tc => tc.TenantId == tenantId && tc.CategoriaId == categoriaId)
            .Select(tc => tc.TecnicoId)
            .ToListAsync();

        if (!tecnicosIds.Any())
            return null;

        // Verificar que los técnicos estén activos
        var tecnicosActivos = await _context.Usuarios
            .IgnoreQueryFilters()
            .Where(u => tecnicosIds.Contains(u.Id) && u.TenantId == tenantId && u.Activo)
            .Select(u => u.Id)
            .ToListAsync();

        if (!tecnicosActivos.Any())
            return null;

        // Contar tickets abiertos por técnico (round-robin por carga)
        var estadosFinales = new[] { "Resuelto", "Cerrado", "Cancelado" };

        var cargasPorTecnico = await _context.Tickets
            .IgnoreQueryFilters()
            .Include(t => t.Estado)
            .Where(t => t.TenantId == tenantId
                     && t.TecnicoAsignadoId.HasValue
                     && tecnicosActivos.Contains(t.TecnicoAsignadoId!.Value)
                     && !estadosFinales.Contains(t.Estado.Nombre))
            .GroupBy(t => t.TecnicoAsignadoId!.Value)
            .Select(g => new { TecnicoId = g.Key, TicketsAbiertos = g.Count() })
            .ToListAsync();

        // Incluir técnicos sin tickets
        var tecnicoConMenosCarga = tecnicosActivos
            .Select(tid => new
            {
                TecnicoId = tid,
                TicketsAbiertos = cargasPorTecnico.FirstOrDefault(c => c.TecnicoId == tid)?.TicketsAbiertos ?? 0
            })
            .OrderBy(x => x.TicketsAbiertos)
            .First();

        return tecnicoConMenosCarga.TecnicoId;
    }
}
