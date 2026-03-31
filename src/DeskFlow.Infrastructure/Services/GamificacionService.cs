using System.Text.Json;
using DeskFlow.Core.DTOs.Gamificacion;
using DeskFlow.Core.Entities;
using DeskFlow.Core.Enums;
using DeskFlow.Core.Interfaces;
using DeskFlow.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace DeskFlow.Infrastructure.Services;

public class GamificacionService : IGamificacionService
{
    private readonly DeskFlowDbContext _db;
    private readonly ITenantContext _tenantContext;

    public GamificacionService(DeskFlowDbContext db, ITenantContext tenantContext)
    {
        _db = db;
        _tenantContext = tenantContext;
    }

    // ── Ranking ────────────────────────────────────────────────
    public async Task<List<RankingItemDto>> GetRankingAsync(string periodo)
    {
        var desde = periodo switch
        {
            "semana" => DateTime.UtcNow.AddDays(-7),
            "mes"    => DateTime.UtcNow.AddDays(-30),
            _        => (DateTime?)null
        };

        var rolesStaff = new[] { "Agente", "Supervisor", "Administrador" };
        var agentes = await _db.Usuarios
            .Include(u => u.Rol)
            .Where(u => u.Activo && rolesStaff.Contains(u.Rol.Nombre))
            .ToListAsync();

        var estadosFinalIds = await _db.EstadosTicket.Where(e => e.EsFinal).Select(e => e.Id).ToListAsync();

        var tickets = _db.Tickets
            .Where(t => t.TecnicoAsignadoId.HasValue && estadosFinalIds.Contains(t.EstadoId));
        if (desde.HasValue) tickets = tickets.Where(t => t.FechaResolucion >= desde);

        var ticketsList = await tickets.ToListAsync();

        var encuestas = _db.EncuestaRespuestas.Where(e => e.TecnicoId.HasValue && e.Puntuacion.HasValue);
        if (desde.HasValue) encuestas = encuestas.Where(e => e.FechaRespuesta >= desde);
        var encuestasList = await encuestas.ToListAsync();

        var logrosAgente = await _db.LogrosAgente
            .Include(la => la.Logro)
            .ToListAsync();

        var items = agentes.Select(a =>
        {
            var mis = ticketsList.Where(t => t.TecnicoAsignadoId == a.Id).ToList();
            var resueltos = mis.Count;
            var enSLA = mis.Count(t => t.SLAEstado != SLAEstado.Vencido);
            var pctSLA = resueltos > 0 ? (double)enSLA / resueltos * 100 : 0;

            var misEnc = encuestasList.Where(e => e.TecnicoId == a.Id).ToList();
            double? avgCsat = misEnc.Any() ? misEnc.Average(e => (double)e.Puntuacion!) : null;

            var tiempos = mis
                .Where(t => t.FechaAsignacion.HasValue && t.FechaResolucion.HasValue)
                .Select(t => (t.FechaResolucion!.Value - t.FechaAsignacion!.Value).TotalHours)
                .ToList();
            var avgHoras = tiempos.Any() ? (int)tiempos.Average() : 0;

            var puntos = resueltos * 10 + enSLA * 5 + (avgCsat.HasValue ? (int)(avgCsat.Value * 8) : 0);

            var logros = logrosAgente
                .Where(la => la.UsuarioId == a.Id)
                .Select(la => new LogroResumenDto(la.Logro.Icono, la.Logro.Nombre))
                .ToList();

            return new { Agente = a, Resueltos = resueltos, EnSLA = enSLA, PctSLA = pctSLA, AvgCsat = avgCsat, AvgHoras = avgHoras, Puntos = puntos, Logros = logros };
        })
        .OrderByDescending(x => x.Puntos)
        .ToList();

        return items.Select((x, i) => new RankingItemDto(
            i + 1,
            x.Agente.Id,
            $"{x.Agente.Nombre} {x.Agente.Apellido}",
            x.Agente.Rol?.Nombre ?? "",
            x.Resueltos,
            x.EnSLA,
            Math.Round(x.PctSLA, 1),
            x.AvgCsat.HasValue ? Math.Round(x.AvgCsat.Value, 2) : null,
            x.AvgHoras,
            x.Puntos,
            x.Logros
        )).ToList();
    }

