using DeskFlow.Core.DTOs.HelpDesks;
using DeskFlow.Core.Entities;
using DeskFlow.Core.Interfaces;
using DeskFlow.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace DeskFlow.Infrastructure.Services;

public class HelpDeskService : IHelpDeskService
{
    private readonly DeskFlowDbContext _db;
    private readonly ITenantContext _tenantContext;

    public HelpDeskService(DeskFlowDbContext db, ITenantContext tenantContext)
    {
        _db = db;
        _tenantContext = tenantContext;
    }

    public async Task<List<HelpDeskListItemDto>> GetAllAsync()
    {
        var helpdesks = await _db.HelpDesks
            .OrderBy(h => h.Orden).ThenBy(h => h.Nombre)
            .ToListAsync();

        var ids = helpdesks.Select(h => h.Id).ToList();

        var estadosFinales = await _db.EstadosTicket
            .Where(e => e.EsFinal)
            .Select(e => e.Id)
            .ToListAsync();

        var ticketCounts = await _db.Tickets
            .Where(t => t.HelpDeskId.HasValue && ids.Contains(t.HelpDeskId.Value) && !estadosFinales.Contains(t.EstadoId))
            .GroupBy(t => t.HelpDeskId!.Value)
            .Select(g => new { HelpDeskId = g.Key, Count = g.Count() })
            .ToListAsync();

        // Count usuarios per helpdesk via their area
        var usuarioCounts = await _db.Usuarios
            .Where(u => u.Activo && u.Area != null && u.Area.HelpDeskId.HasValue && ids.Contains(u.Area.HelpDeskId!.Value))
            .GroupBy(u => u.Area!.HelpDeskId!.Value)
            .Select(g => new { HelpDeskId = g.Key, Count = g.Count() })
            .ToListAsync();

        return helpdesks.Select(h => new HelpDeskListItemDto(
            h.Id, h.Nombre, h.Descripcion, h.Icono, h.Color, h.Activo, h.EsPublico, h.Orden,
            usuarioCounts.FirstOrDefault(u => u.HelpDeskId == h.Id)?.Count ?? 0,
            ticketCounts.FirstOrDefault(t => t.HelpDeskId == h.Id)?.Count ?? 0
        )).ToList();
    }

    public async Task<HelpDeskDetalleDto?> GetByIdAsync(Guid id)
    {
        var h = await _db.HelpDesks
            .Include(h => h.Agentes)
            .FirstOrDefaultAsync(h => h.Id == id);

        if (h == null) return null;

        var estadosFinales = await _db.EstadosTicket.Where(e => e.EsFinal).Select(e => e.Id).ToListAsync();
        var hoy = DateTime.UtcNow.Date;

        var ticketsAbiertos = await _db.Tickets
            .CountAsync(t => t.HelpDeskId == id && !estadosFinales.Contains(t.EstadoId));
        var ticketsHoy = await _db.Tickets
            .CountAsync(t => t.HelpDeskId == id && t.FechaCreacion >= hoy);

        // Equipo: usuarios cuya área está vinculada a este HelpDesk
        var usuariosDelArea = await _db.Usuarios
            .Include(u => u.Rol)
            .Include(u => u.Area)
            .Where(u => u.Activo && u.Area != null && u.Area.HelpDeskId == id)
            .OrderBy(u => u.Nombre)
            .ToListAsync();

        // Responsables explícitos (desde HelpDeskAgentes)
        var responsablesIds = h.Agentes
            .Where(a => a.EsResponsable)
            .Select(a => a.UsuarioId)
            .ToHashSet();

        var agentes = usuariosDelArea.Select(u => new HelpDeskAgenteDto(
            Guid.Empty, u.Id,
            $"{u.Nombre} {u.Apellido}",
            u.Email,
            u.Rol?.Nombre ?? "",
            responsablesIds.Contains(u.Id),
            DateTime.UtcNow
        )).ToList();

        return new HelpDeskDetalleDto(
            h.Id, h.Nombre, h.Descripcion, h.Icono, h.Color, h.Activo, h.EsPublico, h.Orden, h.FechaCreacion,
            agentes,
            ticketsAbiertos,
            ticketsHoy
        );
    }

