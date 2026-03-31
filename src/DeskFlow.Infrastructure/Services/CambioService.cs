using DeskFlow.Core.DTOs.Cambios;
using DeskFlow.Core.Entities;
using DeskFlow.Core.Enums;
using DeskFlow.Core.Interfaces;
using DeskFlow.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace DeskFlow.Infrastructure.Services;

public class CambioService : ICambioService
{
    private readonly DeskFlowDbContext _db;
    private readonly ITenantContext _tenantContext;
    private readonly INotificacionService _notificaciones;

    public CambioService(DeskFlowDbContext db, ITenantContext tenantContext, INotificacionService notificaciones)
    {
        _db = db;
        _tenantContext = tenantContext;
        _notificaciones = notificaciones;
    }

    public async Task<IEnumerable<CambioListItemDto>> GetAllAsync(string? estado = null, Guid? implementadorId = null)
    {
        var query = _db.Cambios
            .Include(c => c.TipoCambio)
            .Include(c => c.Estado)
            .Include(c => c.Prioridad)
            .Include(c => c.Solicitante)
            .Include(c => c.Implementador)
            .Include(c => c.AprobadoresCAB)
            .AsQueryable();

        if (!string.IsNullOrEmpty(estado))
            query = query.Where(c => c.Estado.Nombre == estado);
        if (implementadorId.HasValue)
            query = query.Where(c => c.ImplementadorId == implementadorId);

        var list = await query.OrderByDescending(c => c.FechaCreacion).ToListAsync();

        return list.Select(c => new CambioListItemDto(
            c.Id, c.Numero, c.Titulo,
            c.TipoCambio.Nombre, c.TipoCambio.Color,
            c.Estado.Nombre, c.Estado.Color, c.Estado.EsFinal,
            c.Prioridad.Nombre, c.Prioridad.Color,
            c.Riesgo, c.Impacto,
            $"{c.Solicitante.Nombre} {c.Solicitante.Apellido}",
            c.Implementador != null ? $"{c.Implementador.Nombre} {c.Implementador.Apellido}" : null,
            c.AprobadoresCAB.Count(a => a.Estado == EstadoAprobacionCAB.Pendiente),
            c.FechaCreacion,
            c.FechaInicioPlaneado,
            c.FechaFinPlaneado
        ));
    }

    public async Task<IEnumerable<CambioCalendarioItemDto>> GetCalendarioAsync(DateTime desde, DateTime hasta)
    {
        var list = await _db.Cambios
            .Include(c => c.TipoCambio)
            .Include(c => c.Estado)
            .Include(c => c.Implementador)
            .Where(c => c.FechaInicioPlaneado >= desde && c.FechaInicioPlaneado <= hasta && !c.Estado.EsFinal)
            .OrderBy(c => c.FechaInicioPlaneado)
            .ToListAsync();

        return list.Select(c => new CambioCalendarioItemDto(
            c.Id, c.Numero, c.Titulo,
            c.TipoCambio.Nombre, c.TipoCambio.Color,
            c.Estado.Nombre, c.Estado.Color,
            c.Riesgo,
            c.Implementador != null ? $"{c.Implementador.Nombre} {c.Implementador.Apellido}" : null,
            c.FechaInicioPlaneado, c.FechaFinPlaneado
        ));
    }

    public async Task<CambioDetalleDto> GetByIdAsync(Guid id)
    {
        var c = await _db.Cambios
            .Include(c => c.TipoCambio)
            .Include(c => c.Estado)
            .Include(c => c.Prioridad)
            .Include(c => c.Categoria)
            .Include(c => c.Solicitante)
            .Include(c => c.Implementador)
            .Include(c => c.AprobadoresCAB).ThenInclude(a => a.Aprobador)
            .Include(c => c.Historial).ThenInclude(h => h.Usuario)
            .FirstOrDefaultAsync(c => c.Id == id)
            ?? throw new KeyNotFoundException("Cambio no encontrado.");

        return MapToDetalle(c);
    }

    public async Task<IEnumerable<TipoCambioDto>> GetTiposAsync()
    {
        var tipos = await _db.TiposCambio.OrderBy(t => t.Orden).ToListAsync();
        return tipos.Select(t => new TipoCambioDto(t.Id, t.Nombre, t.Descripcion, t.Color));
    }