    public async Task<PerfilGamificacionDto> GetMiPerfilAsync()
    {
        var ranking = await GetRankingAsync("total");
        var mio = ranking.FirstOrDefault(r => r.UsuarioId == _tenantContext.UsuarioId);
        var logros = await GetMisLogrosAsync();
        var usuario = await _db.Usuarios.FindAsync(_tenantContext.UsuarioId);

        return new PerfilGamificacionDto(
            _tenantContext.UsuarioId,
            usuario != null ? $"{usuario.Nombre} {usuario.Apellido}" : "",
            mio?.Posicion ?? 0,
            mio?.Puntos ?? 0,
            mio?.TicketsResueltos ?? 0,
            mio?.PorcentajeSLA ?? 0,
            mio?.PromedioCsat,
            logros
        );
    }

    public async Task<List<LogroDto>> GetMisLogrosAsync()
    {
        var todosLogros = await _db.Logros.OrderBy(l => l.Orden).ToListAsync();
        var obtenidos = await _db.LogrosAgente
            .Where(la => la.UsuarioId == _tenantContext.UsuarioId)
            .ToListAsync();

        return todosLogros.Select(l =>
        {
            var ob = obtenidos.FirstOrDefault(o => o.LogroId == l.Id);
            return new LogroDto(l.Id, l.Clave, l.Nombre, l.Descripcion, l.Icono, l.Criterio, l.PuntosRecompensa, ob != null, ob?.FechaObtenido);
        }).ToList();
    }

    public async Task CheckAndAwardBadgesAsync(Guid usuarioId)
    {
        var estadosFinalIds = await _db.EstadosTicket.Where(e => e.EsFinal).Select(e => e.Id).ToListAsync();
        var tickets = await _db.Tickets.Where(t => t.TecnicoAsignadoId == usuarioId && estadosFinalIds.Contains(t.EstadoId)).ToListAsync();
        var comentarios = await _db.ComentariosTicket.CountAsync(c => c.UsuarioId == usuarioId);
        var encuestas5 = await _db.EncuestaRespuestas.CountAsync(e => e.TecnicoId == usuarioId && e.Puntuacion == 5);

        var resueltos = tickets.Count;
        var enSLA = tickets.Count(t => t.SLAEstado != SLAEstado.Vencido);
        var veloces = tickets.Count(t =>
            t.FechaAsignacion.HasValue && t.FechaResolucion.HasValue &&
            (t.FechaResolucion.Value - t.FechaAsignacion.Value).TotalHours < 2);

        var criterios = new Dictionary<string, bool>
        {
            ["primer_ticket"]   = resueltos >= 1,
            ["cinco_tickets"]   = resueltos >= 5,
            ["diez_tickets"]    = resueltos >= 10,
            ["cincuenta"]       = resueltos >= 50,
            ["centurion"]       = resueltos >= 100,
            ["sla_heroe"]       = enSLA >= 20,
            ["csat_estrella"]   = encuestas5 >= 5,
            ["velocidad"]       = veloces >= 10,
            ["comentarista"]    = comentarios >= 50,
        };

        var logros = await _db.Logros.ToListAsync();
        var obtenidos = await _db.LogrosAgente.Where(la => la.UsuarioId == usuarioId).Select(la => la.LogroId).ToListAsync();

        foreach (var (clave, cumple) in criterios)
        {
            if (!cumple) continue;
            var logro = logros.FirstOrDefault(l => l.Clave == clave);
            if (logro == null || obtenidos.Contains(logro.Id)) continue;

            _db.LogrosAgente.Add(new LogroAgente
            {
                TenantId = _tenantContext.TenantId,
                UsuarioId = usuarioId,
                LogroId = logro.Id,
                FechaObtenido = DateTime.UtcNow,
            });
        }
        await _db.SaveChangesAsync();
    }

