using DeskFlow.Core.DTOs.Problemas;
using DeskFlow.Core.Entities;
using DeskFlow.Core.Enums;
using DeskFlow.Core.Interfaces;
using DeskFlow.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace DeskFlow.Infrastructure.Services;

public class ProblemaService : IProblemaService
{
    private readonly DeskFlowDbContext _db;
    private readonly ITenantContext _tenantContext;
    private readonly INotificacionService _notificaciones;

    public ProblemaService(DeskFlowDbContext db, ITenantContext tenantContext, INotificacionService notificaciones)
    {
        _db = db;
        _tenantContext = tenantContext;
        _notificaciones = notificaciones;
    }

    public async Task<IEnumerable<ProblemaListItemDto>> GetAllAsync(bool? soloErroresConocidos = null, Guid? responsableId = null)
    {
        var query = _db.Problemas
            .Include(p => p.Estado)
            .Include(p => p.Prioridad)
            .Include(p => p.Categoria)
            .Include(p => p.Responsable)
            .Include(p => p.UsuarioCreador)
            .Include(p => p.Incidentes)
            .AsQueryable();

        if (soloErroresConocidos == true)
            query = query.Where(p => p.EsErrorConocido);
        if (responsableId.HasValue)
            query = query.Where(p => p.ResponsableId == responsableId);

        var list = await query.OrderByDescending(p => p.FechaCreacion).ToListAsync();

        return list.Select(p => new ProblemaListItemDto(
            p.Id, p.Numero, p.Titulo,
            p.Estado.Nombre, p.Estado.Color,
            p.Prioridad.Nombre, p.Prioridad.Color,
            p.Categoria?.Nombre,
            p.Responsable != null ? $"{p.Responsable.Nombre} {p.Responsable.Apellido}" : null,
            $"{p.UsuarioCreador.Nombre} {p.UsuarioCreador.Apellido}",
            p.EsErrorConocido,
            p.Incidentes.Count,
            p.FechaCreacion,
            p.FechaResolucion
        ));
    }

    public async Task<ProblemaDetalleDto> GetByIdAsync(Guid id)
    {
        var p = await _db.Problemas
            .Include(p => p.Estado)
            .Include(p => p.Prioridad)
            .Include(p => p.Categoria)
            .Include(p => p.Responsable)
            .Include(p => p.UsuarioCreador)
            .Include(p => p.Incidentes).ThenInclude(i => i.Ticket).ThenInclude(t => t.Estado)
            .Include(p => p.Incidentes).ThenInclude(i => i.VinculadoPor)
            .Include(p => p.Historial).ThenInclude(h => h.Usuario)
            .FirstOrDefaultAsync(p => p.Id == id)
            ?? throw new KeyNotFoundException("Problema no encontrado.");

        return MapToDetalle(p);
    }

    public async Task<IEnumerable<EstadoProblemaDto>> GetEstadosAsync()
    {
        var estados = await _db.EstadosProblema.OrderBy(e => e.Orden).ToListAsync();
        return estados.Select(e => new EstadoProblemaDto(e.Id, e.Nombre, e.Color, e.Orden, e.EsFinal));
    }

