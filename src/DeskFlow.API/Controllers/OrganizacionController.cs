using DeskFlow.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using DeskFlow.Core.Entities;

namespace DeskFlow.API.Controllers;

[ApiController]
[Route("api/organizacion")]
[Authorize(Roles = "Administrador")]
public class OrganizacionController : ControllerBase
{
    private readonly DeskFlowDbContext _context;

    public OrganizacionController(DeskFlowDbContext context)
    {
        _context = context;
    }

    // ── SUCURSALES ────────────────────────────────────────────────

    [HttpGet("sucursales")]
    public async Task<IActionResult> GetSucursales()
    {
        var items = await _context.Sucursales
            .OrderBy(s => s.Nombre)
            .Select(s => new { s.Id, s.Nombre, s.Direccion, s.Activo,
                               UsuariosCount = _context.Usuarios.Count(u => u.SucursalId == s.Id) })
            .ToListAsync();
        return Ok(items);
    }

    [HttpPost("sucursales")]
    public async Task<IActionResult> CreateSucursal([FromBody] SucursalDto dto)
    {
        var sucursal = new Sucursal { Nombre = dto.Nombre, Direccion = dto.Direccion };
        _context.Sucursales.Add(sucursal);
        await _context.SaveChangesAsync();
        return Ok(new { sucursal.Id, sucursal.Nombre, sucursal.Direccion, sucursal.Activo });
    }

    [HttpPut("sucursales/{id}")]
    public async Task<IActionResult> UpdateSucursal(Guid id, [FromBody] SucursalDto dto)
    {
        var sucursal = await _context.Sucursales.FindAsync(id);
        if (sucursal is null) return NotFound();

        sucursal.Nombre = dto.Nombre;
        sucursal.Direccion = dto.Direccion;
        await _context.SaveChangesAsync();
        return Ok(new { sucursal.Id, sucursal.Nombre, sucursal.Direccion, sucursal.Activo });
    }

    [HttpPatch("sucursales/{id}/toggle")]
    public async Task<IActionResult> ToggleSucursal(Guid id)
    {
        var sucursal = await _context.Sucursales.FindAsync(id);
        if (sucursal is null) return NotFound();

        sucursal.Activo = !sucursal.Activo;
        await _context.SaveChangesAsync();
        return Ok(new { sucursal.Id, sucursal.Activo });
    }

    [HttpDelete("sucursales/{id}")]
    public async Task<IActionResult> DeleteSucursal(Guid id)
    {
        var sucursal = await _context.Sucursales.FindAsync(id);
        if (sucursal is null) return NotFound();

        var tieneUsuarios = await _context.Usuarios.AnyAsync(u => u.SucursalId == id);
        if (tieneUsuarios)
            return Conflict(new { message = "La sucursal tiene usuarios asociados. Desactivala en lugar de eliminarla." });

        var tieneTickets = await _context.Tickets.AnyAsync(t => t.SucursalId == id);
        if (tieneTickets)
            return Conflict(new { message = "La sucursal tiene tickets asociados. Desactivala en lugar de eliminarla." });

        _context.Sucursales.Remove(sucursal);
        await _context.SaveChangesAsync();
        return NoContent();
    }

    // ── ÁREAS ─────────────────────────────────────────────────────

    [HttpGet("areas")]
    public async Task<IActionResult> GetAreas()
    {
        var items = await _context.Areas
            .Include(a => a.HelpDesk)
            .OrderBy(a => a.Nombre)
            .Select(a => new
            {
                a.Id, a.Nombre, a.Descripcion, a.Activo, a.HelpDeskId,
                HelpDesk = a.HelpDesk != null ? a.HelpDesk.Nombre : null,
                UsuariosCount = _context.Usuarios.Count(u => u.AreaId == a.Id)
            })
            .ToListAsync();
        return Ok(items);
    }

    [HttpPost("areas")]
    public async Task<IActionResult> CreateArea([FromBody] AreaDto dto)
    {
        if (dto.HelpDeskId.HasValue)
        {
            var hdExiste = await _context.HelpDesks.AnyAsync(h => h.Id == dto.HelpDeskId.Value);
            if (!hdExiste) return BadRequest(new { message = "Help Desk no encontrado." });
        }

        var area = new Area { Nombre = dto.Nombre, Descripcion = dto.Descripcion, HelpDeskId = dto.HelpDeskId };
        _context.Areas.Add(area);
        await _context.SaveChangesAsync();
        return Ok(new { area.Id, area.Nombre, area.Descripcion, area.Activo, area.HelpDeskId });
    }

    [HttpPut("areas/{id}")]
    public async Task<IActionResult> UpdateArea(Guid id, [FromBody] AreaDto dto)
    {
        var area = await _context.Areas.FindAsync(id);
        if (area is null) return NotFound();

        if (dto.HelpDeskId.HasValue)
        {
            var hdExiste = await _context.HelpDesks.AnyAsync(h => h.Id == dto.HelpDeskId.Value);
            if (!hdExiste) return BadRequest(new { message = "Help Desk no encontrado." });
        }

        area.Nombre = dto.Nombre;
        area.Descripcion = dto.Descripcion;
        area.HelpDeskId = dto.HelpDeskId;
        await _context.SaveChangesAsync();
        return Ok(new { area.Id, area.Nombre, area.Descripcion, area.Activo, area.HelpDeskId });
    }

    [HttpPatch("areas/{id}/toggle")]
    public async Task<IActionResult> ToggleArea(Guid id)
    {
        var area = await _context.Areas.FindAsync(id);
        if (area is null) return NotFound();

        area.Activo = !area.Activo;
        await _context.SaveChangesAsync();
        return Ok(new { area.Id, area.Activo });
    }

    [HttpDelete("areas/{id}")]
    public async Task<IActionResult> DeleteArea(Guid id)
    {
        var area = await _context.Areas.FindAsync(id);
        if (area is null) return NotFound();

        var tieneUsuarios = await _context.Usuarios.AnyAsync(u => u.AreaId == id);
        if (tieneUsuarios)
            return Conflict(new { message = "El área tiene usuarios asociados. Desactivala en lugar de eliminarla." });

        var tieneTickets = await _context.Tickets.AnyAsync(t => t.AreaId == id);
        if (tieneTickets)
            return Conflict(new { message = "El área tiene tickets asociados. Desactivala en lugar de eliminarla." });

        _context.Areas.Remove(area);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}

public class SucursalDto
{
    public string Nombre { get; set; } = string.Empty;
    public string? Direccion { get; set; }
}

public class AreaDto
{
    public string Nombre { get; set; } = string.Empty;
    public string? Descripcion { get; set; }
    public Guid? HelpDeskId { get; set; }
}
