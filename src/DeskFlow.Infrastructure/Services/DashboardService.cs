using DeskFlow.Core.DTOs.Dashboard;
using DeskFlow.Core.Enums;
using DeskFlow.Core.Interfaces;
using DeskFlow.Core.Interfaces.Repositories;
using DeskFlow.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace DeskFlow.Infrastructure.Services;

public class DashboardService : IDashboardService
{
    private readonly DeskFlowDbContext _context;
    private readonly ITicketRepository _ticketRepo;

    public DashboardService(DeskFlowDbContext context, ITicketRepository ticketRepo)
    {
        _context = context;
        _ticketRepo = ticketRepo;
    }

    public async Task<DashboardDto> GetDashboardAsync()
    {
        var porEstado = await _ticketRepo.GetCountsByEstadoAsync();
        var porPrioridad = await _ticketRepo.GetCountsByPrioridadAsync();
        var vencidosSLA = await _ticketRepo.GetTicketsVencidosSLAAsync();

        var estadosDb = await _context.EstadosTicket.ToListAsync();
        var prioridadesDb = await _context.Prioridades.ToListAsync();

        var ultimosTickets = await _context.Tickets
            .Include(t => t.Estado)
            .Include(t => t.Prioridad)
            .OrderByDescending(t => t.FechaCreacion)
            .Take(10)
            .Select(t => new TicketRecienteDto
            {
                Id = t.Id,
                Numero = t.Numero,
                Asunto = t.Asunto,
                Estado = t.Estado.Nombre,
                EstadoColor = t.Estado.Color,
                Prioridad = t.Prioridad.Nombre,
                PrioridadColor = t.Prioridad.Color,
                FechaCreacion = t.FechaCreacion
            })
            .ToListAsync();

        var total = porEstado.Values.Sum();
        var abiertos = porEstado.GetValueOrDefault("Nuevo") + porEstado.GetValueOrDefault("Asignado");
        var enProceso = porEstado.GetValueOrDefault("En Proceso");
        var resueltos = porEstado.GetValueOrDefault("Resuelto");
        var cerrados = porEstado.GetValueOrDefault("Cerrado");

        return new DashboardDto
        {
            TotalTickets = total,
            TicketsAbiertos = abiertos,
            TicketsEnProceso = enProceso,
            TicketsResueltos = resueltos,
            TicketsCerrados = cerrados,
            TicketsVencidosSLA = vencidosSLA,
            PorEstado = estadosDb.Select(e => new ContadorEstadoDto
            {
                Estado = e.Nombre,
                Color = e.Color,
                Cantidad = porEstado.GetValueOrDefault(e.Nombre)
            }),
            PorPrioridad = prioridadesDb.Select(p => new ContadorPrioridadDto
            {
                Prioridad = p.Nombre,
                Color = p.Color,
                Cantidad = porPrioridad.GetValueOrDefault(p.Nombre)
            }),
            UltimosTickets = ultimosTickets
        };
    }

    public async Task<DashboardResumenDto> GetResumenAsync()
    {
        var hoy = DateTime.UtcNow.Date;

        var resumen = await _context.Tickets
            .Include(t => t.Estado)
            .GroupBy(_ => 1)
            .Select(g => new DashboardResumenDto
            {
                TotalTickets = g.Count(),
                TicketsAbiertos = g.Count(t => t.Estado.Nombre == "Nuevo" || t.Estado.Nombre == "Asignado"),
                TicketsEnProceso = g.Count(t => t.Estado.Nombre == "En Proceso"),
                TicketsResueltos = g.Count(t => t.Estado.Nombre == "Resuelto"),
                TicketsCerrados = g.Count(t => t.Estado.Nombre == "Cerrado"),
                TicketsVencidosSLA = g.Count(t => t.SLAEstado == SLAEstado.Vencido && !t.Estado.EsFinal),
                TicketsEnRiesgoSLA = g.Count(t => t.SLAEstado == SLAEstado.EnRiesgo && !t.Estado.EsFinal),
                TicketsCreadosHoy = g.Count(t => t.FechaCreacion >= hoy)
            })
            .FirstOrDefaultAsync();

        return resumen ?? new DashboardResumenDto();
    }

    public async Task<IEnumerable<TicketsPorMesDto>> GetTicketsPorMesAsync(int anio)
    {
        var nombres = new[] { "", "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
            "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre" };

        var datos = await _context.Tickets
            .Where(t => t.FechaCreacion.Year == anio)
            .GroupBy(t => t.FechaCreacion.Month)
            .Select(g => new { Mes = g.Key, Cantidad = g.Count() })
            .ToListAsync();

        return Enumerable.Range(1, 12).Select(mes => new TicketsPorMesDto
        {
            Mes = mes,
            NombreMes = nombres[mes],
            Cantidad = datos.FirstOrDefault(d => d.Mes == mes)?.Cantidad ?? 0
        });
    }