    public async Task<IEnumerable<EstadoCambioDto>> GetEstadosAsync()
    {
        var estados = await _db.EstadosCambio.OrderBy(e => e.Orden).ToListAsync();
        return estados.Select(e => new EstadoCambioDto(e.Id, e.Nombre, e.Color, e.Orden, e.EsFinal));
    }

    public async Task<CambioDetalleDto> CreateAsync(CreateCambioDto dto)
    {
        var estadoInicial = await _db.EstadosCambio.OrderBy(e => e.Orden).FirstAsync();
        var numero = await GenerarNumeroAsync();

        var cambio = new Cambio
        {
            Id = Guid.NewGuid(),
            TenantId = _tenantContext.TenantId,
            Numero = numero,
            Titulo = dto.Titulo,
            Descripcion = dto.Descripcion,
            TipoCambioId = dto.TipoCambioId,
            EstadoId = estadoInicial.Id,
            PrioridadId = dto.PrioridadId,
            CategoriaId = dto.CategoriaId,
            SolicitanteId = _tenantContext.UsuarioId,
            ImplementadorId = dto.ImplementadorId,
            Riesgo = dto.Riesgo,
            Impacto = dto.Impacto,
            Urgencia = dto.Urgencia,
            DescripcionImpacto = dto.DescripcionImpacto,
            PlanImplementacion = dto.PlanImplementacion,
            PlanPruebas = dto.PlanPruebas,
            PlanBackout = dto.PlanBackout,
            FechaInicioPlaneado = dto.FechaInicioPlaneado,
            FechaFinPlaneado = dto.FechaFinPlaneado,
            FechaCreacion = DateTime.UtcNow
        };

        _db.Cambios.Add(cambio);

        _db.HistorialCambios.Add(new HistorialCambio
        {
            Id = Guid.NewGuid(), TenantId = _tenantContext.TenantId,
            CambioId = cambio.Id, UsuarioId = _tenantContext.UsuarioId,
            Accion = "RFC creado", Detalle = dto.Titulo, FechaAccion = DateTime.UtcNow
        });

        await _db.SaveChangesAsync();
        return await GetByIdAsync(cambio.Id);
    }

    public async Task<CambioDetalleDto> UpdateAsync(Guid id, UpdateCambioDto dto)
    {
        var c = await _db.Cambios.Include(x => x.Estado).FirstOrDefaultAsync(x => x.Id == id)
            ?? throw new KeyNotFoundException("Cambio no encontrado.");

        if (c.Estado.EsFinal)
            throw new InvalidOperationException("No se puede modificar un cambio en estado final.");

        var cambios = new List<string>();

        if (dto.Titulo != null && dto.Titulo != c.Titulo) { cambios.Add($"Título actualizado"); c.Titulo = dto.Titulo; }
        if (dto.Descripcion != null) c.Descripcion = dto.Descripcion;
        if (dto.TipoCambioId.HasValue) c.TipoCambioId = dto.TipoCambioId.Value;
        if (dto.PrioridadId.HasValue) c.PrioridadId = dto.PrioridadId.Value;
        if (dto.CategoriaId != c.CategoriaId) c.CategoriaId = dto.CategoriaId;
        if (dto.ImplementadorId != c.ImplementadorId) { c.ImplementadorId = dto.ImplementadorId; cambios.Add("Implementador actualizado"); }
        if (dto.Riesgo != null) { cambios.Add($"Riesgo: {c.Riesgo} → {dto.Riesgo}"); c.Riesgo = dto.Riesgo; }
        if (dto.Impacto != null) c.Impacto = dto.Impacto;
        if (dto.Urgencia != null) c.Urgencia = dto.Urgencia;
        if (dto.DescripcionImpacto != null) c.DescripcionImpacto = dto.DescripcionImpacto;
        if (dto.PlanImplementacion != null) { c.PlanImplementacion = dto.PlanImplementacion; cambios.Add("Plan de implementación actualizado"); }
        if (dto.PlanPruebas != null) c.PlanPruebas = dto.PlanPruebas;
        if (dto.PlanBackout != null) { c.PlanBackout = dto.PlanBackout; cambios.Add("Plan de backout actualizado"); }
        if (dto.FechaInicioPlaneado.HasValue) c.FechaInicioPlaneado = dto.FechaInicioPlaneado;
        if (dto.FechaFinPlaneado.HasValue) c.FechaFinPlaneado = dto.FechaFinPlaneado;

        if (cambios.Any())
        {
            _db.HistorialCambios.Add(new HistorialCambio
            {
                Id = Guid.NewGuid(), TenantId = _tenantContext.TenantId, CambioId = c.Id,
                UsuarioId = _tenantContext.UsuarioId, Accion = "RFC actualizado",
                Detalle = string.Join("; ", cambios), FechaAccion = DateTime.UtcNow
            });
        }

        await _db.SaveChangesAsync();
        return await GetByIdAsync(id);
    }

