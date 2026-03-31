using DeskFlow.Core.Entities;
using DeskFlow.Core.Enums;
using DeskFlow.Core.Interfaces;
using DeskFlow.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace DeskFlow.Infrastructure.Services;

public class SLAService : ISLAService
{
    private readonly DeskFlowDbContext _context;
    private readonly ILogger<SLAService> _logger;

    // Estados que pausan el SLA
    private static readonly string[] EstadosPausa = ["Pendiente de Usuario", "Pendiente de Proveedor"];
    // Estados finales (SLA no aplica)
    private static readonly string[] EstadosFinales = ["Resuelto", "Cerrado", "Cancelado"];

    public SLAService(DeskFlowDbContext context, ILogger<SLAService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<DateTime> CalcularFechaLimiteAsync(Guid tenantId, Guid prioridadId, Guid categoriaId)
    {
        // Buscar configuración específica (prioridad + categoría)
        var slaConfig = await _context.SLAConfiguraciones
            .IgnoreQueryFilters()
            .Where(s => s.TenantId == tenantId && s.PrioridadId == prioridadId && s.CategoriaId == categoriaId)
            .FirstOrDefaultAsync();

        int horas;
        if (slaConfig != null)
            horas = slaConfig.TiempoResolucion_Horas;
        else
        {
            // Fallback: configuración por prioridad sin categoría
            var slaGeneral = await _context.SLAConfiguraciones
                .IgnoreQueryFilters()
                .Where(s => s.TenantId == tenantId && s.PrioridadId == prioridadId && s.CategoriaId == null)
                .FirstOrDefaultAsync();

            if (slaGeneral != null)
                horas = slaGeneral.TiempoResolucion_Horas;
            else
            {
                // Fallback final: usar TiempoResolucionSLA_Horas de la prioridad
                var prioridad = await _context.Prioridades
                    .IgnoreQueryFilters()
                    .FirstOrDefaultAsync(p => p.Id == prioridadId);
                horas = prioridad?.TiempoResolucionSLA_Horas ?? 24;
            }
        }

        // Aplicar horario laboral si está configurado
        var horario = await _context.ConfiguracionesHorario
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(h => h.TenantId == tenantId);

        if (horario != null)
            return CalcularFechaLimiteConHorario(DateTime.UtcNow, horas, horario);

        return DateTime.UtcNow.AddHours(horas);
    }

    /// <summary>
    /// Calcula la fecha límite avanzando <paramref name="horasHabiles"/> dentro del
    /// horario laboral configurado (sin contar horas fuera del turno ni días no laborables).
    /// </summary>
    private static DateTime CalcularFechaLimiteConHorario(DateTime inicioUtc, int horasHabiles, Core.Entities.ConfiguracionHorario horario)
    {
        TimeZoneInfo tz;
        try { tz = TimeZoneInfo.FindSystemTimeZoneById(horario.ZonaHoraria); }
        catch { tz = TimeZoneInfo.Utc; }

        var current = TimeZoneInfo.ConvertTimeFromUtc(inicioUtc, tz);

        // Si estamos fuera del horario laboral, avanzar al próximo inicio de jornada
        current = AvanzarAlInicioHorario(current, horario);

        var minutosRestantes = horasHabiles * 60;

        while (minutosRestantes > 0)
        {
            var finJornada = current.Date + horario.HoraFin;
            var minutosDisponibles = (int)(finJornada - current).TotalMinutes;

            if (minutosDisponibles <= 0)
            {
                // Avanzar al siguiente día laboral
                current = SiguienteDiaLaboral(current.Date.AddDays(1), horario) + horario.HoraInicio;
                continue;
            }

            if (minutosRestantes <= minutosDisponibles)
            {
                current = current.AddMinutes(minutosRestantes);
                minutosRestantes = 0;
            }
            else
            {
                minutosRestantes -= minutosDisponibles;
                current = SiguienteDiaLaboral(current.Date.AddDays(1), horario) + horario.HoraInicio;
            }
        }

        return TimeZoneInfo.ConvertTimeToUtc(current, tz);
    }

    /// <summary>Si el momento dado está fuera del horario laboral, devuelve el siguiente inicio de jornada.</summary>
    private static DateTime AvanzarAlInicioHorario(DateTime local, Core.Entities.ConfiguracionHorario horario)
    {
        // Día no laboral → siguiente día laboral
        if (!EsDiaLaboral(local.DayOfWeek, horario))
            return SiguienteDiaLaboral(local.Date.AddDays(1), horario) + horario.HoraInicio;

        // Antes del inicio → inicio del mismo día
        if (local.TimeOfDay < horario.HoraInicio)
            return local.Date + horario.HoraInicio;

        // Después del fin → siguiente día laboral
        if (local.TimeOfDay >= horario.HoraFin)
            return SiguienteDiaLaboral(local.Date.AddDays(1), horario) + horario.HoraInicio;

        return local;
    }

    private static DateTime SiguienteDiaLaboral(DateTime desde, Core.Entities.ConfiguracionHorario horario)
    {
        var dia = desde.Date;
        for (int i = 0; i < 14; i++)
        {
            if (EsDiaLaboral(dia.DayOfWeek, horario))
                return dia;
            dia = dia.AddDays(1);
        }
        return dia; // fallback por si no hay ningún día laboral configurado
    }

    private static bool EsDiaLaboral(DayOfWeek dow, Core.Entities.ConfiguracionHorario h) => dow switch
    {
        DayOfWeek.Monday    => h.Lunes,
        DayOfWeek.Tuesday   => h.Martes,
        DayOfWeek.Wednesday => h.Miercoles,
        DayOfWeek.Thursday  => h.Jueves,
        DayOfWeek.Friday    => h.Viernes,
        DayOfWeek.Saturday  => h.Sabado,
        DayOfWeek.Sunday    => h.Domingo,
        _                   => false
    };

    public async Task VerificarSLAAsync()
    {
        var ahora = DateTime.UtcNow;

        // Cargar todos los tickets activos con SLA configurado
        var tickets = await _context.Tickets
            .IgnoreQueryFilters()
            .Include(t => t.Estado)
            .Include(t => t.Prioridad)
            .Where(t => t.FechaLimiteSLA.HasValue
                     && !t.Estado.EsFinal
                     && !EstadosPausa.Contains(t.Estado.Nombre))
            .ToListAsync();

        int actualizados = 0;
        foreach (var ticket in tickets)
        {
            var nuevoEstadoSLA = CalcularSLAEstado(ticket, ahora);
            if (ticket.SLAEstado != nuevoEstadoSLA)
            {
                ticket.SLAEstado = nuevoEstadoSLA;
                actualizados++;
            }
        }

        if (actualizados > 0)
        {
            await _context.SaveChangesAsync();
            _logger.LogInformation("SLA verificado: {Count} tickets actualizados.", actualizados);
        }
    }

    public async Task PausarSLAAsync(Ticket ticket)
    {
        if (ticket.FechaInicioUltimaPausa == null)
        {
            ticket.FechaInicioUltimaPausa = DateTime.UtcNow;
            await _context.SaveChangesAsync();
        }
    }

    public async Task ReanudarSLAAsync(Ticket ticket)
    {
        if (ticket.FechaInicioUltimaPausa.HasValue && ticket.FechaLimiteSLA.HasValue)
        {
            var minutosPausados = (int)(DateTime.UtcNow - ticket.FechaInicioUltimaPausa.Value).TotalMinutes;
            ticket.TiempoPausadoMinutos += minutosPausados;
            ticket.FechaLimiteSLA = ticket.FechaLimiteSLA.Value.AddMinutes(minutosPausados);
            ticket.FechaInicioUltimaPausa = null;
            await _context.SaveChangesAsync();
        }
    }

    private static SLAEstado CalcularSLAEstado(Ticket ticket, DateTime ahora)
    {
        if (!ticket.FechaLimiteSLA.HasValue) return SLAEstado.EnTiempo;

        var limite = ticket.FechaLimiteSLA.Value;
        if (ahora >= limite) return SLAEstado.Vencido;

        // En riesgo si consumió más del 80% del tiempo total
        var tiempoTotal = (limite - ticket.FechaCreacion).TotalMinutes;
        var tiempoConsumido = (ahora - ticket.FechaCreacion).TotalMinutes;
        if (tiempoTotal > 0 && tiempoConsumido / tiempoTotal >= 0.80)
            return SLAEstado.EnRiesgo;

        return SLAEstado.EnTiempo;
    }
}
