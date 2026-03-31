using System.Text.Json;
using DeskFlow.Core.DTOs.Catalogo;
using DeskFlow.Core.DTOs.Tickets;
using DeskFlow.Core.Entities;
using DeskFlow.Core.Interfaces;
using DeskFlow.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace DeskFlow.Infrastructure.Services;

public class CatalogoService : ICatalogoService
{
    private readonly DeskFlowDbContext _context;
    private readonly ITenantContext _tenantContext;
    private readonly ITicketService _ticketService;
    private readonly INotificacionService _notificaciones;

    public CatalogoService(DeskFlowDbContext context, ITenantContext tenantContext,
        ITicketService ticketService, INotificacionService notificaciones)
    {
        _context = context;
        _tenantContext = tenantContext;
        _ticketService = ticketService;
        _notificaciones = notificaciones;
    }

    public async Task<IEnumerable<DepartamentoDto>> GetDepartamentosAsync()
    {
        var deps = await _context.Departamentos
            .Where(d => d.Activo)
            .OrderBy(d => d.Orden)
            .Include(d => d.Servicios.Where(s => s.Activo))
            .ToListAsync();

        return deps.Select(d => new DepartamentoDto
        {
            Id = d.Id,
            Nombre = d.Nombre,
            Descripcion = d.Descripcion,
            Icono = d.Icono,
            Color = d.Color,
            CantidadServicios = d.Servicios.Count
        });
    }

    public async Task<IEnumerable<ServicioListItemDto>> GetServiciosAsync(Guid? departamentoId = null, bool soloPublicos = false)
    {
        var query = _context.ServiciosCatalogo
            .Where(s => s.Activo)
            .Include(s => s.Departamento)
            .AsQueryable();

        if (departamentoId.HasValue)
            query = query.Where(s => s.DepartamentoId == departamentoId.Value);

        if (soloPublicos)
            query = query.Where(s => s.EsPublico);

        var servicios = await query.OrderBy(s => s.Departamento.Orden).ThenBy(s => s.Orden).ToListAsync();

        return servicios.Select(MapToListItem);
    }

    public async Task<ServicioDetalleDto> GetServicioByIdAsync(Guid id)
    {
        var servicio = await _context.ServiciosCatalogo
            .Include(s => s.Departamento)
            .Include(s => s.Campos.OrderBy(c => c.Orden))
            .Include(s => s.PlantillasTareas.OrderBy(p => p.Orden))
            .FirstOrDefaultAsync(s => s.Id == id && s.Activo)
            ?? throw new KeyNotFoundException($"Servicio {id} no encontrado");

        var dto = new ServicioDetalleDto
        {
            Id = servicio.Id,
            DepartamentoId = servicio.DepartamentoId,
            Departamento = servicio.Departamento.Nombre,
            DepartamentoColor = servicio.Departamento.Color,
            Nombre = servicio.Nombre,
            Descripcion = servicio.Descripcion,
            Icono = servicio.Icono,
            Color = servicio.Color,
            TiempoEntregaHoras = servicio.TiempoEntregaHoras,
            RequiereAprobacion = servicio.RequiereAprobacion,
            EsPublico = servicio.EsPublico,
            Campos = servicio.Campos.Select(c => new CampoServicioDto
            {
                Id = c.Id,
                Nombre = c.Nombre,
                Etiqueta = c.Etiqueta,
                TipoCampo = c.TipoCampo,
                Placeholder = c.Placeholder,
                Requerido = c.Requerido,
                Orden = c.Orden,
                Opciones = c.OpcionesJson != null
                    ? JsonSerializer.Deserialize<List<string>>(c.OpcionesJson) ?? []
                    : []
            }).ToList(),
            Plantillas = servicio.PlantillasTareas.Select(p => new PlantillaTareaDto
            {
                Id = p.Id,
                Titulo = p.Titulo,
                Descripcion = p.Descripcion,
                Orden = p.Orden,
                AsignarARol = p.AsignarARol
            }).ToList()
        };

        return dto;
    }

