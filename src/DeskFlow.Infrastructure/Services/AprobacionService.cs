using DeskFlow.Core.DTOs.Aprobaciones;
using DeskFlow.Core.DTOs.Tickets;
using DeskFlow.Core.Entities;
using DeskFlow.Core.Interfaces;
using DeskFlow.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace DeskFlow.Infrastructure.Services;

public class AprobacionService : IAprobacionService
{
    private readonly DeskFlowDbContext _context;
    private readonly ITenantContext _tenantContext;
    private readonly INotificacionService _notificaciones;
    private readonly ITicketService _ticketService;

    public AprobacionService(DeskFlowDbContext context, ITenantContext tenantContext,
        INotificacionService notificaciones, ITicketService ticketService)
    {
        _context = context;
        _tenantContext = tenantContext;
        _notificaciones = notificaciones;
        _ticketService = ticketService;
    }

    public async Task<AprobacionDto> SolicitarAprobacionAsync(Guid ticketId, string? comentario)
    {
        var ticket = await _context.Tickets.Include(t => t.Estado).FirstOrDefaultAsync(t => t.Id == ticketId)
            ?? throw new KeyNotFoundException("Ticket no encontrado.");

        var estadoPendienteAprobacion = await _context.EstadosTicket
            .FirstOrDefaultAsync(e => e.Nombre == "Pendiente de Aprobación")
            ?? throw new InvalidOperationException("Estado 'Pendiente de Aprobación' no configurado. Ejecute DeskFlow_03_RolesPermisos.sql.");

        ticket.EstadoId = estadoPendienteAprobacion.Id;
        await _context.SaveChangesAsync();

        var aprobacion = new AprobacionTicket
        {
            TenantId = _tenantContext.TenantId,
            TicketId = ticketId,
            Estado = EstadoAprobacion.Pendiente,
            Comentario = comentario,
            FechaCreacion = DateTime.UtcNow
        };

        await _context.AprobacionesTicket.AddAsync(aprobacion);
        await _context.SaveChangesAsync();

        // Notificar a los aprobadores
        var aprobadores = await _context.Usuarios
            .Include(u => u.Rol)
            .Where(u => u.Rol.Nombre == "Aprobador" && u.Activo)
            .Select(u => u.Id)
            .ToListAsync();

        if (aprobadores.Any())
            await _notificaciones.NotificarMultiplesAsync(_tenantContext.TenantId, aprobadores,
                $"Solicitud de aprobación: #{ticket.Numero}",
                $"El ticket '{ticket.Asunto}' requiere tu aprobación.",
                Core.Enums.TipoNotificacion.TicketCreado, ticketId);

        return await MapToDto(aprobacion.Id);
    }

