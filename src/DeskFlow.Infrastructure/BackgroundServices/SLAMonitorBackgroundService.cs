using DeskFlow.Core.Enums;
using DeskFlow.Core.Interfaces;
using DeskFlow.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace DeskFlow.Infrastructure.BackgroundServices;

public class SLAMonitorBackgroundService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<SLAMonitorBackgroundService> _logger;
    private static readonly TimeSpan Interval = TimeSpan.FromMinutes(5);

    // Estados que pausan el SLA
    private static readonly string[] EstadosPausa = ["Pendiente de Usuario", "Pendiente de Proveedor"];

    public SLAMonitorBackgroundService(IServiceScopeFactory scopeFactory,
        ILogger<SLAMonitorBackgroundService> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("SLA Monitor iniciado.");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await ProcesarSLAAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error en SLA Monitor.");
            }

            await Task.Delay(Interval, stoppingToken);
        }
    }

    private async Task ProcesarSLAAsync()
    {
        using var scope = _scopeFactory.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<DeskFlowDbContext>();
        var notificacionService = scope.ServiceProvider.GetRequiredService<INotificacionService>();

        var ahora = DateTime.UtcNow;

        var tickets = await context.Tickets
            .IgnoreQueryFilters()
            .Include(t => t.Estado)
            .Include(t => t.Prioridad)
            .Where(t => t.FechaLimiteSLA.HasValue
                     && !t.Estado.EsFinal
                     && !EstadosPausa.Contains(t.Estado.Nombre))
            .ToListAsync();

        var notificacionesPendientes = new List<(Guid tenantId, Guid usuarioId, string titulo, string mensaje, TipoNotificacion tipo, Guid ticketId)>();

        int actualizados = 0;
        foreach (var ticket in tickets)
        {
            var estadoAnterior = ticket.SLAEstado;
            var limite = ticket.FechaLimiteSLA!.Value;

            SLAEstado nuevoEstado;
            if (ahora >= limite)
            {
                nuevoEstado = SLAEstado.Vencido;
            }
            else
            {
                var tiempoTotal = (limite - ticket.FechaCreacion).TotalMinutes;
                var tiempoConsumido = (ahora - ticket.FechaCreacion).TotalMinutes;
                nuevoEstado = tiempoTotal > 0 && tiempoConsumido / tiempoTotal >= 0.80
                    ? SLAEstado.EnRiesgo
                    : SLAEstado.EnTiempo;
            }

            if (ticket.SLAEstado != nuevoEstado)
            {
                ticket.SLAEstado = nuevoEstado;
                actualizados++;

                // Preparar notificaciones para cambios de estado relevantes
                if (nuevoEstado == SLAEstado.EnRiesgo && estadoAnterior == SLAEstado.EnTiempo)
                {
                    var titulo = $"SLA en riesgo: #{ticket.Numero}";
                    var mensaje = $"El ticket '{ticket.Asunto}' está por vencer. Límite: {limite:dd/MM/yyyy HH:mm}";

                    if (ticket.TecnicoAsignadoId.HasValue)
                        notificacionesPendientes.Add((ticket.TenantId, ticket.TecnicoAsignadoId.Value, titulo, mensaje, TipoNotificacion.SLAEnRiesgo, ticket.Id));
                    if (ticket.SupervisorId.HasValue)
                        notificacionesPendientes.Add((ticket.TenantId, ticket.SupervisorId.Value, titulo, mensaje, TipoNotificacion.SLAEnRiesgo, ticket.Id));
                }
                else if (nuevoEstado == SLAEstado.Vencido && estadoAnterior != SLAEstado.Vencido)
                {
                    var titulo = $"SLA vencido: #{ticket.Numero}";
                    var mensaje = $"El ticket '{ticket.Asunto}' ha superado su tiempo límite de SLA.";

                    if (ticket.TecnicoAsignadoId.HasValue)
                        notificacionesPendientes.Add((ticket.TenantId, ticket.TecnicoAsignadoId.Value, titulo, mensaje, TipoNotificacion.SLAVencido, ticket.Id));
                    if (ticket.SupervisorId.HasValue)
                        notificacionesPendientes.Add((ticket.TenantId, ticket.SupervisorId.Value, titulo, mensaje, TipoNotificacion.SLAVencido, ticket.Id));

                    // Notificar a todos los admins del tenant
                    var admins = await context.Usuarios
                        .IgnoreQueryFilters()
                        .Include(u => u.Rol)
                        .Where(u => u.TenantId == ticket.TenantId && u.Rol.Nombre == "Administrador" && u.Activo)
                        .Select(u => u.Id)
                        .ToListAsync();

                    foreach (var adminId in admins)
                        notificacionesPendientes.Add((ticket.TenantId, adminId, titulo, mensaje, TipoNotificacion.SLAVencido, ticket.Id));
                }
            }
        }

        if (actualizados > 0)
        {
            await context.SaveChangesAsync();
            _logger.LogInformation("SLA Monitor: {Count} tickets actualizados.", actualizados);
        }

        // Enviar notificaciones (deduplicar por usuario+ticket)
        var deduped = notificacionesPendientes
            .GroupBy(n => (n.usuarioId, n.ticketId, n.tipo))
            .Select(g => g.First());

        foreach (var (tenantId, usuarioId, titulo, mensaje, tipo, ticketId) in deduped)
        {
            await notificacionService.NotificarAsync(tenantId, usuarioId, titulo, mensaje, tipo, ticketId);
        }
    }
}
