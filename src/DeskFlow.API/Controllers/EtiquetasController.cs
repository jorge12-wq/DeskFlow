using DeskFlow.Core.DTOs.Etiquetas;
using DeskFlow.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DeskFlow.API.Controllers;

[ApiController]
[Route("api/etiquetas")]
[Authorize]
public class EtiquetasController : ControllerBase
{
    private readonly IEtiquetaService _service;

    public EtiquetasController(IEtiquetaService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var result = await _service.GetAllAsync();
        return Ok(result);
    }

    [HttpGet("estadisticas")]
    public async Task<IActionResult> GetEstadisticas()
    {
        var result = await _service.GetEstadisticasAsync();
        return Ok(result);
    }

    [HttpPost]
    [Authorize(Roles = "Supervisor,Administrador")]
    public async Task<IActionResult> Create([FromBody] CreateEtiquetaDto dto)
    {
        var result = await _service.CreateAsync(dto);
        return CreatedAtAction(nameof(GetAll), result);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Supervisor,Administrador")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateEtiquetaDto dto)
    {
        var result = await _service.UpdateAsync(id, dto);
        return Ok(result);
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Supervisor,Administrador")]
    public async Task<IActionResult> Delete(Guid id)
    {
        await _service.DeleteAsync(id);
        return NoContent();
    }
}
