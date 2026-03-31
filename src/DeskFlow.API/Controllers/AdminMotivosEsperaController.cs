using DeskFlow.Core.Entities;
using DeskFlow.Core.Interfaces;
using DeskFlow.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DeskFlow.API.Controllers;

[ApiController]
[Route("api/admin/motivos-espera")]
[Authorize(Roles = "Administrador,Supervisor")]
public class AdminMotivosEsperaController : ControllerBase
{
    private readonly DeskFlowDbContext _db;
    private readonly ITenantContext _tenant;

    public AdminMotivosEsperaController(DeskFlowDbContext db, ITenantContext tenant)
    {
        _db = db;
        _tenant = tenant;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var items = await _db.MotivosEspera
            .Include(m => m.HelpDesk)
            .OrderBy(m => m.Orden).ThenBy(m => m.Nombre)
            .Select(m => new
            {
                m.Id, m.Nombre, m.Descripcion, m.Icono,
                m.HelpDeskId, helpDesk = m.HelpDesk != null ? m.HelpDesk.Nombre : null,
                m.Activo, m.Orden
            })
            .ToListAsync();
        return Ok(items);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] MotivoEsperaFormDto dto)
    {
        var motivo = new MotivoEspera
        {
            TenantId    = _tenant.TenantId,
            Nombre      = dto.Nombre.Trim(),
            Descripcion = dto.Descripcion?.Trim(),
            Icono       = dto.Icono ?? "⏳",
            HelpDeskId  = dto.HelpDeskId,
            Activo      = true,
            Orden       = dto.Orden,
        };
        _db.MotivosEspera.Add(motivo);
        await _db.SaveChangesAsync();
        return Ok(new { motivo.Id });
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] MotivoEsperaFormDto dto)
    {
        var motivo = await _db.MotivosEspera.FindAsync(id);
        if (motivo == null) return NotFound();

        motivo.Nombre      = dto.Nombre.Trim();
        motivo.Descripcion = dto.Descripcion?.Trim();
        motivo.Icono       = dto.Icono ?? "⏳";
        motivo.HelpDeskId  = dto.HelpDeskId;
        motivo.Orden       = dto.Orden;

        await _db.SaveChangesAsync();
        return Ok();
    }

    [HttpPatch("{id:guid}/toggle")]
    public async Task<IActionResult> Toggle(Guid id)
    {
        var motivo = await _db.MotivosEspera.FindAsync(id);
        if (motivo == null) return NotFound();
        motivo.Activo = !motivo.Activo;
        await _db.SaveChangesAsync();
        return Ok(new { motivo.Activo });
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var motivo = await _db.MotivosEspera.FindAsync(id);
        if (motivo == null) return NotFound();
        _db.MotivosEspera.Remove(motivo);
        await _db.SaveChangesAsync();
        return Ok();
    }
}

public record MotivoEsperaFormDto(
    string Nombre,
    string? Descripcion,
    string? Icono,
    Guid? HelpDeskId,
    int Orden
);