    // ── Dashboard personalizado ────────────────────────────────
    static readonly List<WidgetConfigDto> DefaultWidgets =
    [
        new("resumen",           "stats_resumen",        "Resumen general",         true,  1),
        new("tickets_estado",    "tickets_por_estado",   "Tickets por estado",       true,  2),
        new("tickets_prioridad", "tickets_por_prioridad","Tickets por prioridad",    true,  3),
        new("tendencia",         "tendencia_semanal",    "Tendencia semanal",        true,  4),
        new("sla",               "sla_cumplimiento",     "Cumplimiento de SLA",      true,  5),
        new("top_agentes",       "top_agentes",          "Top agentes",              true,  6),
        new("tickets_categoria", "tickets_por_categoria","Tickets por categoría",    false, 7),
        new("csat",              "csat_promedio",        "CSAT promedio",            false, 8),
    ];

    public async Task<List<WidgetConfigDto>> GetMisWidgetsAsync()
    {
        var dash = await _db.DashboardsPersonalizados
            .FirstOrDefaultAsync(d => d.UsuarioId == _tenantContext.UsuarioId);

        if (dash == null) return DefaultWidgets;

        try
        {
            return JsonSerializer.Deserialize<List<WidgetConfigDto>>(dash.WidgetsJson,
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true }) ?? DefaultWidgets;
        }
        catch { return DefaultWidgets; }
    }

    public async Task SaveWidgetsAsync(List<WidgetConfigDto> widgets)
    {
        var dash = await _db.DashboardsPersonalizados
            .FirstOrDefaultAsync(d => d.UsuarioId == _tenantContext.UsuarioId);

        var json = JsonSerializer.Serialize(widgets);

        if (dash == null)
        {
            _db.DashboardsPersonalizados.Add(new DashboardPersonalizado
            {
                TenantId  = _tenantContext.TenantId,
                UsuarioId = _tenantContext.UsuarioId,
                WidgetsJson = json,
                FechaModif  = DateTime.UtcNow,
            });
        }
        else
        {
            dash.WidgetsJson = json;
            dash.FechaModif  = DateTime.UtcNow;
        }
        await _db.SaveChangesAsync();
    }

    // ── Reportes compartidos ───────────────────────────────────
    public async Task<ReporteCompartidoDto> CrearReporteCompartidoAsync(CrearReporteCompartidoDto dto)
    {
        var token = Convert.ToBase64String(Guid.NewGuid().ToByteArray())
            .Replace("/", "_").Replace("+", "-").Replace("=", "");

        var reporte = new ReporteCompartido
        {
            TenantId       = _tenantContext.TenantId,
            Token          = token,
            Titulo         = dto.Titulo,
            ConfigJson     = dto.ConfigJson,
            DatosJson      = dto.DatosJson,
            CreadoPorId    = _tenantContext.UsuarioId,
            FechaCreacion  = DateTime.UtcNow,
            FechaExpiracion = dto.DiasExpiracion.HasValue
                ? DateTime.UtcNow.AddDays(dto.DiasExpiracion.Value)
                : null,
        };

        _db.ReportesCompartidos.Add(reporte);
        await _db.SaveChangesAsync();

        return MapReporte(reporte);
    }

    public async Task<string?> GetDatosReporteCompartidoAsync(string token)
    {
        var r = await _db.ReportesCompartidos
            .FirstOrDefaultAsync(r => r.Token == token);

        if (r == null) return null;
        if (r.FechaExpiracion.HasValue && r.FechaExpiracion < DateTime.UtcNow) return null;
        return r.DatosJson;
    }

    public async Task<List<ReporteCompartidoDto>> GetMisReportesAsync()
    {
        var reportes = await _db.ReportesCompartidos
            .Where(r => r.CreadoPorId == _tenantContext.UsuarioId)
            .OrderByDescending(r => r.FechaCreacion)
            .ToListAsync();
        return reportes.Select(MapReporte).ToList();
    }

    public async Task EliminarReporteCompartidoAsync(Guid id)
    {
        var r = await _db.ReportesCompartidos.FindAsync(id);
        if (r != null) { _db.ReportesCompartidos.Remove(r); await _db.SaveChangesAsync(); }
    }

    private static ReporteCompartidoDto MapReporte(ReporteCompartido r) =>
        new(r.Id, r.Token, r.Titulo, $"/r/{r.Token}", r.FechaCreacion, r.FechaExpiracion);
}
