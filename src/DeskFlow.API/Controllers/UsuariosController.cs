using DeskFlow.Core.Interfaces;
using DeskFlow.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DeskFlow.API.Controllers;

[ApiController]
[Route("api/usuarios")]
[Authorize(Roles = "Administrador,Supervisor")]
public class UsuariosController : ControllerBase
{
    private readonly DeskFlowDbContext _context;
    private readonly ITenantContext _tenantContext;

    public UsuariosController(DeskFlowDbContext context, ITenantContext tenantContext)
    {
        _context = context;
        _tenantContext = tenantContext;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var usuarios = await _context.Usuarios
            .Include(u => u.Rol)
            .Include(u => u.Sucursal)
            .Include(u => u.Area)
            .OrderBy(u => u.Nombre)
            .Select(u => new
            {
                u.Id,
                u.Nombre,
                u.Apellido,
                u.Email,
                u.Activo,
                u.FechaCreacion,
                Rol = u.Rol.Nombre,
                RolId = u.RolId,
                Sucursal = u.Sucursal != null ? u.Sucursal.Nombre : null,
                SucursalId = u.SucursalId,
                Area = u.Area != null ? u.Area.Nombre : null,
                AreaId = u.AreaId,
            })
            .ToListAsync();

        return Ok(usuarios);
    }

    [HttpGet("roles")]
    public async Task<IActionResult> GetRoles()
    {
        var roles = await _context.Roles
            .OrderBy(r => r.Nombre)
            .Select(r => new { r.Id, r.Nombre, r.Descripcion })
            .ToListAsync();

        return Ok(roles);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Administrador")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateUsuarioDto dto)
    {
        var usuario = await _context.Usuarios.FindAsync(id);
        if (usuario is null) return NotFound();

        usuario.Nombre = dto.Nombre;
        usuario.Apellido = dto.Apellido;
        usuario.Email = dto.Email;
        usuario.SucursalId = dto.SucursalId;
        usuario.AreaId = dto.AreaId;

        await _context.SaveChangesAsync();
        return Ok(new { usuario.Id, usuario.Nombre, usuario.Apellido, usuario.Email });
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Administrador")]
    public async Task<IActionResult> Delete(Guid id)
    {
        if (id == _tenantContext.UsuarioId)
            return BadRequest(new { message = "No puedes eliminar tu propia cuenta." });

        var usuario = await _context.Usuarios.FindAsync(id);
        if (usuario is null) return NotFound();

        var tieneTickets = await _context.Tickets
            .AnyAsync(t => t.UsuarioCreadorId == id || t.TecnicoAsignadoId == id || t.SupervisorId == id);

        if (tieneTickets)
            return Conflict(new { message = "El usuario tiene tickets asociados. Desactivalo en lugar de eliminarlo." });

        _context.Usuarios.Remove(usuario);
        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpPatch("{id}/toggle")]
    [Authorize(Roles = "Administrador")]
    public async Task<IActionResult> ToggleActivo(Guid id)
    {
        var usuario = await _context.Usuarios.FindAsync(id);
        if (usuario is null) return NotFound();

        // Prevent deactivating yourself
        if (usuario.Id == _tenantContext.UsuarioId)
            return BadRequest(new { message = "No puedes desactivar tu propia cuenta." });

        usuario.Activo = !usuario.Activo;
        await _context.SaveChangesAsync();

        return Ok(new { usuario.Id, usuario.Activo });
    }

    [HttpPatch("{id}/rol")]
    [Authorize(Roles = "Administrador")]
    public async Task<IActionResult> CambiarRol(Guid id, [FromBody] CambiarRolDto dto)
    {
        var usuario = await _context.Usuarios.Include(u => u.Rol).FirstOrDefaultAsync(u => u.Id == id);
        if (usuario is null) return NotFound();

        // Prevent changing your own role
        if (usuario.Id == _tenantContext.UsuarioId)
            return BadRequest(new { message = "No puedes cambiar tu propio rol." });

        var rolExiste = await _context.Roles.AnyAsync(r => r.Id == dto.RolId);
        if (!rolExiste) return BadRequest(new { message = "Rol no encontrado." });

        usuario.RolId = dto.RolId;
        await _context.SaveChangesAsync();

        var rolNombre = await _context.Roles.Where(r => r.Id == dto.RolId).Select(r => r.Nombre).FirstAsync();
        return Ok(new { usuario.Id, RolId = dto.RolId, Rol = rolNombre });
    }
}

public class CambiarRolDto
{
    public Guid RolId { get; set; }
}

public class UpdateUsuarioDto
{
    public string Nombre { get; set; } = string.Empty;
    public string Apellido { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public Guid? SucursalId { get; set; }
    public Guid? AreaId { get; set; }
}
