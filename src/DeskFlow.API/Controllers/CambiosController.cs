using DeskFlow.Core.DTOs.Cambios;
using DeskFlow.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DeskFlow.API.Controllers;

[ApiController]
[Route("api/cambios")]
[Authorize]
public class CambiosController : ControllerBase
{
    private readonly ICambioService _service;
    public CambiosController(ICambioService service) => _service = service;

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? estado, [FromQuery] Guid? implementadorId)
        => Ok(await _service.GetAllAsync(estado, implementadorId));

    [HttpGet("calendario")]
    public async Task<IActionResult> GetCalendario(
        [FromQuery] DateTime? desde,
        [FromQuery] DateTime? hasta)
    {
        var d = desde ?? DateTime.UtcNow.AddMonths(-1);
        var h = hasta ?? DateTime.UtcNow.AddMonths(3);
        return Ok(await _service.GetCalendarioAsync(d, h));
    }

    [HttpGet("tipos")]
    public async Task<IActionResult> GetTipos() => Ok(await _service.GetTiposAsync());

    [HttpGet("estados")]
    public async Task<IActionResult> GetEstados() => Ok(await _service.GetEstadosAsync());

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        try { return Ok(await _service.GetByIdAsync(id)); }
        catch (KeyNotFoundException) { return NotFound(); }
    }

    [HttpPost]
    [Authorize(Roles = "Administrador,Supervisor,Agente")]
    public async Task<IActionResult> Create([FromBody] CreateCambioDto dto)
    {
        var result = await _service.CreateAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Administrador,Supervisor,Agente")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateCambioDto dto)
    {
        try { return Ok(await _service.UpdateAsync(id, dto)); }
        catch (KeyNotFoundException) { return NotFound(); }
        catch (InvalidOperationException e) { return BadRequest(e.Message); }
    }

    [HttpPost("{id}/enviar-cab")]
    [Authorize(Roles = "Administrador,Supervisor,Agente")]
    public async Task<IActionResult> EnviarCAB(Guid id, [FromBody] EnviarCABDto dto)
    {
        try { return Ok(await _service.EnviarACABAsync(id, dto)); }
        catch (KeyNotFoundException) { return NotFound(); }
    }

    [HttpPost("{id}/votar-cab")]
    [Authorize(Roles = "Administrador,Supervisor,Aprobador")]
    public async Task<IActionResult> VotarCAB(Guid id, [FromBody] VotarCABDto dto)
    {
        try { return Ok(await _service.VotarCABAsync(id, dto)); }
        catch (KeyNotFoundException e) { return BadRequest(e.Message); }
    }

    [HttpPost("{id}/iniciar-implementacion")]
    [Authorize(Roles = "Administrador,Supervisor,Agente")]
    public async Task<IActionResult> IniciarImplementacion(Guid id, [FromBody] IniciarImplementacionDto dto)
    {
        try { return Ok(await _service.IniciarImplementacionAsync(id, dto)); }
        catch (KeyNotFoundException) { return NotFound(); }
        catch (InvalidOperationException e) { return BadRequest(e.Message); }
    }

    [HttpPost("{id}/completar-implementacion")]
    [Authorize(Roles = "Administrador,Supervisor,Agente")]
    public async Task<IActionResult> CompletarImplementacion(Guid id, [FromBody] CompletarImplementacionDto dto)
    {
        try { return Ok(await _service.CompletarImplementacionAsync(id, dto)); }
        catch (KeyNotFoundException) { return NotFound(); }
    }

    [HttpPost("{id}/cerrar")]
    [Authorize(Roles = "Administrador,Supervisor")]
    public async Task<IActionResult> Cerrar(Guid id)
    {
        try { return Ok(await _service.CerrarAsync(id)); }
        catch (KeyNotFoundException) { return NotFound(); }
    }

    [HttpPost("{id}/rechazar")]
    [Authorize(Roles = "Administrador,Supervisor")]
    public async Task<IActionResult> Rechazar(Guid id, [FromBody] RechazarCambioDto dto)
    {
        try { return Ok(await _service.RechazarAsync(id, dto.Motivo)); }
        catch (KeyNotFoundException) { return NotFound(); }
    }
}

public record RechazarCambioDto(string? Motivo);