    public async Task<TicketDto> DecidirAsync(Guid aprobacionId, bool aprobado, string? comentario)
    {
        var aprobacion = await _context.AprobacionesTicket
            .Include(a => a.Ticket).ThenInclude(t => t.Estado)
            .FirstOrDefaultAsync(a => a.Id == aprobacionId)
            ?? throw new KeyNotFoundException("Aprobación no encontrada.");

        if (aprobacion.Estado != EstadoAprobacion.Pendiente)
            throw new InvalidOperationException("Esta aprobación ya fue procesada.");

        aprobacion.AprobadorId = _tenantContext.UsuarioId;
        aprobacion.FechaDecision = DateTime.UtcNow;
        aprobacion.Estado = aprobado ? EstadoAprobacion.Aprobado : EstadoAprobacion.Rechazado;
        aprobacion.Comentario = comentario;

        string estadoDestino = aprobado ? "Pendiente de Asignación" : "Rechazado";
        var nuevoEstado = await _context.EstadosTicket.FirstOrDefaultAsync(e => e.Nombre == estadoDestino)
            ?? await _context.EstadosTicket.FirstOrDefaultAsync(e => e.Nombre == "Nuevo");

        if (nuevoEstado != null)
            aprobacion.Ticket.EstadoId = nuevoEstado.Id;

        await _context.SaveChangesAsync();

        // Historial
        var historial = new HistorialTicket
        {
            TicketId = aprobacion.TicketId,
            UsuarioId = _tenantContext.UsuarioId,
            EstadoNuevoId = nuevoEstado?.Id,
            Descripcion = aprobado
                ? $"Ticket aprobado. {comentario ?? string.Empty}".Trim()
                : $"Ticket rechazado. {comentario ?? string.Empty}".Trim(),
            FechaCreacion = DateTime.UtcNow
        };
        await _context.HistorialTickets.AddAsync(historial);
        await _context.SaveChangesAsync();

        // Notificar al creador del ticket
        var ticket = aprobacion.Ticket;
        var tipoNotif = aprobado ? Core.Enums.TipoNotificacion.CambioEstado : Core.Enums.TipoNotificacion.CambioEstado;
        await _notificaciones.NotificarAsync(_tenantContext.TenantId, ticket.UsuarioCreadorId,
            aprobado ? $"Ticket #{ticket.Numero} aprobado" : $"Ticket #{ticket.Numero} rechazado",
            aprobado ? "Tu solicitud fue aprobada y está pendiente de asignación." : $"Tu solicitud fue rechazada. {comentario ?? string.Empty}".Trim(),
            tipoNotif, ticket.Id);

        return await _ticketService.GetByIdAsync(ticket.Id);
    }

    public async Task<IEnumerable<AprobacionDto>> GetPendientesAsync()
    {
        var ids = await _context.AprobacionesTicket
            .Where(a => a.TenantId == _tenantContext.TenantId && a.Estado == EstadoAprobacion.Pendiente)
            .OrderByDescending(a => a.FechaCreacion)
            .Select(a => a.Id)
            .ToListAsync();

        var result = new List<AprobacionDto>();
        foreach (var id in ids)
            result.Add(await MapToDto(id));
        return result;
    }

    public async Task<IEnumerable<AprobacionDto>> GetHistorialAsync()
    {
        var ids = await _context.AprobacionesTicket
            .Where(a => a.TenantId == _tenantContext.TenantId && a.Estado != EstadoAprobacion.Pendiente)
            .OrderByDescending(a => a.FechaDecision)
            .Take(50)
            .Select(a => a.Id)
            .ToListAsync();

        var result = new List<AprobacionDto>();
        foreach (var id in ids)
            result.Add(await MapToDto(id));
        return result;
    }

    private async Task<AprobacionDto> MapToDto(Guid id)
    {
        var a = await _context.AprobacionesTicket
            .Include(x => x.Ticket).ThenInclude(t => t.Estado)
            .Include(x => x.Ticket).ThenInclude(t => t.Prioridad)
            .Include(x => x.Ticket).ThenInclude(t => t.UsuarioCreador)
            .Include(x => x.Aprobador)
            .FirstAsync(x => x.Id == id);

        return new AprobacionDto
        {
            Id = a.Id,
            TicketId = a.TicketId,
            NumeroTicket = a.Ticket.Numero,
            AsuntoTicket = a.Ticket.Asunto,
            EstadoTicket = a.Ticket.Estado.Nombre,
            PrioridadTicket = a.Ticket.Prioridad.Nombre,
            PrioridadColor = a.Ticket.Prioridad.Color,
            SolicitanteTicket = $"{a.Ticket.UsuarioCreador.Nombre} {a.Ticket.UsuarioCreador.Apellido}",
            Estado = a.Estado,
            Aprobador = a.Aprobador == null ? null : $"{a.Aprobador.Nombre} {a.Aprobador.Apellido}",
            Comentario = a.Comentario,
            FechaDecision = a.FechaDecision,
            FechaCreacion = a.FechaCreacion,
            FechaCreacionTicket = a.Ticket.FechaCreacion
        };
    }
}
