using DeskFlow.Core.DTOs.Aprobaciones;
using DeskFlow.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DeskFlow.API.Controllers;

[ApiController]
[Route("api/aprobaciones")]
[Authorize]
public class AprobacionesController : ControllerBase
{
    private readonly IAprobacionService _service;

    public AprobacionesController(IAprobacionService service)
    {
        _service = service;
    }

    /// <summary>Obtener aprobaciones pendientes (para el Aprobador).</summary>
    [HttpGet("pendientes")]
    [Authorize(Roles = "Administrador,Supervisor,Aprobador")]
    public async Task<IActionResult> GetPendientes()
        => Ok(await _service.GetPendientesAsync());

    /// <summary>Obtener historial de aprobaciones.</summary>
    [HttpGet("historial")]
    [Authorize(Roles = "Administrador,Supervisor,Aprobador")]
    public async Task<IActionResult> GetHistorial()
        => Ok(await _service.GetHistorialAsync());

    /// <summary>Aprobar o rechazar una solicitud.</summary>
    [HttpPost("{id:guid}/decidir")]
    [Authorize(Roles = "Administrador,Supervisor,Aprobador")]
    public async Task<IActionResult> Decidir(Guid id, [FromBody] DecidirAprobacionDto dto)
    {
        var result = await _service.DecidirAsync(id, dto.Aprobado, dto.Comentario);
        return Ok(result);
    }
}
