using DeskFlow.Core.DTOs.Problemas;
using DeskFlow.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DeskFlow.API.Controllers;

[ApiController]
[Route("api/problemas")]
[Authorize]
public class ProblemasController : ControllerBase
{
    private readonly IProblemaService _service;
    public ProblemasController(IProblemaService service) => _service = service;

    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] bool? soloErroresConocidos,
        [FromQuery] Guid? responsableId)
        => Ok(await _service.GetAllAsync(soloErroresConocidos, responsableId));

    [HttpGet("estados")]
    public async Task<IActionResult> GetEstados()
        => Ok(await _service.GetEstadosAsync());

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        try { return Ok(await _service.GetByIdAsync(id)); }
        catch (KeyNotFoundException) { return NotFound(); }
    }

    [HttpPost]
    [Authorize(Roles = "Administrador,Supervisor,Agente")]
    public async Task<IActionResult> Create([FromBody] CreateProblemaDto dto)
    {
        var result = await _service.CreateAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Administrador,Supervisor,Agente")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateProblemaDto dto)
    {
        try { return Ok(await _service.UpdateAsync(id, dto)); }
        catch (KeyNotFoundException) { return NotFound(); }
    }

    [HttpPost("{id}/vincular-incidente")]
    [Authorize(Roles = "Administrador,Supervisor,Agente")]
    public async Task<IActionResult> VincularIncidente(Guid id, [FromBody] VincularIncidenteDto dto)
    {
        try { return Ok(await _service.VincularIncidenteAsync(id, dto.TicketId)); }
        catch (KeyNotFoundException e) { return NotFound(e.Message); }
    }

    [HttpDelete("{id}/incidentes/{ticketId}")]
    [Authorize(Roles = "Administrador,Supervisor,Agente")]
    public async Task<IActionResult> DesvincularIncidente(Guid id, Guid ticketId)
    {
        await _service.DesvincularIncidenteAsync(id, ticketId);
        return NoContent();
    }

    [HttpPost("{id}/error-conocido")]
    [Authorize(Roles = "Administrador,Supervisor,Agente")]
    public async Task<IActionResult> MarcarErrorConocido(Guid id)
    {
        try { return Ok(await _service.MarcarErrorConocidoAsync(id)); }
        catch (KeyNotFoundException) { return NotFound(); }
    }

    [HttpPost("{id}/resolver")]
    [Authorize(Roles = "Administrador,Supervisor,Agente")]
    public async Task<IActionResult> Resolver(Guid id, [FromBody] ResolverProblemaDto dto)
    {
        try { return Ok(await _service.ResolverAsync(id, dto)); }
        catch (KeyNotFoundException) { return NotFound(); }
        catch (InvalidOperationException e) { return BadRequest(e.Message); }
    }

    [HttpPost("{id}/cerrar")]
    [Authorize(Roles = "Administrador,Supervisor")]
    public async Task<IActionResult> Cerrar(Guid id)
    {
        try { return Ok(await _service.CerrarAsync(id)); }
        catch (KeyNotFoundException) { return NotFound(); }
    }
}
