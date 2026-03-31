using DeskFlow.Core.DTOs.Plantillas;
using DeskFlow.Core.Entities;
using DeskFlow.Core.Interfaces;
using DeskFlow.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DeskFlow.API.Controllers;

[ApiController]
[Route("api/plantillas")]
[Authorize]
public class PlantillasController : ControllerBase
{
    private readonly DeskFlowDbContext _context;
    private readonly ITenantContext _tenantContext;

    public PlantillasController(DeskFlowDbContext context, ITenantContext tenantContext)
    {
        _context = context;
        _tenantContext = tenantContext;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] Guid? categoriaId)
    {
        var query = _context.Plantillas
            .Include(p => p.Categoria)
            .Include(p => p.CreadoPor)
            .Where(p => p.Activo)
            .AsQueryable();

        if (categoriaId.HasValue)
            query = query.Where(p => p.CategoriaId == categoriaId.Value || p.CategoriaId == null);

        var plantillas = await query
            .OrderBy(p => p.Nombre)
            .Select(p => new PlantillaDto
            {
                Id = p.Id,
                Nombre = p.Nombre,
                Contenido = p.Contenido,
                CategoriaId = p.CategoriaId,
                Categoria = p.Categoria != null ? p.Categoria.Nombre : null,
                CreadoPor = $"{p.CreadoPor.Nombre} {p.CreadoPor.Apellido}",
                FechaCreacion = p.FechaCreacion
            })
            .ToListAsync();

        return Ok(plantillas);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var p = await _context.Plantillas
            .Include(x => x.Categoria)
            .Include(x => x.CreadoPor)
            .FirstOrDefaultAsync(x => x.Id == id && x.Activo);

        if (p == null) return NotFound();

        return Ok(new PlantillaDto
        {
            Id = p.Id,
            Nombre = p.Nombre,
            Contenido = p.Contenido,
            CategoriaId = p.CategoriaId,
            Categoria = p.Categoria?.Nombre,
            CreadoPor = $"{p.CreadoPor.Nombre} {p.CreadoPor.Apellido}",
            FechaCreacion = p.FechaCreacion
        });
    }

    [HttpPost]
    [Authorize(Roles = "Administrador,Supervisor,Agente")]
    public async Task<IActionResult> Create([FromBody] CreatePlantillaDto dto)
    {
        var plantilla = new Plantilla
        {
            TenantId = _tenantContext.TenantId,
            Nombre = dto.Nombre,
            Contenido = dto.Contenido,
            CategoriaId = dto.CategoriaId,
            CreadoPorId = _tenantContext.UsuarioId,
            Activo = true,
            FechaCreacion = DateTime.UtcNow
        };

        await _context.Plantillas.AddAsync(plantilla);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = plantilla.Id }, new { plantilla.Id });
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = "Administrador,Supervisor,Agente")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdatePlantillaDto dto)
    {
        var plantilla = await _context.Plantillas.FirstOrDefaultAsync(p => p.Id == id && p.Activo);
        if (plantilla == null) return NotFound();

        if (dto.Nombre != null) plantilla.Nombre = dto.Nombre;
        if (dto.Contenido != null) plantilla.Contenido = dto.Contenido;
        if (dto.CategoriaId.HasValue) plantilla.CategoriaId = dto.CategoriaId.Value;

        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Administrador,Supervisor")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var plantilla = await _context.Plantillas.FirstOrDefaultAsync(p => p.Id == id && p.Activo);
        if (plantilla == null) return NotFound();

        plantilla.Activo = false;
        await _context.SaveChangesAsync();
        return NoContent();
    }
}
