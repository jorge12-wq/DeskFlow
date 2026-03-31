using DeskFlow.Core.DTOs.HelpDesks;
using DeskFlow.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DeskFlow.API.Controllers;

[ApiController]
[Route("api/helpdesks")]
[Authorize]
public class HelpDesksController : ControllerBase
{
    private readonly IHelpDeskService _service;
    public HelpDesksController(IHelpDeskService service) => _service = service;

    [HttpGet]
    public async Task<IActionResult> GetAll() => Ok(await _service.GetAllAsync());

    [HttpGet("mis-helpdesks")]
    public async Task<IActionResult> GetMisHelpDesks() => Ok(await _service.GetMisHelpDesksAsync());

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var hd = await _service.GetByIdAsync(id);
        return hd == null ? NotFound() : Ok(hd);
    }

    [HttpPost]
    [Authorize(Roles = "Administrador")]
    public async Task<IActionResult> Create([FromBody] CreateHelpDeskDto dto)
    {
        var hd = await _service.CreateAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = hd.Id }, hd);
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = "Administrador,Supervisor")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateHelpDeskDto dto)
    {
        try { return Ok(await _service.UpdateAsync(id, dto)); }
        catch (KeyNotFoundException) { return NotFound(); }
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Administrador")]
    public async Task<IActionResult> Delete(Guid id)
    {
        try { await _service.DeleteAsync(id); return NoContent(); }
        catch (KeyNotFoundException) { return NotFound(); }
    }

    [HttpPost("{id:guid}/agentes")]
    [Authorize(Roles = "Administrador,Supervisor")]
    public async Task<IActionResult> AsignarAgente(Guid id, [FromBody] AsignarAgenteDto dto)
    {
        await _service.AsignarAgenteAsync(id, dto);
        return Ok();
    }

    [HttpDelete("{id:guid}/agentes/{usuarioId:guid}")]
    [Authorize(Roles = "Administrador,Supervisor")]
    public async Task<IActionResult> RemoverAgente(Guid id, Guid usuarioId)
    {
        await _service.RemoverAgenteAsync(id, usuarioId);
        return NoContent();
    }
}
