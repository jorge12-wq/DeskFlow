using DeskFlow.Core.DTOs.Tickets;
using DeskFlow.Core.Entities;
using DeskFlow.Core.Enums;
using DeskFlow.Core.Interfaces;
using DeskFlow.Core.Interfaces.Repositories;
using DeskFlow.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace DeskFlow.Infrastructure.Services;

public class TicketService : ITicketService
{
    private readonly DeskFlowDbContext _context;
    private readonly ITicketRepository _repo;
    private readonly ITenantContext _tenantContext;
    private readonly ISLAService _slaService;
    private readonly INotificacionService _notificaciones;
    private readonly IAsignacionService _asignacion;

    // Estados que pausan el SLA
    private static readonly string[] EstadosPausa = ["Pendiente de Usuario", "Pendiente de Proveedor"];

    public TicketService(DeskFlowDbContext context, ITicketRepository repo, ITenantContext tenantContext,
        ISLAService slaService, INotificacionService notificaciones, IAsignacionService asignacion)
    {
        _context = context;
        _repo = repo;
        _tenantContext = tenantContext;
        _slaService = slaService;
        _notificaciones = notificaciones;
        _asignacion = asignacion;
    }

    public async Task<TicketDto> GetByIdAsync(Guid id)
    {
        var ticket = await _repo.GetByIdAsync(id)
            ?? throw new KeyNotFoundException($"Ticket {id} no encontrado.");
        return MapToDto(ticket);
    }

    public async Task<PagedResultDto<TicketListItemDto>> GetPagedAsync(TicketFilterDto filter)
    {
        // Los Agentes solo ven tickets del help desk vinculado a su área
        if (_tenantContext.RolNombre == "Agente")
        {
            var helpDeskId = await _context.Usuarios
                .Where(u => u.Id == _tenantContext.UsuarioId)
                .Select(u => u.Area != null ? u.Area.HelpDeskId : (Guid?)null)
                .FirstOrDefaultAsync();

            filter.HelpDeskIds = helpDeskId.HasValue ? [helpDeskId.Value] : [];
        }

        var (items, total) = await _repo.GetPagedAsync(filter);

        return new PagedResultDto<TicketListItemDto>
        {
            Items = items.Select(MapToListItemDto),
            Total = total,
            Page = filter.Page,
            PageSize = filter.PageSize
        };
    }

    public async Task<TicketDto> CreateAsync(CreateTicketDto dto)
    {
        var estadoInicial = await _context.EstadosTicket
            .FirstOrDefaultAsync(e => e.Nombre == "Pendiente de Asignación" || e.Nombre == "Nuevo")
            ?? throw new InvalidOperationException("Estado inicial no configurado.");

        var numero = await _repo.GenerateNumeroAsync(_tenantContext.TenantId);

        // SLA no corre hasta que se asigne un técnico
        var ticket = new Ticket
        {
            TenantId = _tenantContext.TenantId,
            Numero = numero,
            Asunto = dto.Asunto,
            Descripcion = dto.Descripcion,
            CategoriaId = dto.CategoriaId,
            SubcategoriaId = dto.SubcategoriaId,
            PrioridadId = dto.PrioridadId,
            EstadoId = estadoInicial.Id,
            UsuarioCreadorId = _tenantContext.UsuarioId,
            SucursalId = dto.SucursalId,
            AreaId = dto.AreaId,
            HelpDeskId = dto.HelpDeskId,
            FechaCreacion = DateTime.UtcNow,
            FechaLimiteSLA = null,
            SLAEstado = SLAEstado.EnTiempo
        };

        var created = await _repo.CreateAsync(ticket);
        await RegistrarHistorialAsync(created.Id, null, estadoInicial.Id, "Ticket creado.");

        // Notificar supervisores de ticket creado
        var supervisores = await _context.Usuarios
            .Include(u => u.Rol)
            .Where(u => u.Rol.Nombre == "Supervisor" && u.Activo)
            .Select(u => u.Id)
            .ToListAsync();

        if (supervisores.Any())
            await _notificaciones.NotificarMultiplesAsync(_tenantContext.TenantId, supervisores,
                $"Nuevo ticket: #{numero}",
                $"Se creó el ticket '{dto.Asunto}'.",
                TipoNotificacion.TicketCreado, created.Id);

        return await GetByIdAsync(created.Id);
    }

