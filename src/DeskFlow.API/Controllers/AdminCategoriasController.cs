using DeskFlow.Core.Entities;
using DeskFlow.Core.Interfaces;
using DeskFlow.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DeskFlow.API.Controllers;

[ApiController]
[Route("api/admin/categorias")]
[Authorize(Roles = "Administrador,Supervisor")]
public class AdminCategoriasController : ControllerBase
{
    private readonly DeskFlowDbContext _context;
    private readonly ITenantContext _tenantContext;

    public AdminCategoriasController(DeskFlowDbContext context, ITenantContext tenantContext)
    {
        _context = context;
        _tenantContext = tenantContext;
    }

    // ── Categorías ──────────────────────────────────────────────

    [HttpGet]
    public async Task<IActionResult> GetCategorias()
    {
        var categorias = await _context.Categorias
            .Include(c => c.Subcategorias.OrderBy(s => s.Nombre))
            .OrderBy(c => c.Nombre)
            .Select(c => new
            {
                c.Id, c.Nombre, c.Descripcion, c.Icono, c.Activo,
                Subcategorias = c.Subcategorias.Select(s => new { s.Id, s.Nombre, s.Descripcion, s.Activo })
            })
            .ToListAsync();
        return Ok(categorias);
    }

    [HttpPost]
    public async Task<IActionResult> CreateCategoria([FromBody] CategoriaDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Nombre))
            return BadRequest(new { message = "El nombre es obligatorio." });

        var categoria = new Categoria
        {
            TenantId = _tenantContext.TenantId,
            Nombre = dto.Nombre.Trim(),
            Descripcion = dto.Descripcion?.Trim(),
            Icono = dto.Icono?.Trim(),
            Activo = true,
        };

        await _context.Categorias.AddAsync(categoria);
        await _context.SaveChangesAsync();
        return Ok(new { categoria.Id, categoria.Nombre, categoria.Descripcion, categoria.Icono, categoria.Activo, Subcategorias = new object[0] });
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> UpdateCategoria(Guid id, [FromBody] CategoriaDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Nombre))
            return BadRequest(new { message = "El nombre es obligatorio." });

        var categoria = await _context.Categorias.FirstOrDefaultAsync(c => c.Id == id);
        if (categoria is null) return NotFound();

        categoria.Nombre = dto.Nombre.Trim();
        categoria.Descripcion = dto.Descripcion?.Trim();
        categoria.Icono = dto.Icono?.Trim();
        await _context.SaveChangesAsync();
        return Ok(new { categoria.Id, categoria.Nombre, categoria.Descripcion, categoria.Icono, categoria.Activo });
    }

    [HttpPatch("{id:guid}/toggle")]
    public async Task<IActionResult> ToggleCategoria(Guid id)
    {
        var categoria = await _context.Categorias.FirstOrDefaultAsync(c => c.Id == id);
        if (categoria is null) return NotFound();

        categoria.Activo = !categoria.Activo;
        await _context.SaveChangesAsync();
        return Ok(new { categoria.Id, categoria.Activo });
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteCategoria(Guid id)
    {
        var categoria = await _context.Categorias
            .Include(c => c.Tickets)
            .FirstOrDefaultAsync(c => c.Id == id);
        if (categoria is null) return NotFound();

        if (categoria.Tickets.Any())
            return BadRequest(new { message = "No se puede eliminar: la categoría tiene tickets asociados." });

        _context.Categorias.Remove(categoria);
        await _context.SaveChangesAsync();
        return NoContent();
    }

    // ── Subcategorías ───────────────────────────────────────────

    [HttpPost("{categoriaId:guid}/subcategorias")]
    public async Task<IActionResult> CreateSubcategoria(Guid categoriaId, [FromBody] SubcategoriaDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Nombre))
            return BadRequest(new { message = "El nombre es obligatorio." });

        var categoria = await _context.Categorias.FirstOrDefaultAsync(c => c.Id == categoriaId);
        if (categoria is null) return NotFound();

        var sub = new Subcategoria
        {
            TenantId = _tenantContext.TenantId,
            CategoriaId = categoriaId,
            Nombre = dto.Nombre.Trim(),
            Descripcion = dto.Descripcion?.Trim(),
            Activo = true,
        };

        await _context.Subcategorias.AddAsync(sub);
        await _context.SaveChangesAsync();
        return Ok(new { sub.Id, sub.Nombre, sub.Descripcion, sub.Activo });
    }

    [HttpPut("{categoriaId:guid}/subcategorias/{subId:guid}")]
    public async Task<IActionResult> UpdateSubcategoria(Guid categoriaId, Guid subId, [FromBody] SubcategoriaDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Nombre))
            return BadRequest(new { message = "El nombre es obligatorio." });

        var sub = await _context.Subcategorias.FirstOrDefaultAsync(s => s.Id == subId && s.CategoriaId == categoriaId);
        if (sub is null) return NotFound();

        sub.Nombre = dto.Nombre.Trim();
        sub.Descripcion = dto.Descripcion?.Trim();
        await _context.SaveChangesAsync();
        return Ok(new { sub.Id, sub.Nombre, sub.Descripcion, sub.Activo });
    }

    [HttpPatch("{categoriaId:guid}/subcategorias/{subId:guid}/toggle")]
    public async Task<IActionResult> ToggleSubcategoria(Guid categoriaId, Guid subId)
    {
        var sub = await _context.Subcategorias.FirstOrDefaultAsync(s => s.Id == subId && s.CategoriaId == categoriaId);
        if (sub is null) return NotFound();

        sub.Activo = !sub.Activo;
        await _context.SaveChangesAsync();
        return Ok(new { sub.Id, sub.Activo });
    }

    [HttpDelete("{categoriaId:guid}/subcategorias/{subId:guid}")]
    public async Task<IActionResult> DeleteSubcategoria(Guid categoriaId, Guid subId)
    {
        var sub = await _context.Subcategorias
            .Include(s => s.Tickets)
            .FirstOrDefaultAsync(s => s.Id == subId && s.CategoriaId == categoriaId);
        if (sub is null) return NotFound();

        if (sub.Tickets.Any())
            return BadRequest(new { message = "No se puede eliminar: la subcategoría tiene tickets asociados." });

        _context.Subcategorias.Remove(sub);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}

public class CategoriaDto
{
    public string Nombre { get; set; } = string.Empty;
    public string? Descripcion { get; set; }
    public string? Icono { get; set; }
}

public class SubcategoriaDto
{
    public string Nombre { get; set; } = string.Empty;
    public string? Descripcion { get; set; }
}
