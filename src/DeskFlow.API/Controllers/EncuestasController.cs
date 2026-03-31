using DeskFlow.Core.DTOs.Encuestas;
using DeskFlow.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DeskFlow.API.Controllers;

[ApiController]
[Route("api/encuestas")]
[Authorize]
public class EncuestasController : ControllerBase
{
    private readonly IEncuestaService _service;

    public EncuestasController(IEncuestaService service)
    {
        _service = service;
    }

    [HttpGet("pendientes")]
    public async Task<IActionResult> GetPendientes()
    {
        var result = await _service.GetPendientesAsync();
        return Ok(result);
    }

    [HttpPost("responder")]
    public async Task<IActionResult> Responder([FromBody] ResponderEncuestaDto dto)
    {
        var result = await _service.ResponderAsync(dto);
        return Ok(result);
    }

    [HttpGet("promedio")]
    [Authorize(Roles = "Supervisor,Administrador")]
    public async Task<IActionResult> GetPromedio()
    {
        var result = await _service.GetPromedioGeneralAsync();
        return Ok(new { promedio = result });
    }

    [HttpGet("por-tecnico")]
    [Authorize(Roles = "Supervisor,Administrador")]
    public async Task<IActionResult> GetPorTecnico()
    {
        var result = await _service.GetPorTecnicoAsync();
        return Ok(result);
    }

    [HttpGet("por-mes")]
    [Authorize(Roles = "Supervisor,Administrador")]
    public async Task<IActionResult> GetPorMes()
    {
        var result = await _service.GetPorMesAsync();
        return Ok(result);
    }

    [HttpGet("detalle")]
    [Authorize(Roles = "Supervisor,Administrador")]
    public async Task<IActionResult> GetDetalle([FromQuery] Guid? tecnicoId)
    {
        var result = await _service.GetDetalleAsync(tecnicoId);
        return Ok(result);
    }
}
