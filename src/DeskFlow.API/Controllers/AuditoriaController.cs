using DeskFlow.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DeskFlow.API.Controllers;

[ApiController]
[Route("api/auditoria")]
[Authorize(Roles = "Administrador")]
public class AuditoriaController : ControllerBase
{
    private readonly IAuditLogService _service;

    public AuditoriaController(IAuditLogService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<IActionResult> GetPaged(
        [FromQuery] string? entidad,
        [FromQuery] Guid? entidadId,
        [FromQuery] int pagina = 1,
        [FromQuery] int porPagina = 20)
    {
        var result = await _service.GetPagedAsync(entidad, entidadId, pagina, porPagina);
        return Ok(result);
    }
}