    public async Task<CambioDetalleDto> EnviarACABAsync(Guid id, EnviarCABDto dto)
    {
        var c = await _db.Cambios.Include(x => x.TipoCambio).FirstOrDefaultAsync(x => x.Id == id)
            ?? throw new KeyNotFoundException("Cambio no encontrado.");

        var estadoCAB = await _db.EstadosCambio.FirstOrDefaultAsync(e => e.Nombre == "Enviado a CAB")
            ?? throw new InvalidOperationException("Estado 'Enviado a CAB' no encontrado.");

        c.EstadoId = estadoCAB.Id;

        // Auto-add Supervisors and Admins as CAB members if no explicit list
        IEnumerable<Guid> aprobadoresIds;
        if (dto.AprobadoresIds != null && dto.AprobadoresIds.Any())
        {
            aprobadoresIds = dto.AprobadoresIds;
        }
        else
        {
            aprobadoresIds = await _db.Usuarios
                .Where(u => u.Rol.Nombre == "Supervisor" || u.Rol.Nombre == "Administrador")
                .Select(u => u.Id)
                .ToListAsync();
        }

        // Remove existing pending approvers
        var existentes = await _db.AprobadoresCAB.Where(a => a.CambioId == id).ToListAsync();
        _db.AprobadoresCAB.RemoveRange(existentes);

        foreach (var aprobadorId in aprobadoresIds.Distinct())
        {
            _db.AprobadoresCAB.Add(new AprobadorCAB
            {
                Id = Guid.NewGuid(), TenantId = _tenantContext.TenantId,
                CambioId = id, AprobadorId = aprobadorId,
                Estado = EstadoAprobacionCAB.Pendiente, FechaCreacion = DateTime.UtcNow
            });
        }

        _db.HistorialCambios.Add(new HistorialCambio
        {
            Id = Guid.NewGuid(), TenantId = _tenantContext.TenantId, CambioId = id,
            UsuarioId = _tenantContext.UsuarioId, Accion = "Enviado a revisión CAB",
            Detalle = $"{aprobadoresIds.Count()} aprobadores notificados", FechaAccion = DateTime.UtcNow
        });

        await _db.SaveChangesAsync();

        // Notify CAB members
        await _notificaciones.NotificarMultiplesAsync(
            _tenantContext.TenantId, aprobadoresIds,
            $"RFC pendiente de aprobación: {c.Numero}",
            $"El cambio '{c.Titulo}' requiere tu aprobación en el CAB.",
            TipoNotificacion.TicketCreado, null);

        return await GetByIdAsync(id);
    }