    public async Task<List<MiHelpDeskDto>> GetMisHelpDesksAsync()
    {
        var usuarioId = _tenantContext.UsuarioId;
        var asignaciones = await _db.HelpDeskAgentes
            .Include(a => a.HelpDesk)
            .Where(a => a.UsuarioId == usuarioId && a.HelpDesk.Activo)
            .ToListAsync();

        return asignaciones.Select(a => new MiHelpDeskDto(
            a.HelpDeskId, a.HelpDesk.Nombre, a.HelpDesk.Icono, a.HelpDesk.Color, a.EsResponsable
        )).ToList();
    }

    public async Task<HelpDeskDetalleDto> CreateAsync(CreateHelpDeskDto dto)
    {
        var hd = new HelpDesk
        {
            TenantId     = _tenantContext.TenantId,
            Nombre       = dto.Nombre,
            Descripcion  = dto.Descripcion,
            Icono        = dto.Icono,
            Color        = dto.Color,
            EsPublico    = dto.EsPublico,
            Orden        = dto.Orden,
            FechaCreacion = DateTime.UtcNow,
        };
        _db.HelpDesks.Add(hd);
        await _db.SaveChangesAsync();
        return (await GetByIdAsync(hd.Id))!;
    }

    public async Task<HelpDeskDetalleDto> UpdateAsync(Guid id, UpdateHelpDeskDto dto)
    {
        var hd = await _db.HelpDesks.FindAsync(id)
            ?? throw new KeyNotFoundException("HelpDesk no encontrado");

        hd.Nombre      = dto.Nombre;
        hd.Descripcion = dto.Descripcion;
        hd.Icono       = dto.Icono;
        hd.Color       = dto.Color;
        hd.Activo      = dto.Activo;
        hd.EsPublico   = dto.EsPublico;
        hd.Orden       = dto.Orden;

        await _db.SaveChangesAsync();
        return (await GetByIdAsync(id))!;
    }

    public async Task DeleteAsync(Guid id)
    {
        var hd = await _db.HelpDesks.FindAsync(id)
            ?? throw new KeyNotFoundException("HelpDesk no encontrado");
        _db.HelpDesks.Remove(hd);
        await _db.SaveChangesAsync();
    }

    public async Task AsignarAgenteAsync(Guid helpDeskId, AsignarAgenteDto dto)
    {
        var existe = await _db.HelpDeskAgentes
            .AnyAsync(a => a.HelpDeskId == helpDeskId && a.UsuarioId == dto.UsuarioId);

        if (!existe)
        {
            _db.HelpDeskAgentes.Add(new HelpDeskAgente
            {
                TenantId         = _tenantContext.TenantId,
                HelpDeskId       = helpDeskId,
                UsuarioId        = dto.UsuarioId,
                EsResponsable    = dto.EsResponsable,
                FechaAsignacion  = DateTime.UtcNow,
            });
        }
        else
        {
            var agente = await _db.HelpDeskAgentes
                .FirstAsync(a => a.HelpDeskId == helpDeskId && a.UsuarioId == dto.UsuarioId);
            agente.EsResponsable = dto.EsResponsable;
        }
        await _db.SaveChangesAsync();
    }

    public async Task RemoverAgenteAsync(Guid helpDeskId, Guid usuarioId)
    {
        var agente = await _db.HelpDeskAgentes
            .FirstOrDefaultAsync(a => a.HelpDeskId == helpDeskId && a.UsuarioId == usuarioId);
        if (agente != null)
        {
            _db.HelpDeskAgentes.Remove(agente);
            await _db.SaveChangesAsync();
        }
    }
}
