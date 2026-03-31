using DeskFlow.Core.DTOs.Gamificacion;
using DeskFlow.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DeskFlow.API.Controllers;

[ApiController]
[Route("api/gamificacion")]
[Authorize]
public class GamificacionController : ControllerBase
{
    private readonly IGamificacionService _service;
    public GamificacionController(IGamificacionService service) => _service = service;

    [HttpGet("ranking")]
    public async Task<IActionResult> GetRanking([FromQuery] string periodo = "mes") =>
        Ok(await _service.GetRankingAsync(periodo));

    [HttpGet("mi-perfil")]
    public async Task<IActionResult> GetMiPerfil() =>
        Ok(await _service.GetMiPerfilAsync());

    [HttpGet("mis-logros")]
    public async Task<IActionResult> GetMisLogros() =>
        Ok(await _service.GetMisLogrosAsync());

    [HttpPost("check-badges")]
    public async Task<IActionResult> CheckBadges([FromQuery] Guid usuarioId)
    {
        await _service.CheckAndAwardBadgesAsync(usuarioId);
        return Ok();
    }

    // Dashboard personalizado
    [HttpGet("mis-widgets")]
    public async Task<IActionResult> GetMisWidgets() =>
        Ok(await _service.GetMisWidgetsAsync());

    [HttpPut("mis-widgets")]
    public async Task<IActionResult> SaveWidgets([FromBody] List<WidgetConfigDto> widgets)
    {
        await _service.SaveWidgetsAsync(widgets);
        return Ok();
    }

    // Reportes compartidos
    [HttpGet("reportes")]
    public async Task<IActionResult> GetMisReportes() =>
        Ok(await _service.GetMisReportesAsync());

    [HttpPost("reportes")]
    [Authorize(Roles = "Administrador,Supervisor,Agente")]
    public async Task<IActionResult> CrearReporte([FromBody] CrearReporteCompartidoDto dto) =>
        Ok(await _service.CrearReporteCompartidoAsync(dto));

    [HttpDelete("reportes/{id:guid}")]
    public async Task<IActionResult> EliminarReporte(Guid id)
    {
        await _service.EliminarReporteCompartidoAsync(id);
        return NoContent();
    }

    [HttpGet("reportes/publico/{token}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetReportePublico(string token)
    {
        var datos = await _service.GetDatosReporteCompartidoAsync(token);
        return datos == null ? NotFound("Reporte no encontrado o expirado") : Ok(datos);
    }
}