    public async Task<CambioDetalleDto> VotarCABAsync(Guid id, VotarCABDto dto)
    {
        var voto = await _db.AprobadoresCAB
            .Include(a => a.Cambio)
            .FirstOrDefaultAsync(a => a.CambioId == id && a.AprobadorId == _tenantContext.UsuarioId)
            ?? throw new KeyNotFoundException("No sos parte del CAB para este cambio o ya votaste.");

        voto.Estado = dto.Aprobado ? EstadoAprobacionCAB.Aprobado : EstadoAprobacionCAB.Rechazado;
        voto.Comentario = dto.Comentario;
        voto.FechaDecision = DateTime.UtcNow;

        _db.HistorialCambios.Add(new HistorialCambio
        {
            Id = Guid.NewGuid(), TenantId = _tenantContext.TenantId, CambioId = id,
            UsuarioId = _tenantContext.UsuarioId,
            Accion = dto.Aprobado ? "CAB: Aprobado" : "CAB: Rechazado",
            Detalle = dto.Comentario, FechaAccion = DateTime.UtcNow
        });

        await _db.SaveChangesAsync();

        // Check if all voted
        var todos = await _db.AprobadoresCAB.Where(a => a.CambioId == id).ToListAsync();
        var hayRechazado = todos.Any(a => a.Estado == EstadoAprobacionCAB.Rechazado);
        var todosAprobaron = todos.All(a => a.Estado == EstadoAprobacionCAB.Aprobado);

        var cambio = await _db.Cambios.FindAsync(id)!;

        if (hayRechazado)
        {
            var estadoRechazado = await _db.EstadosCambio.FirstOrDefaultAsync(e => e.Nombre == "Rechazado");
            if (estadoRechazado != null) cambio!.EstadoId = estadoRechazado.Id;

            _db.HistorialCambios.Add(new HistorialCambio
            {
                Id = Guid.NewGuid(), TenantId = _tenantContext.TenantId, CambioId = id,
                Accion = "RFC rechazado por el CAB", FechaAccion = DateTime.UtcNow
            });

            await _notificaciones.NotificarAsync(_tenantContext.TenantId, cambio!.SolicitanteId,
                $"RFC {cambio.Numero} rechazado",
                $"El CAB rechazó el cambio '{cambio.Titulo}'.",
                TipoNotificacion.TicketRechazado, null);
        }
        else if (todosAprobaron)
        {
            var estadoAprobado = await _db.EstadosCambio.FirstOrDefaultAsync(e => e.Nombre == "Aprobado por CAB");
            if (estadoAprobado != null) cambio!.EstadoId = estadoAprobado.Id;

            _db.HistorialCambios.Add(new HistorialCambio
            {
                Id = Guid.NewGuid(), TenantId = _tenantContext.TenantId, CambioId = id,
                Accion = "RFC aprobado por el CAB", FechaAccion = DateTime.UtcNow
            });

            await _notificaciones.NotificarAsync(_tenantContext.TenantId, cambio!.SolicitanteId,
                $"RFC {cambio.Numero} aprobado por el CAB",
                $"El CAB aprobó el cambio '{cambio.Titulo}'. Ya puede iniciar la implementación.",
                TipoNotificacion.TicketAprobado, null);
        }

        await _db.SaveChangesAsync();
        return await GetByIdAsync(id);
    }

    public async Task<CambioDetalleDto> IniciarImplementacionAsync(Guid id, IniciarImplementacionDto dto)
    {
        var c = await _db.Cambios.Include(x => x.Estado).FirstOrDefaultAsync(x => x.Id == id)
            ?? throw new KeyNotFoundException("Cambio no encontrado.");

        var estadoImpl = await _db.EstadosCambio.FirstOrDefaultAsync(e => e.Nombre == "En Implementación")
            ?? throw new InvalidOperationException("Estado no encontrado.");

        c.EstadoId = estadoImpl.Id;
        c.FechaInicioReal = DateTime.UtcNow;

        _db.HistorialCambios.Add(new HistorialCambio
        {
            Id = Guid.NewGuid(), TenantId = _tenantContext.TenantId, CambioId = id,
            UsuarioId = _tenantContext.UsuarioId, Accion = "Implementación iniciada",
            Detalle = dto.Comentario, FechaAccion = DateTime.UtcNow
        });

        await _db.SaveChangesAsync();
        return await GetByIdAsync(id);
    }

    public async Task<CambioDetalleDto> CompletarImplementacionAsync(Guid id, CompletarImplementacionDto dto)
    {
        var c = await _db.Cambios.FindAsync(id)
            ?? throw new KeyNotFoundException("Cambio no encontrado.");

        var estadoPostImpl = await _db.EstadosCambio.FirstOrDefaultAsync(e => e.Nombre == "Revisión Post-Impl.")
            ?? throw new InvalidOperationException("Estado no encontrado.");

        c.EstadoId = estadoPostImpl.Id;
        c.FechaFinReal = DateTime.UtcNow;
        c.ResultadoPostImpl = dto.ResultadoPostImpl;

        _db.HistorialCambios.Add(new HistorialCambio
        {
            Id = Guid.NewGuid(), TenantId = _tenantContext.TenantId, CambioId = id,
            UsuarioId = _tenantContext.UsuarioId, Accion = "Implementación completada",
            Detalle = dto.ResultadoPostImpl, FechaAccion = DateTime.UtcNow
        });

        // Notify solicitante
        await _notificaciones.NotificarAsync(_tenantContext.TenantId, c.SolicitanteId,
            $"RFC {c.Numero} implementado",
            $"El cambio '{c.Titulo}' fue implementado y está en revisión post-implementación.",
            TipoNotificacion.TicketResuelto, null);

        await _db.SaveChangesAsync();
        return await GetByIdAsync(id);
    }