    public async Task<ProblemaDetalleDto> CreateAsync(CreateProblemaDto dto)
    {
        var estadoInicial = await _db.EstadosProblema.OrderBy(e => e.Orden).FirstAsync();
        var numero = await GenerarNumeroAsync();

        var problema = new Problema
        {
            Id = Guid.NewGuid(),
            TenantId = _tenantContext.TenantId,
            Numero = numero,
            Titulo = dto.Titulo,
            Descripcion = dto.Descripcion,
            EstadoId = estadoInicial.Id,
            PrioridadId = dto.PrioridadId,
            CategoriaId = dto.CategoriaId,
            ResponsableId = dto.ResponsableId,
            UsuarioCreadorId = _tenantContext.UsuarioId,
            FechaCreacion = DateTime.UtcNow
        };

        _db.Problemas.Add(problema);

        if (dto.TicketOrigenId.HasValue)
        {
            _db.ProblemaIncidentes.Add(new ProblemaIncidente
            {
                Id = Guid.NewGuid(),
                TenantId = _tenantContext.TenantId,
                ProblemaId = problema.Id,
                TicketId = dto.TicketOrigenId.Value,
                VinculadoPorId = _tenantContext.UsuarioId,
                FechaVinculacion = DateTime.UtcNow
            });
        }

        _db.HistorialProblemas.Add(new HistorialProblema
        {
            Id = Guid.NewGuid(),
            TenantId = _tenantContext.TenantId,
            ProblemaId = problema.Id,
            UsuarioId = _tenantContext.UsuarioId,
            Accion = "Problema creado",
            Detalle = dto.Titulo,
            FechaAccion = DateTime.UtcNow
        });

        await _db.SaveChangesAsync();

        if (dto.ResponsableId.HasValue)
        {
            await _notificaciones.NotificarAsync(
                _tenantContext.TenantId, dto.ResponsableId.Value,
                "Problema asignado",
                $"Se te asignó el problema {numero}: {dto.Titulo}",
                TipoNotificacion.TicketAsignado, null);
        }

        return await GetByIdAsync(problema.Id);
    }

    public async Task<ProblemaDetalleDto> UpdateAsync(Guid id, UpdateProblemaDto dto)
    {
        var p = await _db.Problemas
            .Include(x => x.Estado)
            .FirstOrDefaultAsync(x => x.Id == id)
            ?? throw new KeyNotFoundException("Problema no encontrado.");

        var cambios = new List<string>();

        if (dto.Titulo != null && dto.Titulo != p.Titulo) { cambios.Add($"Título: {p.Titulo} → {dto.Titulo}"); p.Titulo = dto.Titulo; }
        if (dto.Descripcion != null && dto.Descripcion != p.Descripcion) p.Descripcion = dto.Descripcion;
        if (dto.PrioridadId.HasValue && dto.PrioridadId != p.PrioridadId) p.PrioridadId = dto.PrioridadId.Value;
        if (dto.CategoriaId != p.CategoriaId) p.CategoriaId = dto.CategoriaId;
        if (dto.ResponsableId != p.ResponsableId) p.ResponsableId = dto.ResponsableId;
        if (dto.CausaRaiz != null) { p.CausaRaiz = dto.CausaRaiz; cambios.Add("Causa raíz actualizada"); }
        if (dto.Workaround != null) { p.Workaround = dto.Workaround; cambios.Add("Workaround actualizado"); }
        if (dto.Solucion != null) { p.Solucion = dto.Solucion; cambios.Add("Solución actualizada"); }
        if (dto.EsErrorConocido.HasValue && dto.EsErrorConocido != p.EsErrorConocido)
        {
            p.EsErrorConocido = dto.EsErrorConocido.Value;
            cambios.Add(p.EsErrorConocido ? "Marcado como Error Conocido" : "Removido de Errores Conocidos");
        }
        if (dto.EstadoId.HasValue && dto.EstadoId != p.EstadoId)
        {
            var estadoAnterior = p.Estado?.Nombre ?? "—";
            p.EstadoId = dto.EstadoId.Value;
            var estadoNuevo = await _db.EstadosProblema.FindAsync(dto.EstadoId.Value);
            cambios.Add($"Estado: {estadoAnterior} → {estadoNuevo?.Nombre}");
        }

        if (cambios.Any())
        {
            _db.HistorialProblemas.Add(new HistorialProblema
            {
                Id = Guid.NewGuid(), TenantId = _tenantContext.TenantId, ProblemaId = p.Id,
                UsuarioId = _tenantContext.UsuarioId, Accion = "Problema actualizado",
                Detalle = string.Join("; ", cambios), FechaAccion = DateTime.UtcNow
            });
        }

        await _db.SaveChangesAsync();
        return await GetByIdAsync(id);
    }