    public async Task<IEnumerable<TicketsPorTecnicoDto>> GetTicketsPorTecnicoAsync()
    {
        var estadosFinales = new[] { "Resuelto", "Cerrado", "Cancelado" };

        var tecnicos = await _context.Tickets
            .Include(t => t.TecnicoAsignado)
            .Include(t => t.Estado)
            .Where(t => t.TecnicoAsignadoId.HasValue)
            .GroupBy(t => new { t.TecnicoAsignadoId, t.TecnicoAsignado!.Nombre, t.TecnicoAsignado.Apellido })
            .Select(g => new TicketsPorTecnicoDto
            {
                TecnicoId = g.Key.TecnicoAsignadoId!.Value,
                NombreTecnico = $"{g.Key.Nombre} {g.Key.Apellido}",
                TicketsAbiertos = g.Count(t => !estadosFinales.Contains(t.Estado.Nombre)),
                TicketsResueltos = g.Count(t => t.Estado.Nombre == "Resuelto")
            })
            .OrderByDescending(x => x.TicketsAbiertos)
            .ToListAsync();

        return tecnicos;
    }

    public async Task<IEnumerable<TicketsPorCategoriaDto>> GetTicketsPorCategoriaAsync()
    {
        var total = await _context.Tickets.CountAsync();

        var datos = await _context.Tickets
            .Include(t => t.Categoria)
            .GroupBy(t => t.Categoria.Nombre)
            .Select(g => new { Categoria = g.Key, Cantidad = g.Count() })
            .OrderByDescending(x => x.Cantidad)
            .ToListAsync();

        return datos.Select(d => new TicketsPorCategoriaDto
        {
            Categoria = d.Categoria,
            Cantidad = d.Cantidad,
            Porcentaje = total > 0 ? Math.Round((double)d.Cantidad / total * 100, 1) : 0
        });
    }

    public async Task<IEnumerable<TiempoPromedioDto>> GetTiempoPromedioAsync()
    {
        var resueltos = await _context.Tickets
            .Include(t => t.Prioridad)
            .Where(t => t.FechaResolucion.HasValue)
            .Select(t => new
            {
                t.Prioridad.Nombre,
                t.Prioridad.Color,
                FechaCreacion = t.FechaCreacion,
                FechaResolucion = t.FechaResolucion!.Value
            })
            .ToListAsync();

        var resueltosMapped = resueltos.Select(t => new
        {
            t.Nombre,
            t.Color,
            HorasResolucion = (int)(t.FechaResolucion - t.FechaCreacion).TotalHours
        });

        return resueltosMapped
            .GroupBy(t => new { t.Nombre, t.Color })
            .Select(g => new TiempoPromedioDto
            {
                Prioridad = g.Key.Nombre,
                Color = g.Key.Color,
                PromedioHoras = Math.Round(g.Average(x => (double)x.HorasResolucion), 1),
                TotalResueltos = g.Count()
            })
            .OrderBy(x => x.PromedioHoras)
            .ToList();
    }

    public async Task<IEnumerable<SLACumplimientoDto>> GetSLACumplimientoAsync(int anio)
    {
        var nombres = new[] { "", "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
            "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre" };

        var datos = await _context.Tickets
            .Include(t => t.Estado)
            .Where(t => t.FechaCreacion.Year == anio
                     && t.FechaLimiteSLA.HasValue
                     && t.Estado.EsFinal)
            .Select(t => new
            {
                Mes = t.FechaCreacion.Month,
                CumplidoSLA = t.FechaResolucion.HasValue && t.FechaResolucion <= t.FechaLimiteSLA
            })
            .ToListAsync();

        return Enumerable.Range(1, 12).Select(mes =>
        {
            var del_mes = datos.Where(d => d.Mes == mes).ToList();
            var total = del_mes.Count;
            var cumplidos = del_mes.Count(d => d.CumplidoSLA);

            return new SLACumplimientoDto
            {
                Mes = mes,
                NombreMes = nombres[mes],
                TotalTickets = total,
                CumplidosSLA = cumplidos,
                PorcentajeCumplimiento = total > 0 ? Math.Round((double)cumplidos / total * 100, 1) : 0
            };
        });
    }
}
