using DeskFlow.Core.DTOs.Aprobaciones;
using DeskFlow.Core.DTOs.Etiquetas;
using DeskFlow.Core.DTOs.Tickets;
using DeskFlow.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using DeskFlow.API.Hubs;

namespace DeskFlow.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class TicketsController : ControllerBase
{
    private readonly ITicketService _ticketService;
    private readonly IHubContext<TicketHub> _hubContext;
    private readonly ITenantContext _tenantContext;
    private readonly IEtiquetaService _etiquetaService;
    private readonly IAprobacionService _aprobacionService;

    public TicketsController(ITicketService ticketService, IHubContext<TicketHub> hubContext, ITenantContext tenantContext, IEtiquetaService etiquetaService, IAprobacionService aprobacionService)
    {
        _ticketService = ticketService;
        _hubContext = hubContext;
        _tenantContext = tenantContext;
        _etiquetaService = etiquetaService;
        _aprobacionService = aprobacionService;
    }

    /// <summary>Stats personalizadas del usuario actual para la página Mi Trabajo.</summary>
    [HttpGet("mi-trabajo")]
    public async Task<ActionResult<MiTrabajoStatsDto>> GetMiTrabajo()
        => Ok(await _ticketService.GetMiTrabajoStatsAsync());

    /// <summary>Listar tickets con paginación y filtros (filtrado automático por rol).</summary>
    [HttpGet]
    public async Task<ActionResult<PagedResultDto<TicketListItemDto>>> GetAll([FromQuery] TicketFilterDto filter)
    {
        var rol = _tenantContext.RolNombre;
        var userId = _tenantContext.UsuarioId;

        // Usuarios solo ven sus propios tickets
        if (rol == "Usuario")
            filter.UsuarioCreadorId = userId;

        var result = await _ticketService.GetPagedAsync(filter);
        return Ok(result);
    }

    /// <summary>Obtener un ticket por ID con todos sus detalles.</summary>
    [HttpGet("{id:guid}")]
    public async Task<ActionResult<TicketDto>> GetById(Guid id)
    {
        var result = await _ticketService.GetByIdAsync(id);
        return Ok(result);
    }