    public async Task<ProblemaDetalleDto> VincularIncidenteAsync(Guid problemaId, Guid ticketId)
    {
        var problema = await _db.Problemas.FindAsync(problemaId)
            ?? throw new KeyNotFoundException("Problema no encontrado.");

        var ticket = await _db.Tickets.FindAsync(ticketId)
            ?? throw new KeyNotFoundException("Ticket no encontrado.");

        var yaVinculado = await _db.ProblemaIncidentes
            .AnyAsync(pi => pi.ProblemaId == problemaId && pi.TicketId == ticketId);

        if (!yaVinculado)
        {
            _db.ProblemaIncidentes.Add(new ProblemaIncidente
            {
                Id = Guid.NewGuid(), TenantId = _tenantContext.TenantId,
                ProblemaId = problemaId, TicketId = ticketId,
                VinculadoPorId = _tenantContext.UsuarioId,
                FechaVinculacion = DateTime.UtcNow
            });

            _db.HistorialProblemas.Add(new HistorialProblema
            {
                Id = Guid.NewGuid(), TenantId = _tenantContext.TenantId, ProblemaId = problemaId,
                UsuarioId = _tenantContext.UsuarioId, Accion = "Incidente vinculado",
                Detalle = $"Ticket {ticket.Numero}: {ticket.Asunto}", FechaAccion = DateTime.UtcNow
            });

            await _db.SaveChangesAsync();
        }

        return await GetByIdAsync(problemaId);
    }

    public async Task DesvincularIncidenteAsync(Guid problemaId, Guid ticketId)
    {
        var vinculo = await _db.ProblemaIncidentes
            .FirstOrDefaultAsync(pi => pi.ProblemaId == problemaId && pi.TicketId == ticketId);

        if (vinculo != null)
        {
            _db.ProblemaIncidentes.Remove(vinculo);

            _db.HistorialProblemas.Add(new HistorialProblema
            {
                Id = Guid.NewGuid(), TenantId = _tenantContext.TenantId, ProblemaId = problemaId,
                UsuarioId = _tenantContext.UsuarioId, Accion = "Incidente desvinculado",
                FechaAccion = DateTime.UtcNow
            });

            await _db.SaveChangesAsync();
        }
    }

    public async Task<ProblemaDetalleDto> MarcarErrorConocidoAsync(Guid id)
    {
        var p = await _db.Problemas.FindAsync(id)
            ?? throw new KeyNotFoundException("Problema no encontrado.");

        var estadoErrorConocido = await _db.EstadosProblema
            .FirstOrDefaultAsync(e => e.Nombre == "Error Conocido");

        if (estadoErrorConocido != null)
            p.EstadoId = estadoErrorConocido.Id;

        p.EsErrorConocido = true;

        _db.HistorialProblemas.Add(new HistorialProblema
        {
            Id = Guid.NewGuid(), TenantId = _tenantContext.TenantId, ProblemaId = p.Id,
            UsuarioId = _tenantContext.UsuarioId, Accion = "Marcado como Error Conocido",
            FechaAccion = DateTime.UtcNow
        });

        await _db.SaveChangesAsync();
        return await GetByIdAsync(id);
    }