    public async Task<TicketDto> SolicitarServicioAsync(Guid servicioId, SolicitarServicioDto dto)
    {
        var servicio = await _context.ServiciosCatalogo
            .Include(s => s.Campos)
            .Include(s => s.PlantillasTareas)
            .Include(s => s.Departamento)
            .Include(s => s.Prioridad)
            .FirstOrDefaultAsync(s => s.Id == servicioId && s.Activo)
            ?? throw new KeyNotFoundException($"Servicio {servicioId} no encontrado");

        // Determine priority: use service default or fall back to "Media"
        var prioridadId = servicio.PrioridadId;
        if (!prioridadId.HasValue)
        {
            var prioridadMedia = await _context.Prioridades
                .FirstOrDefaultAsync(p => p.Nombre == "Media" || p.Nombre == "Baja");
            prioridadId = prioridadMedia?.Id ?? (await _context.Prioridades.OrderByDescending(p => p.Orden).FirstOrDefaultAsync())?.Id;
        }

        // Determine category: use service's linked category or first available
        var categoriaId = servicio.CategoriaId;
        if (!categoriaId.HasValue)
        {
            categoriaId = (await _context.Categorias.FirstOrDefaultAsync())?.Id;
        }

        if (!prioridadId.HasValue || !categoriaId.HasValue)
            throw new InvalidOperationException("No se puede crear el ticket: configuración incompleta del servicio.");

        // Build ticket description from form responses
        var descripcionBuilder = new System.Text.StringBuilder();
        descripcionBuilder.AppendLine($"**Solicitud de servicio: {servicio.Nombre}**");
        descripcionBuilder.AppendLine($"Departamento: {servicio.Departamento.Nombre}");
        descripcionBuilder.AppendLine();

        foreach (var campo in servicio.Campos.OrderBy(c => c.Orden))
        {
            if (dto.Respuestas.TryGetValue(campo.Nombre, out var valor) && !string.IsNullOrWhiteSpace(valor))
                descripcionBuilder.AppendLine($"**{campo.Etiqueta}:** {valor}");
        }

        // Create the ticket
        var ticket = new Ticket
        {
            TenantId = _tenantContext.TenantId,
            Asunto = $"[{servicio.Nombre}] Solicitud de {servicio.Departamento.Nombre}",
            Descripcion = descripcionBuilder.ToString(),
            CategoriaId = categoriaId.Value,
            PrioridadId = prioridadId.Value,
            UsuarioCreadorId = _tenantContext.UsuarioId,
            ServicioId = servicioId,
            FechaCreacion = DateTime.UtcNow
        };

        // Assign initial state: "Pendiente de Asignación" or "Pendiente de Aprobación"
        EstadoTicket? estado;
        if (servicio.RequiereAprobacion)
            estado = await _context.EstadosTicket.FirstOrDefaultAsync(e => e.Nombre == "Pendiente de Aprobación")
                     ?? await _context.EstadosTicket.FirstOrDefaultAsync(e => e.Nombre == "Pendiente de Asignación")
                     ?? await _context.EstadosTicket.OrderBy(e => e.Orden).FirstOrDefaultAsync();
        else
            estado = await _context.EstadosTicket.FirstOrDefaultAsync(e => e.Nombre == "Pendiente de Asignación")
                     ?? await _context.EstadosTicket.OrderBy(e => e.Orden).FirstOrDefaultAsync();

        ticket.EstadoId = estado!.Id;

        // Generate ticket number
        var numero = await GenerateNumeroAsync(_tenantContext.TenantId);
        ticket.Numero = numero;

        _context.Tickets.Add(ticket);

        // Save form responses
        foreach (var campo in servicio.Campos)
        {
            if (dto.Respuestas.TryGetValue(campo.Nombre, out var valor))
            {
                _context.RespuestasFormulario.Add(new RespuestaFormulario
                {
                    TenantId = _tenantContext.TenantId,
                    TicketId = ticket.Id,
                    CampoId = campo.Id,
                    Valor = valor
                });
            }
        }

        // Generate tasks from templates
        foreach (var plantilla in servicio.PlantillasTareas.OrderBy(p => p.Orden))
        {
            _context.Tareas.Add(new Tarea
            {
                TenantId = _tenantContext.TenantId,
                TicketId = ticket.Id,
                Titulo = plantilla.Titulo,
                Descripcion = plantilla.Descripcion,
                CreadoPorId = _tenantContext.UsuarioId,
                FechaCreacion = DateTime.UtcNow
            });
        }

        // If requires approval, create approval record
        if (servicio.RequiereAprobacion)
        {
            _context.AprobacionesTicket.Add(new AprobacionTicket
            {
                TenantId = _tenantContext.TenantId,
                TicketId = ticket.Id,
                Estado = EstadoAprobacion.Pendiente,
                FechaCreacion = DateTime.UtcNow
            });
        }

        await _context.SaveChangesAsync();

        // Notify
        await _notificaciones.NotificarAsync(
            _tenantContext.TenantId,
            ticket.UsuarioCreadorId,
            "Solicitud enviada",
            $"Tu solicitud '{servicio.Nombre}' fue registrada como {ticket.Numero}",
            Core.Enums.TipoNotificacion.TicketCreado,
            ticket.Id);

        return await _ticketService.GetByIdAsync(ticket.Id);
    }