    /// <summary>Crear un nuevo ticket.</summary>
    [HttpPost]
    public async Task<ActionResult<TicketDto>> Create([FromBody] CreateTicketDto dto)
    {
        var result = await _ticketService.CreateAsync(dto);

        // Notificar via SignalR al grupo del tenant
        await _hubContext.Clients
            .Group($"tenant_{_tenantContext.TenantId}")
            .SendAsync("TicketCreado", result);

        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    /// <summary>Actualizar datos del ticket.</summary>
    [HttpPut("{id:guid}")]
    [Authorize(Roles = "Administrador,Supervisor,Agente")]
    public async Task<ActionResult<TicketDto>> Update(Guid id, [FromBody] UpdateTicketDto dto)
    {
        var result = await _ticketService.UpdateAsync(id, dto);
        await _hubContext.Clients.Group($"ticket_{id}").SendAsync("TicketActualizado", result);
        return Ok(result);
    }

    /// <summary>Cambiar el estado de un ticket.</summary>
    [HttpPatch("{id:guid}/estado")]
    public async Task<ActionResult<TicketDto>> CambiarEstado(Guid id, [FromBody] CambiarEstadoDto dto)
    {
        var result = await _ticketService.CambiarEstadoAsync(id, dto);
        await _hubContext.Clients.Group($"ticket_{id}").SendAsync("EstadoCambiado", result);
        await _hubContext.Clients.Group($"tenant_{_tenantContext.TenantId}").SendAsync("TicketActualizado", new { id, estado = result.Estado });
        return Ok(result);
    }

    /// <summary>Asignar técnico a un ticket (supervisores/admins asignan a cualquier técnico).</summary>
    [HttpPatch("{id:guid}/asignar")]
    [Authorize(Roles = "Administrador,Supervisor")]
    public async Task<ActionResult<TicketDto>> AsignarTecnico(Guid id, [FromBody] AsignarTecnicoDto dto)
    {
        var result = await _ticketService.AsignarTecnicoAsync(id, dto);
        await _hubContext.Clients.Group($"ticket_{id}").SendAsync("TecnicoAsignado", result);
        return Ok(result);
    }

    /// <summary>Técnico fija el tiempo estimado de resolución (SLA).</summary>
    [HttpPatch("{id:guid}/sla")]
    [Authorize(Roles = "Administrador,Supervisor,Agente")]
    public async Task<ActionResult<TicketDto>> SetSla(Guid id, [FromBody] SetSlaDto dto)
    {
        var result = await _ticketService.SetSlaAsync(id, dto.FechaLimite, dto.Comentario);
        await _hubContext.Clients.Group($"ticket_{id}").SendAsync("TicketActualizado", result);
        return Ok(result);
    }

    /// <summary>Técnico toma el ticket para sí mismo.</summary>
    [HttpPost("{id:guid}/tomar")]
    [Authorize(Roles = "Administrador,Supervisor,Agente")]
    public async Task<ActionResult<TicketDto>> TomarTicket(Guid id)
    {
        var result = await _ticketService.TomarTicketAsync(id);
        await _hubContext.Clients.Group($"ticket_{id}").SendAsync("TecnicoAsignado", result);
        await _hubContext.Clients.Group($"tenant_{_tenantContext.TenantId}").SendAsync("TicketActualizado", new { id, estado = result.Estado });
        return Ok(result);
    }

    /// <summary>Agregar comentario a un ticket.</summary>
    [HttpPost("{id:guid}/comentarios")]
    public async Task<ActionResult<ComentarioDto>> AgregarComentario(Guid id, [FromBody] CreateComentarioDto dto)
    {
        var result = await _ticketService.AgregarComentarioAsync(id, dto);
        await _hubContext.Clients.Group($"ticket_{id}").SendAsync("NuevoComentario", result);
        return Created(string.Empty, result);
    }

    /// <summary>Obtener comentarios de un ticket.</summary>
    [HttpGet("{id:guid}/comentarios")]
    public async Task<ActionResult<IEnumerable<ComentarioDto>>> GetComentarios(Guid id)
    {
        var result = await _ticketService.GetComentariosAsync(id);
        return Ok(result);
    }

    /// <summary>Obtener historial de un ticket.</summary>
    [HttpGet("{id:guid}/historial")]
    public async Task<ActionResult<IEnumerable<HistorialDto>>> GetHistorial(Guid id)
    {
        var result = await _ticketService.GetHistorialAsync(id);
        return Ok(result);
    }

    /// <summary>Escalar un ticket (cambia a prioridad máxima y notifica supervisores).</summary>
    [HttpPost("{id:guid}/escalar")]
    [Authorize(Roles = "Administrador,Supervisor,Agente")]
    public async Task<ActionResult<TicketDto>> EscalarTicket(Guid id, [FromBody] EscalarDto dto)
    {
        var result = await _ticketService.EscalarAsync(id, dto.Motivo);
        await _hubContext.Clients.Group($"ticket_{id}").SendAsync("TicketActualizado", result);
        await _hubContext.Clients.Group($"tenant_{_tenantContext.TenantId}").SendAsync("TicketActualizado", new { id, estado = result.Estado });
        return Ok(result);
    }

    /// <summary>Solicitar aprobación para un ticket.</summary>
    [HttpPost("{id:guid}/solicitar-aprobacion")]
    [Authorize(Roles = "Administrador,Supervisor,Agente")]
    public async Task<IActionResult> SolicitarAprobacion(Guid id, [FromBody] SolicitarAprobacionDto dto)
    {
        var result = await _aprobacionService.SolicitarAprobacionAsync(id, dto.Comentario);
        return Ok(result);
    }

    /// <summary>Asignar etiquetas a un ticket (reemplaza las existentes).</summary>
    [HttpPost("{id:guid}/etiquetas")]
    public async Task<IActionResult> AsignarEtiquetas(Guid id, [FromBody] AsignarEtiquetasDto dto)
    {
        await _etiquetaService.AsignarEtiquetasAsync(id, dto.EtiquetaIds);
        return Ok();
    }

    /// <summary>Quitar una etiqueta de un ticket.</summary>
    [HttpDelete("{id:guid}/etiquetas/{etiquetaId:guid}")]
    public async Task<IActionResult> QuitarEtiqueta(Guid id, Guid etiquetaId)
    {
        await _etiquetaService.QuitarEtiquetaAsync(id, etiquetaId);
        return NoContent();
    }

    /// <summary>Listar motivos de espera disponibles para este ticket.</summary>
    [HttpGet("{id:guid}/motivos-espera")]
    [Authorize(Roles = "Administrador,Supervisor,Agente")]
    public async Task<ActionResult<IEnumerable<MotivoEsperaDto>>> GetMotivosEspera(Guid id)
    {
        var ticket = await _ticketService.GetByIdAsync(id);
        var motivos = await _ticketService.GetMotivosEsperaAsync(ticket.HelpDeskId.HasValue ? ticket.HelpDeskId.Value : null);
        return Ok(motivos);
    }

    /// <summary>Poner el ticket en espera (pausa el SLA).</summary>
    [HttpPatch("{id:guid}/espera")]
    [Authorize(Roles = "Administrador,Supervisor,Agente")]
    public async Task<ActionResult<TicketDto>> PonerEnEspera(Guid id, [FromBody] PonerEnEsperaDto dto)
    {
        var result = await _ticketService.PonerEnEsperaAsync(id, dto);
        await _hubContext.Clients.Group($"ticket_{id}").SendAsync("TicketActualizado", result);
        return Ok(result);
    }

    /// <summary>Reanudar ticket desde espera (reactiva el SLA).</summary>
    [HttpPatch("{id:guid}/reanudar-espera")]
    [Authorize(Roles = "Administrador,Supervisor,Agente")]
    public async Task<ActionResult<TicketDto>> ReanudarEspera(Guid id, [FromBody] ReanudarEsperaDto dto)
    {
        var result = await _ticketService.ReanudarEsperaAsync(id, dto);
        await _hubContext.Clients.Group($"ticket_{id}").SendAsync("TicketActualizado", result);
        return Ok(result);
    }
}

public class SetSlaDto
{
    public DateTime FechaLimite { get; set; }
    public string? Comentario { get; set; }
}

public class EscalarDto
{
    public string? Motivo { get; set; }
}

public class SolicitarAprobacionDto
{
    public string? Comentario { get; set; }
}