    public async Task<ProblemaDetalleDto> ResolverAsync(Guid id, ResolverProblemaDto dto)
    {
        var p = await _db.Problemas
            .Include(x => x.Incidentes).ThenInclude(i => i.Ticket)
            .FirstOrDefaultAsync(x => x.Id == id)
            ?? throw new KeyNotFoundException("Problema no encontrado.");

        var estadoResuelto = await _db.EstadosProblema.FirstOrDefaultAsync(e => e.Nombre == "Resuelto")
            ?? throw new InvalidOperationException("Estado 'Resuelto' no encontrado en la base de datos.");

        p.EstadoId = estadoResuelto.Id;
        p.Solucion = dto.Solucion;
        if (dto.CausaRaiz != null) p.CausaRaiz = dto.CausaRaiz;
        p.FechaResolucion = DateTime.UtcNow;
        p.EsErrorConocido = false;

        _db.HistorialProblemas.Add(new HistorialProblema
        {
            Id = Guid.NewGuid(), TenantId = _tenantContext.TenantId, ProblemaId = p.Id,
            UsuarioId = _tenantContext.UsuarioId, Accion = "Problema resuelto",
            Detalle = dto.Solucion, FechaAccion = DateTime.UtcNow
        });

        await _db.SaveChangesAsync();

        if (dto.ActualizarIncidentesVinculados && p.Incidentes.Any())
        {
            var creadores = p.Incidentes.Select(i => i.Ticket.UsuarioCreadorId).Distinct().ToList();
            await _notificaciones.NotificarMultiplesAsync(
                _tenantContext.TenantId, creadores,
                $"Problema {p.Numero} resuelto",
                $"El problema que afectaba tu ticket fue resuelto: {dto.Solucion}",
                TipoNotificacion.TicketResuelto, null);
        }

        return await GetByIdAsync(id);
    }

    public async Task<ProblemaDetalleDto> CerrarAsync(Guid id)
    {
        var p = await _db.Problemas.FindAsync(id)
            ?? throw new KeyNotFoundException("Problema no encontrado.");

        var estadoCerrado = await _db.EstadosProblema.FirstOrDefaultAsync(e => e.Nombre == "Cerrado")
            ?? throw new InvalidOperationException("Estado 'Cerrado' no encontrado en la base de datos.");

        p.EstadoId = estadoCerrado.Id;
        p.FechaCierre = DateTime.UtcNow;

        _db.HistorialProblemas.Add(new HistorialProblema
        {
            Id = Guid.NewGuid(), TenantId = _tenantContext.TenantId, ProblemaId = p.Id,
            UsuarioId = _tenantContext.UsuarioId, Accion = "Problema cerrado",
            FechaAccion = DateTime.UtcNow
        });

        await _db.SaveChangesAsync();
        return await GetByIdAsync(id);
    }

    private async Task<string> GenerarNumeroAsync()
    {
        var result = await _db.Database
            .SqlQueryRaw<long>("SELECT nextval('seq_problema_numero') AS \"Value\"")
            .FirstAsync();
        return $"PBM-{result:D5}";
    }

    private ProblemaDetalleDto MapToDetalle(Problema p) => new(
        p.Id, p.Numero, p.Titulo, p.Descripcion,
        p.EstadoId, p.Estado.Nombre, p.Estado.Color, p.Estado.EsFinal,
        p.PrioridadId, p.Prioridad.Nombre, p.Prioridad.Color,
        p.CategoriaId, p.Categoria?.Nombre,
        p.ResponsableId,
        p.Responsable != null ? $"{p.Responsable.Nombre} {p.Responsable.Apellido}" : null,
        p.UsuarioCreadorId,
        $"{p.UsuarioCreador.Nombre} {p.UsuarioCreador.Apellido}",
        p.CausaRaiz, p.Workaround, p.Solucion,
        p.EsErrorConocido,
        p.FechaCreacion, p.FechaIdentificacion, p.FechaResolucion, p.FechaCierre,
        p.Incidentes.Select(i => new IncidenteVinculadoDto(
            i.Id, i.TicketId, i.Ticket.Numero, i.Ticket.Asunto,
            i.Ticket.Estado.Nombre, i.Ticket.Estado.Color,
            i.VinculadoPor != null ? $"{i.VinculadoPor.Nombre} {i.VinculadoPor.Apellido}" : null,
            i.FechaVinculacion)),
        p.Historial.OrderByDescending(h => h.FechaAccion).Select(h => new HistorialProblemaDto(
            h.Id, h.Accion, h.Detalle,
            h.Usuario != null ? $"{h.Usuario.Nombre} {h.Usuario.Apellido}" : null,
            h.FechaAccion))
    );
}