    public async Task<TicketDto> UpdateAsync(Guid id, UpdateTicketDto dto)
    {
        var ticket = await _context.Tickets.FirstOrDefaultAsync(t => t.Id == id)
            ?? throw new KeyNotFoundException($"Ticket {id} no encontrado.");

        if (dto.Asunto != null) ticket.Asunto = dto.Asunto;
        if (dto.Descripcion != null) ticket.Descripcion = dto.Descripcion;
        if (dto.CategoriaId.HasValue) ticket.CategoriaId = dto.CategoriaId.Value;
        if (dto.SubcategoriaId.HasValue) ticket.SubcategoriaId = dto.SubcategoriaId.Value;
        if (dto.PrioridadId.HasValue) ticket.PrioridadId = dto.PrioridadId.Value;
        if (dto.SucursalId.HasValue) ticket.SucursalId = dto.SucursalId.Value;
        if (dto.AreaId.HasValue)
        {
            ticket.AreaId = dto.AreaId.Value;
            // Sync HelpDeskId from the selected area so agent visibility updates
            var area = await _context.Areas.FindAsync(dto.AreaId.Value);
            if (area != null) ticket.HelpDeskId = area.HelpDeskId;
        }

        await _repo.UpdateAsync(ticket);
        return await GetByIdAsync(id);
    }

    public async Task<TicketDto> CambiarEstadoAsync(Guid id, CambiarEstadoDto dto)
    {
        var ticket = await _context.Tickets
            .Include(t => t.Estado)
            .FirstOrDefaultAsync(t => t.Id == id)
            ?? throw new KeyNotFoundException($"Ticket {id} no encontrado.");

        var estadoAnteriorId = ticket.EstadoId;
        var estadoAnteriorNombre = ticket.Estado.Nombre;
        var nuevoEstado = await _context.EstadosTicket.FindAsync(dto.EstadoId)
            ?? throw new KeyNotFoundException("Estado no encontrado.");

        ticket.EstadoId = dto.EstadoId;

        // SLA pause/resume
        if (EstadosPausa.Contains(nuevoEstado.Nombre))
            await _slaService.PausarSLAAsync(ticket);
        else if (EstadosPausa.Contains(estadoAnteriorNombre))
            await _slaService.ReanudarSLAAsync(ticket);

        if (nuevoEstado.Nombre == "Resuelto")
            ticket.FechaResolucion = DateTime.UtcNow;
        else if (nuevoEstado.EsFinal)
            ticket.FechaCierre = DateTime.UtcNow;

        await _repo.UpdateAsync(ticket);

        var descripcion = dto.Comentario ?? $"Estado cambiado a {nuevoEstado.Nombre}";
        await RegistrarHistorialAsync(id, estadoAnteriorId, dto.EstadoId, descripcion);

        if (!string.IsNullOrWhiteSpace(dto.Comentario))
        {
            await AgregarComentarioAsync(id, new CreateComentarioDto
            {
                Contenido = dto.Comentario,
                EsInterno = false
            });
        }

        // Notificar cambio de estado
        var involucrados = new HashSet<Guid> { ticket.UsuarioCreadorId };
        if (ticket.TecnicoAsignadoId.HasValue) involucrados.Add(ticket.TecnicoAsignadoId.Value);
        if (ticket.SupervisorId.HasValue) involucrados.Add(ticket.SupervisorId.Value);
        involucrados.Remove(_tenantContext.UsuarioId); // no notificar a quien hace el cambio

        if (involucrados.Any())
        {
            await _notificaciones.NotificarMultiplesAsync(_tenantContext.TenantId, involucrados,
                $"Ticket #{ticket.Numero}: estado actualizado",
                $"El estado cambió a '{nuevoEstado.Nombre}'.",
                TipoNotificacion.CambioEstado, id);
        }

        if (nuevoEstado.Nombre == "Resuelto")
            await _notificaciones.NotificarAsync(_tenantContext.TenantId, ticket.UsuarioCreadorId,
                $"Ticket #{ticket.Numero} resuelto",
                $"Tu ticket '{ticket.Asunto}' ha sido resuelto.",
                TipoNotificacion.TicketResuelto, id);

        return await GetByIdAsync(id);
    }

