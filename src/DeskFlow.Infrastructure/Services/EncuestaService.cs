using DeskFlow.Core.DTOs.Encuestas;
using DeskFlow.Core.Entities;
using DeskFlow.Core.Interfaces;
using DeskFlow.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace DeskFlow.Infrastructure.Services;

public class EncuestaService : IEncuestaService
{
    private readonly DeskFlowDbContext _context;
    private readonly ITenantContext _tenant;

    public EncuestaService(DeskFlowDbContext context, ITenantContext tenant)
    {
        _context = context;
        _tenant = tenant;
    }

    public async Task CrearEncuestaPendienteAsync(Guid ticketId, Guid usuarioId, Guid? tecnicoId)
    {
        var existe = await _context.EncuestaRespuestas.AnyAsync(e => e.TicketId == ticketId);
        if (existe) return;

        var encuesta = new EncuestaRespuesta
        {
            TenantId = _tenant.TenantId,
            TicketId = ticketId,
            UsuarioId = usuarioId,
            TecnicoId = tecnicoId,
            FechaCreacion = DateTime.UtcNow
        };

        _context.EncuestaRespuestas.Add(encuesta);
        await _context.SaveChangesAsync();
    }

    public async Task<IEnumerable<EncuestaPendienteDto>> GetPendientesAsync()
    {
        var config = await _context.EncuestaConfiguraciones.FirstOrDefaultAsync()
                     ?? new EncuestaConfiguracion { Pregunta = "¿Cómo evaluaría la atención?", EscalaMinima = 1, EscalaMaxima = 5 };

        return await _context.EncuestaRespuestas
            .Where(e => e.UsuarioId == _tenant.UsuarioId && e.Puntuacion == null)
            .Include(e => e.Ticket)
            .Include(e => e.Tecnico)
            .Select(e => new EncuestaPendienteDto
            {
                Id = e.Id,
                TicketId = e.TicketId,
                TicketNumero = e.Ticket.Numero,
                TicketAsunto = e.Ticket.Asunto,
                Tecnico = e.Tecnico != null ? e.Tecnico.Nombre + " " + e.Tecnico.Apellido : null,
                FechaCierre = e.Ticket.FechaCierre ?? e.FechaCreacion,
                Pregunta = config.Pregunta,
                EscalaMinima = config.EscalaMinima,
                EscalaMaxima = config.EscalaMaxima
            })
            .ToListAsync();
    }

    public async Task<EncuestaRespuestaDto> ResponderAsync(ResponderEncuestaDto dto)
    {
        var encuesta = await _context.EncuestaRespuestas
            .FirstOrDefaultAsync(e => e.Id == dto.EncuestaId && e.UsuarioId == _tenant.UsuarioId)
            ?? throw new KeyNotFoundException("Encuesta no encontrada.");

        if (encuesta.Puntuacion.HasValue)
            throw new InvalidOperationException("Esta encuesta ya fue respondida.");

        encuesta.Puntuacion = dto.Puntuacion;
        encuesta.Comentario = dto.Comentario;
        encuesta.FechaRespuesta = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return new EncuestaRespuestaDto
        {
            Id = encuesta.Id,
            TicketId = encuesta.TicketId,
            Puntuacion = encuesta.Puntuacion.Value,
            Comentario = encuesta.Comentario,
            FechaRespuesta = encuesta.FechaRespuesta.Value
        };
    }

    public async Task<decimal> GetPromedioGeneralAsync()
    {
        var promedio = await _context.EncuestaRespuestas
            .Where(e => e.Puntuacion.HasValue)
            .AverageAsync(e => (decimal?)e.Puntuacion);
        return promedio ?? 0;
    }

    public async Task<IEnumerable<PromedioTecnicoDto>> GetPorTecnicoAsync()
    {
        return await _context.EncuestaRespuestas
            .Where(e => e.Puntuacion.HasValue && e.TecnicoId.HasValue)
            .Include(e => e.Tecnico)
            .GroupBy(e => new { e.TecnicoId, e.Tecnico!.Nombre, e.Tecnico.Apellido })
            .Select(g => new PromedioTecnicoDto
            {
                TecnicoId = g.Key.TecnicoId!.Value,
                Tecnico = g.Key.Nombre + " " + g.Key.Apellido,
                Promedio = (decimal)g.Average(e => e.Puntuacion!.Value),
                TotalEncuestas = g.Count()
            })
            .OrderByDescending(p => p.Promedio)
            .ToListAsync();
    }

    public async Task<IEnumerable<PromedioMesDto>> GetPorMesAsync()
    {
        return await _context.EncuestaRespuestas
            .Where(e => e.Puntuacion.HasValue && e.FechaRespuesta.HasValue)
            .GroupBy(e => new { e.FechaRespuesta!.Value.Year, e.FechaRespuesta.Value.Month })
            .Select(g => new PromedioMesDto
            {
                Anio = g.Key.Year,
                Mes = g.Key.Month,
                Promedio = (decimal)g.Average(e => e.Puntuacion!.Value),
                TotalEncuestas = g.Count()
            })
            .OrderByDescending(p => p.Anio).ThenByDescending(p => p.Mes)
            .Take(12)
            .ToListAsync();
    }

    public async Task<IEnumerable<EncuestaDetalleDto>> GetDetalleAsync(Guid? tecnicoId)
    {
        var query = _context.EncuestaRespuestas
            .Where(e => e.Puntuacion.HasValue)
            .Include(e => e.Ticket)
            .Include(e => e.Usuario)
            .Include(e => e.Tecnico)
            .AsQueryable();

        if (tecnicoId.HasValue)
            query = query.Where(e => e.TecnicoId == tecnicoId.Value);

        return await query
            .OrderByDescending(e => e.FechaRespuesta)
            .Select(e => new EncuestaDetalleDto
            {
                Id = e.Id,
                TicketNumero = e.Ticket.Numero,
                TicketAsunto = e.Ticket.Asunto,
                Usuario = e.Usuario.Nombre + " " + e.Usuario.Apellido,
                Tecnico = e.Tecnico != null ? e.Tecnico.Nombre + " " + e.Tecnico.Apellido : null,
                Puntuacion = e.Puntuacion!.Value,
                Comentario = e.Comentario,
                FechaRespuesta = e.FechaRespuesta!.Value
            })
            .ToListAsync();
    }
}
