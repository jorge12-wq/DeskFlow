using DeskFlow.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DeskFlow.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CatalogosController : ControllerBase
{
    private readonly DeskFlowDbContext _context;

    public CatalogosController(DeskFlowDbContext context)
    {
        _context = context;
    }

    [HttpGet("estados")]
    public async Task<IActionResult> GetEstados()
    {
        var estados = await _context.EstadosTicket
            .OrderBy(e => e.Orden)
            .Select(e => new { e.Id, e.Nombre, e.Color, e.EsFinal })
            .ToListAsync();
        return Ok(estados);
    }

    [HttpGet("prioridades")]
    public async Task<IActionResult> GetPrioridades()
    {
        var prioridades = await _context.Prioridades
            .OrderBy(p => p.Orden)
            .Select(p => new { p.Id, p.Nombre, p.Color, p.TiempoRespuestaSLA_Horas, p.TiempoResolucionSLA_Horas })
            .ToListAsync();
        return Ok(prioridades);
    }

    [HttpGet("categorias")]
    public async Task<IActionResult> GetCategorias()
    {
        var categorias = await _context.Categorias
            .Where(c => c.Activo)
            .Include(c => c.Subcategorias.Where(s => s.Activo))
            .OrderBy(c => c.Nombre)
            .Select(c => new
            {
                c.Id, c.Nombre, c.Descripcion, c.Icono,
                Subcategorias = c.Subcategorias.Select(s => new { s.Id, s.Nombre, s.Descripcion })
            })
            .ToListAsync();
        return Ok(categorias);
    }

    [HttpGet("sucursales")]
    public async Task<IActionResult> GetSucursales()
    {
        var sucursales = await _context.Sucursales
            .Where(s => s.Activo)
            .OrderBy(s => s.Nombre)
            .Select(s => new { s.Id, s.Nombre, s.Direccion })
            .ToListAsync();
        return Ok(sucursales);
    }

    [HttpGet("areas")]
    public async Task<IActionResult> GetAreas()
    {
        var areas = await _context.Areas
            .Where(a => a.Activo)
            .OrderBy(a => a.Nombre)
            .Select(a => new { a.Id, a.Nombre, a.Descripcion, a.HelpDeskId })
            .ToListAsync();
        return Ok(areas);
    }

    [HttpGet("tecnicos")]
    [Authorize(Roles = "Administrador,Supervisor")]
    public async Task<IActionResult> GetTecnicos()
    {
        var tecnicos = await _context.Usuarios
            .Include(u => u.Rol)
            .Where(u => u.Activo && (u.Rol.Nombre == "Agente" || u.Rol.Nombre == "Supervisor"))
            .OrderBy(u => u.Nombre)
            .Select(u => new { u.Id, NombreCompleto = u.Nombre + " " + u.Apellido, u.Email })
            .ToListAsync();
        return Ok(tecnicos);
    }
}