    public async Task<TicketDto> AsignarTecnicoAsync(Guid id, AsignarTecnicoDto dto)
    {
        var ticket = await _context.Tickets
            .Include(t => t.Estado)
            .FirstOrDefaultAsync(t => t.Id == id)
            ?? throw new KeyNotFoundException($"Ticket {id} no encontrado.");

        var estadoAnteriorId = ticket.EstadoId;
        ticket.TecnicoAsignadoId = dto.TecnicoId;

        if (dto.SupervisorId.HasValue)
            ticket.SupervisorId = dto.SupervisorId.Value;

        var estadoAsignado = await _context.EstadosTicket
            .FirstOrDefaultAsync(e => e.Nombre == "Asignado");

        var esPrimerAsignacion = ticket.FechaAsignacion == null;

        if (estadoAsignado != null && !ticket.Estado.EsFinal)
        {
            ticket.EstadoId = estadoAsignado.Id;
            ticket.FechaAsignacion = DateTime.UtcNow;
            await RegistrarHistorialAsync(id, estadoAnteriorId, estadoAsignado.Id,
                dto.Comentario ?? "Ticket asignado a técnico.");
        }

        // Calcular SLA en el momento de la asignación (si es la primera vez)
        if (esPrimerAsignacion && ticket.FechaLimiteSLA == null)
        {
            ticket.FechaLimiteSLA = await _slaService.CalcularFechaLimiteAsync(
                _tenantContext.TenantId, ticket.PrioridadId, ticket.CategoriaId);
            ticket.SLAEstado = SLAEstado.EnTiempo;
        }

        await _repo.UpdateAsync(ticket);

        // Notificar al técnico
        await _notificaciones.NotificarAsync(_tenantContext.TenantId, dto.TecnicoId,
            $"Ticket asignado: #{ticket.Numero}",
            $"Se te ha asignado el ticket '{ticket.Asunto}'.",
            TipoNotificacion.TicketAsignado, id);

        return await GetByIdAsync(id);
    }

