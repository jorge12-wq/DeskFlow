using DeskFlow.Core.DTOs.Notificaciones;
using DeskFlow.Core.Entities;
using DeskFlow.Core.Enums;
using DeskFlow.Core.Interfaces;
using DeskFlow.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace DeskFlow.Infrastructure.Services;

public class NotificacionService : INotificacionService
{
    private readonly DeskFlowDbContext _context;
    private readonly INotificacionPushService? _pushService;
    private readonly ILogger<NotificacionService> _logger;

    public NotificacionService(DeskFlowDbContext context,
        ILogger<NotificacionService> logger,
        INotificacionPushService? pushService = null)
    {
        _context = context;
        _logger = logger;
        _pushService = pushService;
    }

    public async Task NotificarAsync(Guid tenantId, Guid usuarioId, string titulo, string mensaje,
        TipoNotificacion tipo, Guid? ticketId = null)
    {
        var notificacion = new Notificacion
        {
            TenantId = tenantId,
            UsuarioId = usuarioId,
            Titulo = titulo,
            Mensaje = mensaje,
            Tipo = tipo,
            Leida = false,
            TicketId = ticketId,
            FechaCreacion = DateTime.UtcNow
        };

        await _context.Notificaciones.AddAsync(notificacion);
        await _context.SaveChangesAsync();

        if (_pushService != null)
        {
            var dto = MapToDto(notificacion);
            try { await _pushService.PushAsync(usuarioId, dto); }
            catch (Exception ex) { _logger.LogWarning(ex, "Error en push SignalR para usuario {Id}.", usuarioId); }
        }
    }

    public async Task NotificarMultiplesAsync(Guid tenantId, IEnumerable<Guid> usuarioIds,
        string titulo, string mensaje, TipoNotificacion tipo, Guid? ticketId = null)
    {
        var ahora = DateTime.UtcNow;
        var lista = usuarioIds.Distinct().ToList();

        var notificaciones = lista.Select(uid => new Notificacion
        {
            TenantId = tenantId,
            UsuarioId = uid,
            Titulo = titulo,
            Mensaje = mensaje,
            Tipo = tipo,
            Leida = false,
            TicketId = ticketId,
            FechaCreacion = ahora
        }).ToList();

        await _context.Notificaciones.AddRangeAsync(notificaciones);
        await _context.SaveChangesAsync();

        if (_pushService != null)
        {
            foreach (var n in notificaciones)
            {
                try { await _pushService.PushAsync(n.UsuarioId, MapToDto(n)); }
                catch (Exception ex) { _logger.LogWarning(ex, "Error push {Id}.", n.UsuarioId); }
            }
        }
    }

    public async Task<IEnumerable<NotificacionDto>> GetByUsuarioAsync(Guid usuarioId)
    {
        var notificaciones = await _context.Notificaciones
            .Where(n => n.UsuarioId == usuarioId)
            .OrderByDescending(n => n.FechaCreacion)
            .Take(50)
            .ToListAsync();

        return notificaciones.Select(MapToDto);
    }

    public async Task MarcarLeidaAsync(Guid id, Guid usuarioId)
    {
        var notificacion = await _context.Notificaciones
            .FirstOrDefaultAsync(n => n.Id == id && n.UsuarioId == usuarioId)
            ?? throw new KeyNotFoundException("Notificación no encontrada.");

        notificacion.Leida = true;
        await _context.SaveChangesAsync();
    }

    public async Task MarcarTodasLeidasAsync(Guid usuarioId)
    {
        await _context.Notificaciones
            .Where(n => n.UsuarioId == usuarioId && !n.Leida)
            .ExecuteUpdateAsync(s => s.SetProperty(n => n.Leida, true));
    }

    public async Task<int> GetNoLeidasCountAsync(Guid usuarioId)
    {
        return await _context.Notificaciones
            .CountAsync(n => n.UsuarioId == usuarioId && !n.Leida);
    }

    private static NotificacionDto MapToDto(Notificacion n) => new()
    {
        Id = n.Id,
        Titulo = n.Titulo,
        Mensaje = n.Mensaje,
        Tipo = n.Tipo,
        Leida = n.Leida,
        TicketId = n.TicketId,
        FechaCreacion = n.FechaCreacion
    };
}
