using DeskFlow.Core.DTOs.Catalogo;
using DeskFlow.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DeskFlow.API.Controllers;

[ApiController]
[Route("api/catalogo")]
[Authorize]
public class CatalogoController : ControllerBase
{
    private readonly ICatalogoService _catalogo;

    public CatalogoController(ICatalogoService catalogo) => _catalogo = catalogo;

    /// <summary>Lista de departamentos con conteo de servicios activos.</summary>
    [HttpGet("departamentos")]
    public async Task<ActionResult<IEnumerable<DepartamentoDto>>> GetDepartamentos()
        => Ok(await _catalogo.GetDepartamentosAsync());

    /// <summary>Lista de servicios activos, filtrable por departamento.</summary>
    [HttpGet("servicios")]
    public async Task<ActionResult<IEnumerable<ServicioListItemDto>>> GetServicios(
        [FromQuery] Guid? departamentoId,
        [FromQuery] bool soloPublicos = false)
        => Ok(await _catalogo.GetServiciosAsync(departamentoId, soloPublicos));

    /// <summary>Detalle de un servicio con campos de formulario y plantillas de tareas.</summary>
    [HttpGet("servicios/{id:guid}")]
    public async Task<ActionResult<ServicioDetalleDto>> GetServicio(Guid id)
    {
        try { return Ok(await _catalogo.GetServicioByIdAsync(id)); }
        catch (KeyNotFoundException ex) { return NotFound(ex.Message); }
    }

    /// <summary>Solicitar un servicio del catálogo (crea ticket con formulario).</summary>
    [HttpPost("servicios/{id:guid}/solicitar")]
    public async Task<ActionResult> SolicitarServicio(Guid id, [FromBody] SolicitarServicioDto dto)
    {
        try
        {
            var ticket = await _catalogo.SolicitarServicioAsync(id, dto);
            return Ok(ticket);
        }
        catch (KeyNotFoundException ex) { return NotFound(ex.Message); }
        catch (InvalidOperationException ex) { return BadRequest(ex.Message); }
    }

    /// <summary>Respuestas del formulario de un ticket creado desde catálogo.</summary>
    [HttpGet("tickets/{ticketId:guid}/respuestas")]
    public async Task<ActionResult<IEnumerable<RespuestaFormularioDto>>> GetRespuestas(Guid ticketId)
        => Ok(await _catalogo.GetRespuestasFormularioAsync(ticketId));

    /// <summary>Tareas generadas para un ticket.</summary>
    [HttpGet("tickets/{ticketId:guid}/tareas")]
    public async Task<ActionResult<IEnumerable<TareaDto>>> GetTareas(Guid ticketId)
        => Ok(await _catalogo.GetTareasTicketAsync(ticketId));

    /// <summary>Marcar una tarea como completada.</summary>
    [HttpPost("tareas/{tareaId:guid}/completar")]
    [Authorize(Roles = "Administrador,Supervisor,Agente")]
    public async Task<ActionResult<TareaDto>> CompletarTarea(Guid tareaId)
    {
        try { return Ok(await _catalogo.CompletarTareaAsync(tareaId)); }
        catch (KeyNotFoundException ex) { return NotFound(ex.Message); }
    }
}