    public async Task<CambioDetalleDto> CerrarAsync(Guid id)
    {
        var c = await _db.Cambios.FindAsync(id)
            ?? throw new KeyNotFoundException("Cambio no encontrado.");

        var estadoCerrado = await _db.EstadosCambio.FirstOrDefaultAsync(e => e.Nombre == "Cerrado")
            ?? throw new InvalidOperationException("Estado no encontrado.");

        c.EstadoId = estadoCerrado.Id;
        c.FechaCierre = DateTime.UtcNow;

        _db.HistorialCambios.Add(new HistorialCambio
        {
            Id = Guid.NewGuid(), TenantId = _tenantContext.TenantId, CambioId = id,
            UsuarioId = _tenantContext.UsuarioId, Accion = "Cambio cerrado", FechaAccion = DateTime.UtcNow
        });

        await _db.SaveChangesAsync();
        return await GetByIdAsync(id);
    }

    public async Task<CambioDetalleDto> RechazarAsync(Guid id, string? motivo)
    {
        var c = await _db.Cambios.FindAsync(id)
            ?? throw new KeyNotFoundException("Cambio no encontrado.");

        var estadoRechazado = await _db.EstadosCambio.FirstOrDefaultAsync(e => e.Nombre == "Rechazado")
            ?? throw new InvalidOperationException("Estado no encontrado.");

        c.EstadoId = estadoRechazado.Id;

        _db.HistorialCambios.Add(new HistorialCambio
        {
            Id = Guid.NewGuid(), TenantId = _tenantContext.TenantId, CambioId = id,
            UsuarioId = _tenantContext.UsuarioId, Accion = "RFC rechazado",
            Detalle = motivo, FechaAccion = DateTime.UtcNow
        });

        await _db.SaveChangesAsync();
        return await GetByIdAsync(id);
    }

    private async Task<string> GenerarNumeroAsync()
    {
        var result = await _db.Database
            .SqlQueryRaw<long>("SELECT nextval('seq_cambio_numero') AS \"Value\"")
            .FirstAsync();
        return $"CHG-{result:D5}";
    }

    private static string EstadoAprobacionNombre(EstadoAprobacionCAB e) => e switch
    {
        EstadoAprobacionCAB.Aprobado => "Aprobado",
        EstadoAprobacionCAB.Rechazado => "Rechazado",
        _ => "Pendiente"
    };

    private CambioDetalleDto MapToDetalle(Cambio c) => new(
        c.Id, c.Numero, c.Titulo, c.Descripcion,
        c.TipoCambioId, c.TipoCambio.Nombre, c.TipoCambio.Color,
        c.EstadoId, c.Estado.Nombre, c.Estado.Color, c.Estado.EsFinal,
        c.PrioridadId, c.Prioridad.Nombre, c.Prioridad.Color,
        c.CategoriaId, c.Categoria?.Nombre,
        c.SolicitanteId, $"{c.Solicitante.Nombre} {c.Solicitante.Apellido}",
        c.ImplementadorId,
        c.Implementador != null ? $"{c.Implementador.Nombre} {c.Implementador.Apellido}" : null,
        c.Riesgo, c.Impacto, c.Urgencia,
        c.DescripcionImpacto, c.PlanImplementacion, c.PlanPruebas, c.PlanBackout,
        c.ResultadoPostImpl,
        c.FechaCreacion, c.FechaInicioPlaneado, c.FechaFinPlaneado,
        c.FechaInicioReal, c.FechaFinReal, c.FechaCierre,
        c.AprobadoresCAB.Select(a => new AprobadorCABDto(
            a.Id, a.AprobadorId,
            $"{a.Aprobador.Nombre} {a.Aprobador.Apellido}",
            (int)a.Estado, EstadoAprobacionNombre(a.Estado),
            a.Comentario, a.FechaDecision)),
        c.Historial.OrderByDescending(h => h.FechaAccion).Select(h => new HistorialCambioDto(
            h.Id, h.Accion, h.Detalle,
            h.Usuario != null ? $"{h.Usuario.Nombre} {h.Usuario.Apellido}" : null,
            h.FechaAccion))
    );
}