    public async Task<ComentarioDto> AgregarComentarioAsync(Guid ticketId, CreateComentarioDto dto)
    {
        var ticket = await _context.Tickets
            .FirstOrDefaultAsync(t => t.Id == ticketId)
            ?? throw new KeyNotFoundException($"Ticket {ticketId} no encontrado.");

        // Si el cliente (rol Usuario) responde y el ticket está en espera → auto-reanudar SLA
        if (!dto.EsInterno && ticket.EstaEnEspera && _tenantContext.RolNombre == "Usuario")
        {
            ticket.EstaEnEspera   = false;
            ticket.MotivoEsperaId = null;
            ticket.FechaEnEspera  = null;

            _context.HistorialTickets.Add(new HistorialTicket
            {
                TicketId      = ticketId,
                UsuarioId     = _tenantContext.UsuarioId,
                Descripcion   = "SLA reanudado automáticamente — el cliente respondió",
                FechaCreacion = DateTime.UtcNow,
            });
        }

        var comentario = new ComentarioTicket
        {
            TicketId = ticketId,
            UsuarioId = _tenantContext.UsuarioId,
            Contenido = dto.Contenido,
            EsInterno = dto.EsInterno,
            FechaCreacion = DateTime.UtcNow
        };

        await _context.ComentariosTicket.AddAsync(comentario);
        await _context.SaveChangesAsync();
        await _context.Entry(comentario).Reference(c => c.Usuario).LoadAsync();

        // Notificar partes involucradas (solo si no es interno)
        if (!dto.EsInterno)
        {
            var involucrados = new HashSet<Guid> { ticket.UsuarioCreadorId };
            if (ticket.TecnicoAsignadoId.HasValue) involucrados.Add(ticket.TecnicoAsignadoId.Value);
            if (ticket.SupervisorId.HasValue) involucrados.Add(ticket.SupervisorId.Value);
            involucrados.Remove(_tenantContext.UsuarioId);

            if (involucrados.Any())
            {
                var autor = $"{comentario.Usuario.Nombre} {comentario.Usuario.Apellido}";
                await _notificaciones.NotificarMultiplesAsync(_tenantContext.TenantId, involucrados,
                    $"Nuevo comentario en #{ticket.Numero}",
                    $"{autor}: {(dto.Contenido.Length > 100 ? dto.Contenido[..100] + "..." : dto.Contenido)}",
                    TipoNotificacion.NuevoComentario, ticketId);
            }
        }

        return new ComentarioDto
        {
            Id = comentario.Id,
            Contenido = comentario.Contenido,
            EsInterno = comentario.EsInterno,
            FechaCreacion = comentario.FechaCreacion,
            Usuario = new UsuarioResumenDto
            {
                Id = comentario.Usuario.Id,
                NombreCompleto = $"{comentario.Usuario.Nombre} {comentario.Usuario.Apellido}",
                Email = comentario.Usuario.Email
            }
        };
    }

    public async Task<IEnumerable<ComentarioDto>> GetComentariosAsync(Guid ticketId)
    {
        var comentarios = await _context.ComentariosTicket
            .Include(c => c.Usuario)
            .Where(c => c.TicketId == ticketId)
            .OrderBy(c => c.FechaCreacion)
            .ToListAsync();

        if (_tenantContext.RolNombre == "Usuario")
            comentarios = comentarios.Where(c => !c.EsInterno).ToList();

        return comentarios.Select(c => new ComentarioDto
        {
            Id = c.Id,
            Contenido = c.Contenido,
            EsInterno = c.EsInterno,
            FechaCreacion = c.FechaCreacion,
            Usuario = new UsuarioResumenDto
            {
                Id = c.Usuario.Id,
                NombreCompleto = $"{c.Usuario.Nombre} {c.Usuario.Apellido}",
                Email = c.Usuario.Email
            }
        });
    }

    public async Task<IEnumerable<HistorialDto>> GetHistorialAsync(Guid ticketId)
    {
        var historial = await _context.HistorialTickets
            .Include(h => h.Usuario)
            .Include(h => h.EstadoAnterior)
            .Include(h => h.EstadoNuevo)
            .Where(h => h.TicketId == ticketId)
            .OrderBy(h => h.FechaCreacion)
            .ToListAsync();

        return historial.Select(h => new HistorialDto
        {
            Id = h.Id,
            Descripcion = h.Descripcion,
            FechaCreacion = h.FechaCreacion,
            EstadoAnterior = h.EstadoAnterior?.Nombre,
            EstadoNuevo = h.EstadoNuevo?.Nombre,
            Usuario = new UsuarioResumenDto
            {
                Id = h.Usuario.Id,
                NombreCompleto = $"{h.Usuario.Nombre} {h.Usuario.Apellido}",
                Email = h.Usuario.Email
            }
        });
    }