    public async Task<IEnumerable<RespuestaFormularioDto>> GetRespuestasFormularioAsync(Guid ticketId)
    {
        var respuestas = await _context.RespuestasFormulario
            .Where(r => r.TicketId == ticketId)
            .Include(r => r.Campo)
            .OrderBy(r => r.Campo.Orden)
            .ToListAsync();

        return respuestas.Select(r => new RespuestaFormularioDto
        {
            CampoId = r.CampoId,
            Etiqueta = r.Campo.Etiqueta,
            TipoCampo = r.Campo.TipoCampo,
            Valor = r.Valor
        });
    }

    public async Task<IEnumerable<TareaDto>> GetTareasTicketAsync(Guid ticketId)
    {
        var tareas = await _context.Tareas
            .Where(t => t.TicketId == ticketId)
            .Include(t => t.AsignadoA)
            .OrderBy(t => t.FechaCreacion)
            .ToListAsync();

        return tareas.Select(MapTareaDto);
    }

    public async Task<TareaDto> CompletarTareaAsync(Guid tareaId)
    {
        var tarea = await _context.Tareas
            .Include(t => t.AsignadoA)
            .FirstOrDefaultAsync(t => t.Id == tareaId)
            ?? throw new KeyNotFoundException($"Tarea {tareaId} no encontrada");

        tarea.Completada = true;
        tarea.FechaCompletada = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        return MapTareaDto(tarea);
    }

    private static ServicioListItemDto MapToListItem(ServicioCatalogo s) => new()
    {
        Id = s.Id,
        DepartamentoId = s.DepartamentoId,
        Departamento = s.Departamento.Nombre,
        DepartamentoColor = s.Departamento.Color,
        Nombre = s.Nombre,
        Descripcion = s.Descripcion,
        Icono = s.Icono,
        Color = s.Color,
        TiempoEntregaHoras = s.TiempoEntregaHoras,
        RequiereAprobacion = s.RequiereAprobacion,
        EsPublico = s.EsPublico
    };

    private static TareaDto MapTareaDto(Tarea t) => new()
    {
        Id = t.Id,
        Titulo = t.Titulo,
        Descripcion = t.Descripcion,
        AsignadoA = t.AsignadoA == null ? null : $"{t.AsignadoA.Nombre} {t.AsignadoA.Apellido}",
        AsignadoAId = t.AsignadoAId,
        Completada = t.Completada,
        FechaCompletada = t.FechaCompletada,
        FechaVencimiento = t.FechaVencimiento,
        FechaCreacion = t.FechaCreacion
    };

    private async Task<string> GenerateNumeroAsync(Guid tenantId)
    {
        var count = await _context.Tickets.CountAsync();
        return $"SUP-{(count + 1):D6}";
    }
}
