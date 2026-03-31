using DeskFlow.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DeskFlow.API.Controllers;

[ApiController]
[Route("api/notificaciones")]
[Authorize]
public class NotificacionesController : ControllerBase
{
    private readonly INotificacionService _service;
    private readonly ITenantContext _tenantContext;

    public NotificacionesController(INotificacionService service, ITenantContext tenantContext)
    {
        _service = service;
        _tenantContext = tenantContext;
    }

    [HttpGet]
    public async Task<IActionResult> GetMias()
    {
        var notificaciones = await _service.GetByUsuarioAsync(_tenantContext.UsuarioId);
        return Ok(notificaciones);
    }

    [HttpGet("no-leidas")]
    public async Task<IActionResult> GetNoLeidasCount()
    {
        var count = await _service.GetNoLeidasCountAsync(_tenantContext.UsuarioId);
        return Ok(new { count });
    }

    [HttpPatch("{id:guid}/leer")]
    public async Task<IActionResult> MarcarLeida(Guid id)
    {
        await _service.MarcarLeidaAsync(id, _tenantContext.UsuarioId);
        return NoContent();
    }

    [HttpPatch("leer-todas")]
    public async Task<IActionResult> MarcarTodasLeidas()
    {
        await _service.MarcarTodasLeidasAsync(_tenantContext.UsuarioId);
        return NoContent();
    }
}