    public async Task<TicketDto> EscalarAsync(Guid id, string? motivo)
    {
        var ticket = await _context.Tickets
            .Include(t => t.Estado)
            .FirstOrDefaultAsync(t => t.Id == id)
            ?? throw new KeyNotFoundException($"Ticket {id} no encontrado.");

        if (ticket.Estado.EsFinal)
            throw new InvalidOperationException("No se puede escalar un ticket cerrado.");

        // Cambiar a la prioridad más alta disponible
        var prioridadMaxima = await _context.Prioridades
            .OrderByDescending(p => p.Orden)
            .FirstOrDefaultAsync();

        if (prioridadMaxima != null && ticket.PrioridadId != prioridadMaxima.Id)
            ticket.PrioridadId = prioridadMaxima.Id;

        ticket.FechaEscalacion = DateTime.UtcNow;

        await _repo.UpdateAsync(ticket);

        var desc = string.IsNullOrWhiteSpace(motivo)
            ? "Ticket escalado."
            : $"Ticket escalado: {motivo}";
        await RegistrarHistorialAsync(id, null, null, desc);

        // Notificar a supervisores y admins
        var supervisores = await _context.Usuarios
            .Include(u => u.Rol)
            .Where(u => (u.Rol.Nombre == "Supervisor" || u.Rol.Nombre == "Administrador") && u.Activo)
            .Select(u => u.Id)
            .ToListAsync();

        if (supervisores.Any())
            await _notificaciones.NotificarMultiplesAsync(_tenantContext.TenantId, supervisores,
                $"Ticket escalado: #{ticket.Numero}",
                $"El ticket '{ticket.Asunto}' fue escalado. {motivo ?? string.Empty}".Trim(),
                TipoNotificacion.TicketEscalado, id);

        return await GetByIdAsync(id);
    }

    public async Task<TicketDto> SetSlaAsync(Guid id, DateTime fechaLimite, string? comentario)
    {
        var ticket = await _context.Tickets.FirstOrDefaultAsync(t => t.Id == id)
            ?? throw new KeyNotFoundException($"Ticket {id} no encontrado.");

        var anteriorSla = ticket.FechaLimiteSLA;
        ticket.FechaLimiteSLA = fechaLimite.ToUniversalTime();
        ticket.SLAEstado = DateTime.UtcNow <= fechaLimite.ToUniversalTime()
            ? SLAEstado.EnTiempo : SLAEstado.Vencido;

        await _repo.UpdateAsync(ticket);

        var desc = comentario ?? $"SLA establecido: {fechaLimite:dd/MM/yyyy HH:mm}";
        await RegistrarHistorialAsync(id, null, null, desc);

        return await GetByIdAsync(id);
    }

    public async Task<TicketDto> TomarTicketAsync(Guid id)
    {
        var ticket = await _context.Tickets
            .Include(t => t.Estado)
            .FirstOrDefaultAsync(t => t.Id == id)
            ?? throw new KeyNotFoundException($"Ticket {id} no encontrado.");

        if (ticket.TecnicoAsignadoId.HasValue)
            throw new InvalidOperationException("El ticket ya tiene un técnico asignado.");

        if (ticket.Estado.EsFinal)
            throw new InvalidOperationException("No se puede tomar un ticket en estado final.");

        var estadoAnteriorId = ticket.EstadoId;
        var estadoAsignado = await _context.EstadosTicket
            .FirstOrDefaultAsync(e => e.Nombre == "Asignado");

        ticket.TecnicoAsignadoId = _tenantContext.UsuarioId;
        ticket.FechaAsignacion = DateTime.UtcNow;
        ticket.FechaLimiteSLA = await _slaService.CalcularFechaLimiteAsync(
            _tenantContext.TenantId, ticket.PrioridadId, ticket.CategoriaId);
        ticket.SLAEstado = SLAEstado.EnTiempo;

        if (estadoAsignado != null)
            ticket.EstadoId = estadoAsignado.Id;

        await _repo.UpdateAsync(ticket);
        await RegistrarHistorialAsync(id, estadoAnteriorId, ticket.EstadoId,
            "Técnico tomó el ticket.");

        return await GetByIdAsync(id);
    }

