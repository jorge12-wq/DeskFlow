using DeskFlow.Core.DTOs.Dashboard;
using DeskFlow.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DeskFlow.API.Controllers;

[ApiController]
[Route("api/dashboard")]
[Authorize]
public class DashboardController : ControllerBase
{
    private readonly IDashboardService _service;
    private readonly IEncuestaService _encuestaService;
    private readonly IBaseConocimientoService _conocimientoService;

    public DashboardController(IDashboardService service, IEncuestaService encuestaService, IBaseConocimientoService conocimientoService)
    {
        _service = service;
        _encuestaService = encuestaService;
        _conocimientoService = conocimientoService;
    }

    [HttpGet]
    public async Task<ActionResult<DashboardDto>> GetDashboard()
        => Ok(await _service.GetDashboardAsync());

    [HttpGet("resumen")]
    public async Task<ActionResult<DashboardResumenDto>> GetResumen()
        => Ok(await _service.GetResumenAsync());

    [HttpGet("por-mes")]
    public async Task<IActionResult> GetPorMes([FromQuery] int? anio)
        => Ok(await _service.GetTicketsPorMesAsync(anio ?? DateTime.UtcNow.Year));

    [HttpGet("por-tecnico")]
    [Authorize(Roles = "Administrador,Supervisor,Observador")]
    public async Task<IActionResult> GetPorTecnico()
        => Ok(await _service.GetTicketsPorTecnicoAsync());

    [HttpGet("por-categoria")]
    public async Task<IActionResult> GetPorCategoria()
        => Ok(await _service.GetTicketsPorCategoriaAsync());

    [HttpGet("tiempo-promedio")]
    [Authorize(Roles = "Administrador,Supervisor,Observador")]
    public async Task<IActionResult> GetTiempoPromedio()
        => Ok(await _service.GetTiempoPromedioAsync());

    [HttpGet("sla-cumplimiento")]
    [Authorize(Roles = "Administrador,Supervisor,Observador")]
    public async Task<IActionResult> GetSLACumplimiento([FromQuery] int? anio)
        => Ok(await _service.GetSLACumplimientoAsync(anio ?? DateTime.UtcNow.Year));

    [HttpGet("satisfaccion")]
    [Authorize(Roles = "Administrador,Supervisor,Observador")]
    public async Task<IActionResult> GetSatisfaccion()
    {
        var promedio = await _encuestaService.GetPromedioGeneralAsync();
        var tendencia = await _encuestaService.GetPorMesAsync();
        return Ok(new { promedio, tendencia });
    }

    [HttpGet("conocimiento")]
    public async Task<IActionResult> GetConocimiento()
    {
        var populares = await _conocimientoService.GetPopularesAsync();
        return Ok(new { populares });
    }
}
