using DeskFlow.Core.DTOs.Reportes;
using DeskFlow.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DeskFlow.API.Controllers;

[ApiController]
[Route("api/reportes")]
[Authorize(Roles = "Agente,Supervisor,Administrador,Observador")]
public class ReportesController : ControllerBase
{
    private readonly IReporteService _service;

    public ReportesController(IReporteService service)
    {
        _service = service;
    }

    [HttpGet("tickets/excel")]
    public async Task<IActionResult> TicketsExcel([FromQuery] FiltroReporteTicketsDto filtro)
    {
        var bytes = await _service.GenerarReporteTicketsExcelAsync(filtro);
        var filename = $"tickets_{DateTime.Now:yyyyMMdd_HHmmss}.xlsx";
        return File(bytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", filename);
    }

    [HttpGet("sla/excel")]
    public async Task<IActionResult> SLAExcel([FromQuery] int mes = 0, [FromQuery] int anio = 0)
    {
        var now = DateTime.Now;
        if (mes == 0) mes = now.Month;
        if (anio == 0) anio = now.Year;
        var bytes = await _service.GenerarReporteSLAExcelAsync(mes, anio);
        return File(bytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", $"sla_{anio}_{mes:D2}.xlsx");
    }

    [HttpGet("tecnicos/excel")]
    public async Task<IActionResult> TecnicosExcel([FromQuery] FiltroReporteTecnicosDto filtro)
    {
        var bytes = await _service.GenerarReporteTecnicosExcelAsync(filtro);
        return File(bytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", $"tecnicos_{DateTime.Now:yyyyMMdd}.xlsx");
    }

    [HttpGet("ticket/{id}/pdf")]
    public async Task<IActionResult> TicketPdf(Guid id)
    {
        var bytes = await _service.GenerarReporteTicketPdfAsync(id);
        return File(bytes, "application/pdf", $"ticket_{id}.pdf");
    }
}