    private async Task RegistrarHistorialAsync(Guid ticketId, Guid? estadoAnteriorId,
        Guid? estadoNuevoId, string descripcion)
    {
        var historial = new HistorialTicket
        {
            TicketId = ticketId,
            UsuarioId = _tenantContext.UsuarioId,
            EstadoAnteriorId = estadoAnteriorId,
            EstadoNuevoId = estadoNuevoId,
            Descripcion = descripcion,
            FechaCreacion = DateTime.UtcNow
        };

        await _context.HistorialTickets.AddAsync(historial);
        await _context.SaveChangesAsync();
    }

    private static TicketDto MapToDto(Ticket t) => new()
    {
        Id = t.Id,
        Numero = t.Numero,
        Asunto = t.Asunto,
        Descripcion = t.Descripcion,
        Categoria = t.Categoria.Nombre,
        CategoriaId = t.CategoriaId,
        Subcategoria = t.Subcategoria?.Nombre,
        SubcategoriaId = t.SubcategoriaId,
        Prioridad = t.Prioridad.Nombre,
        PrioridadColor = t.Prioridad.Color,
        PrioridadId = t.PrioridadId,
        Estado = t.Estado.Nombre,
        EstadoColor = t.Estado.Color,
        EstadoId = t.EstadoId,
        UsuarioCreador = new UsuarioResumenDto { Id = t.UsuarioCreador.Id, NombreCompleto = $"{t.UsuarioCreador.Nombre} {t.UsuarioCreador.Apellido}", Email = t.UsuarioCreador.Email },
        TecnicoAsignado = t.TecnicoAsignado == null ? null : new UsuarioResumenDto { Id = t.TecnicoAsignado.Id, NombreCompleto = $"{t.TecnicoAsignado.Nombre} {t.TecnicoAsignado.Apellido}", Email = t.TecnicoAsignado.Email },
        Supervisor = t.Supervisor == null ? null : new UsuarioResumenDto { Id = t.Supervisor.Id, NombreCompleto = $"{t.Supervisor.Nombre} {t.Supervisor.Apellido}", Email = t.Supervisor.Email },
        Sucursal = t.Sucursal?.Nombre,
        Area = t.Area?.Nombre,
        AreaId = t.AreaId,
        HelpDesk = t.HelpDesk?.Nombre,
        HelpDeskId = t.HelpDeskId,
        FechaCreacion = t.FechaCreacion,
        FechaAsignacion = t.FechaAsignacion,
        FechaResolucion = t.FechaResolucion,
        FechaCierre = t.FechaCierre,
        FechaLimiteSLA = t.FechaLimiteSLA,
        SlaVencido = t.SLAEstado == SLAEstado.Vencido,
        SLAEstado = t.SLAEstado,
        EstaEnEspera = t.EstaEnEspera,
        MotivoEsperaId = t.MotivoEsperaId,
        MotivoEspera = t.MotivoEspera?.Nombre,
        MotivoEsperaIcono = t.MotivoEspera?.Icono,
        FechaEnEspera = t.FechaEnEspera,
        Adjuntos = t.Adjuntos?.Select(a => new AdjuntoDto
        {
            Id = a.Id,
            NombreArchivo = a.NombreArchivo,
            TipoArchivo = a.TipoArchivo,
            Tamaño = a.Tamaño,
            FechaCreacion = a.FechaCreacion
        }) ?? [],
        Comentarios = t.Comentarios.OrderBy(c => c.FechaCreacion).Select(c => new ComentarioDto
        {
            Id = c.Id,
            Contenido = c.Contenido,
            EsInterno = c.EsInterno,
            FechaCreacion = c.FechaCreacion,
            Usuario = new UsuarioResumenDto { Id = c.Usuario.Id, NombreCompleto = $"{c.Usuario.Nombre} {c.Usuario.Apellido}", Email = c.Usuario.Email }
        }),
        Historial = t.Historial.OrderBy(h => h.FechaCreacion).Select(h => new HistorialDto
        {
            Id = h.Id,
            Descripcion = h.Descripcion,
            FechaCreacion = h.FechaCreacion,
            EstadoAnterior = h.EstadoAnterior?.Nombre,
            EstadoNuevo = h.EstadoNuevo?.Nombre,
            Usuario = new UsuarioResumenDto { Id = h.Usuario.Id, NombreCompleto = $"{h.Usuario.Nombre} {h.Usuario.Apellido}", Email = h.Usuario.Email }
        })
    };

