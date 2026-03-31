using DeskFlow.Core.Entities;
using DeskFlow.Core.Interfaces;
using DeskFlow.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DeskFlow.API.Controllers;

[ApiController]
[Route("api/tecnico-categorias")]
[Authorize(Roles = "Administrador,Supervisor")]
public class TecnicoCategoriasController : ControllerBase
{
    private readonly DeskFlowDbContext _context;
    private readonly ITenantContext _tenantContext;

    public TecnicoCategoriasController(DeskFlowDbContext context, ITenantContext tenantContext)
    {
        _context = context;
        _tenantContext = tenantContext;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var result = await _context.TecnicoCategorias
            .Include(tc => tc.Tecnico)
            .Include(tc => tc.Categoria)
            .Select(tc => new
            {
                tc.Id,
                TecnicoId = tc.TecnicoId,
                NombreTecnico = $"{tc.Tecnico.Nombre} {tc.Tecnico.Apellido}",
                EmailTecnico = tc.Tecnico.Email,
                CategoriaId = tc.CategoriaId,
                NombreCategoria = tc.Categoria.Nombre
            })
            .OrderBy(x => x.NombreTecnico)
            .ToListAsync();

        return Ok(result);
    }

    [HttpGet("por-tecnico/{tecnicoId:guid}")]
    public async Task<IActionResult> GetByTecnico(Guid tecnicoId)
    {
        var categorias = await _context.TecnicoCategorias
            .Include(tc => tc.Categoria)
            .Where(tc => tc.TecnicoId == tecnicoId)
            .Select(tc => new { tc.Id, CategoriaId = tc.CategoriaId, NombreCategoria = tc.Categoria.Nombre })
            .ToListAsync();

        return Ok(categorias);
    }

    [HttpPost]
    public async Task<IActionResult> Asignar([FromBody] AsignarCategoriaTecnicoDto dto)
    {
        var existe = await _context.TecnicoCategorias.AnyAsync(tc =>
            tc.TecnicoId == dto.TecnicoId && tc.CategoriaId == dto.CategoriaId);

        if (existe)
            return Conflict("El técnico ya tiene asignada esta categoría.");

        var tecnicoCategoria = new TecnicoCategoria
        {
            TenantId = _tenantContext.TenantId,
            TecnicoId = dto.TecnicoId,
            CategoriaId = dto.CategoriaId
        };

        await _context.TecnicoCategorias.AddAsync(tecnicoCategoria);
        await _context.SaveChangesAsync();

        return Ok(new { tecnicoCategoria.Id });
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Eliminar(Guid id)
    {
        var tc = await _context.TecnicoCategorias.FindAsync(id);
        if (tc == null) return NotFound();

        _context.TecnicoCategorias.Remove(tc);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}

public class AsignarCategoriaTecnicoDto
{
    public Guid TecnicoId { get; set; }
    public Guid CategoriaId { get; set; }
}