    private static TicketListItemDto MapToListItemDto(Ticket t) => new()
    {
        Id = t.Id,
        Numero = t.Numero,
        Asunto = t.Asunto,
        Categoria = t.Categoria.Nombre,
        Subcategoria = t.Subcategoria?.Nombre,
        Prioridad = t.Prioridad.Nombre,
        PrioridadColor = t.Prioridad.Color,
        Estado = t.Estado.Nombre,
        EstadoColor = t.Estado.Color,
        UsuarioCreadorId = t.UsuarioCreadorId,
        UsuarioCreador = $"{t.UsuarioCreador.Nombre} {t.UsuarioCreador.Apellido}",
        TecnicoAsignadoId = t.TecnicoAsignadoId,
        TecnicoAsignado = t.TecnicoAsignado == null ? null : $"{t.TecnicoAsignado.Nombre} {t.TecnicoAsignado.Apellido}",
        FechaCreacion = t.FechaCreacion,
        FechaAsignacion = t.FechaAsignacion,
        FechaResolucion = t.FechaResolucion,
        FechaCierre = t.FechaCierre,
        FechaLimiteSLA = t.FechaLimiteSLA,
        SlaVencido = t.SLAEstado == SLAEstado.Vencido,
        SLAEstado = t.SLAEstado
    };

    public async Task<MiTrabajoStatsDto> GetMiTrabajoStatsAsync()
    {
        var userId = _tenantContext.UsuarioId;
        var ahora = DateTime.UtcNow;
        var en24h = ahora.AddHours(24);

        // Aplicar el mismo filtro de área que GetPagedAsync para agentes
        var filter = new TicketFilterDto { Page = 1, PageSize = 1000 };
        if (_tenantContext.RolNombre == "Agente")
        {
            var helpDeskId = await _context.Usuarios
                .Where(u => u.Id == userId)
                .Select(u => u.Area != null ? u.Area.HelpDeskId : (Guid?)null)
                .FirstOrDefaultAsync();
            filter.HelpDeskIds = helpDeskId.HasValue ? [helpDeskId.Value] : [];
        }

        // Traer todos los tickets activos para calcular stats
        var todos = (await _repo.GetPagedAsync(filter)).Items.ToList();

        // También traer aprobaciones pendientes
        var aprobaciones = await _context.Set<AprobacionTicket>()
            .Where(a => a.Estado == EstadoAprobacion.Pendiente)
            .CountAsync();

        var esperandoPorMi = todos.Count(t =>
            t.UsuarioCreadorId == userId && t.Estado?.EsFinal != true);

        var asignadosAMi = todos.Count(t =>
            t.TecnicoAsignadoId == userId && t.Estado?.EsFinal != true);

        var sinAsignar = todos.Count(t =>
            t.TecnicoAsignadoId == null && t.Estado?.EsFinal != true);

        var vencimientos = todos.Count(t =>
            t.FechaLimiteSLA.HasValue &&
            t.FechaLimiteSLA.Value <= en24h &&
            t.FechaLimiteSLA.Value >= ahora &&
            t.Estado?.EsFinal != true);

        // Tickets recientes: los últimos 12 activos relevantes al usuario
        var recientes = todos
            .Where(t => t.Estado?.EsFinal != true)
            .OrderByDescending(t => t.FechaCreacion)
            .Take(12)
            .Select(MapToListItemDto)
            .ToList();

        return new MiTrabajoStatsDto
        {
            TotalActivos = todos.Count(t => t.Estado?.EsFinal != true),
            EsperandoPorMi = esperandoPorMi,
            AsignadosAMi = asignadosAMi,
            SinAsignar = sinAsignar,
            AprobacionesPendientes = aprobaciones,
            VencimientosProximos = vencimientos,
            TicketsRecientes = recientes
        };
    }

    public async Task<TicketDto> PonerEnEsperaAsync(Guid id, PonerEnEsperaDto dto)
    {
        var ticket = await _context.Tickets
            .Include(t => t.Estado)
            .FirstOrDefaultAsync(t => t.Id == id)
            ?? throw new KeyNotFoundException($"Ticket {id} no encontrado.");

        if (ticket.Estado.EsFinal)
            throw new InvalidOperationException("No se puede poner en espera un ticket cerrado.");

        if (ticket.EstaEnEspera)
            throw new InvalidOperationException("El ticket ya está en espera.");

        ticket.EstaEnEspera   = true;
        ticket.MotivoEsperaId = dto.MotivoEsperaId;
        ticket.FechaEnEspera  = DateTime.UtcNow;

        await _slaService.PausarSLAAsync(ticket);

        var motivo = dto.MotivoEsperaId.HasValue
            ? await _context.MotivosEspera.FindAsync(dto.MotivoEsperaId.Value)
            : null;

        var desc = dto.Comentario
            ?? (motivo != null ? $"En espera: {motivo.Nombre}" : "Ticket puesto en espera. SLA pausado.");

        await RegistrarHistorialAsync(id, null, null, desc);

        if (!string.IsNullOrWhiteSpace(dto.Comentario))
            await AgregarComentarioAsync(id, new CreateComentarioDto { Contenido = dto.Comentario, EsInterno = true });

        return await GetByIdAsync(id);
    }

    public async Task<TicketDto> ReanudarEsperaAsync(Guid id, ReanudarEsperaDto dto)
    {
        var ticket = await _context.Tickets
            .FirstOrDefaultAsync(t => t.Id == id)
            ?? throw new KeyNotFoundException($"Ticket {id} no encontrado.");

        if (!ticket.EstaEnEspera)
            throw new InvalidOperationException("El ticket no está en espera.");

        ticket.EstaEnEspera   = false;
        ticket.MotivoEsperaId = null;
        ticket.FechaEnEspera  = null;

        await _slaService.ReanudarSLAAsync(ticket);

        var desc = dto.Comentario ?? "Ticket reanudado. SLA activo.";
        await RegistrarHistorialAsync(id, null, null, desc);

        if (!string.IsNullOrWhiteSpace(dto.Comentario))
            await AgregarComentarioAsync(id, new CreateComentarioDto { Contenido = dto.Comentario, EsInterno = true });

        return await GetByIdAsync(id);
    }

    public async Task<IEnumerable<MotivoEsperaDto>> GetMotivosEsperaAsync(Guid? helpDeskId)
    {
        // Si el HelpDesk tiene motivos específicos configurados, mostrar solo esos.
        // Si no tiene específicos (o no hay HelpDesk), mostrar los globales (HelpDeskId == null).
        bool tieneEspecificos = helpDeskId.HasValue &&
            await _context.MotivosEspera.AnyAsync(m => m.Activo && m.HelpDeskId == helpDeskId.Value);

        var query = _context.MotivosEspera
            .Include(m => m.HelpDesk)
            .Where(m => m.Activo && (
                tieneEspecificos
                    ? m.HelpDeskId == helpDeskId
                    : m.HelpDeskId == null
            ))
            .OrderBy(m => m.Orden).ThenBy(m => m.Nombre);

        return await query.Select(m => new MotivoEsperaDto
        {
            Id          = m.Id,
            Nombre      = m.Nombre,
            Descripcion = m.Descripcion,
            Icono       = m.Icono,
            HelpDeskId  = m.HelpDeskId,
            HelpDesk    = m.HelpDesk != null ? m.HelpDesk.Nombre : null,
            Activo      = m.Activo,
            Orden       = m.Orden,
        }).ToListAsync();
    }
}
