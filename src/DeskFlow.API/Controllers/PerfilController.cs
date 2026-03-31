using DeskFlow.Core.Interfaces;
using DeskFlow.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DeskFlow.API.Controllers;

[ApiController]
[Route("api/perfil")]
[Authorize]
public class PerfilController : ControllerBase
{
    private readonly DeskFlowDbContext _context;
    private readonly ITenantContext _tenantContext;

    public PerfilController(DeskFlowDbContext context, ITenantContext tenantContext)
    {
        _context = context;
        _tenantContext = tenantContext;
    }

    [HttpGet]
    public async Task<IActionResult> GetMiPerfil()
    {
        var usuario = await _context.Usuarios
            .Include(u => u.Rol)
            .Include(u => u.Sucursal)
            .Include(u => u.Area)
            .Where(u => u.Id == _tenantContext.UsuarioId)
            .Select(u => new
            {
                u.Id, u.Nombre, u.Apellido, u.Email, u.FechaCreacion,
                Rol = u.Rol.Nombre,
                Sucursal = u.Sucursal != null ? u.Sucursal.Nombre : null,
                Area = u.Area != null ? u.Area.Nombre : null,
            })
            .FirstOrDefaultAsync();

        if (usuario is null) return NotFound();
        return Ok(usuario);
    }

    [HttpPut]
    public async Task<IActionResult> ActualizarPerfil([FromBody] ActualizarPerfilDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Nombre) || string.IsNullOrWhiteSpace(dto.Apellido))
            return BadRequest(new { message = "Nombre y apellido son obligatorios." });

        var usuario = await _context.Usuarios.FindAsync(_tenantContext.UsuarioId);
        if (usuario is null) return NotFound();

        usuario.Nombre = dto.Nombre.Trim();
        usuario.Apellido = dto.Apellido.Trim();
        await _context.SaveChangesAsync();

        return Ok(new { usuario.Id, usuario.Nombre, usuario.Apellido, usuario.Email });
    }

    [HttpPost("cambiar-contrasena")]
    public async Task<IActionResult> CambiarContrasena([FromBody] CambiarContrasenaDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.ContrasenaNueva) || dto.ContrasenaNueva.Length < 6)
            return BadRequest(new { message = "La nueva contraseña debe tener al menos 6 caracteres." });

        var usuario = await _context.Usuarios.FindAsync(_tenantContext.UsuarioId);
        if (usuario is null) return NotFound();

        if (!BCrypt.Net.BCrypt.Verify(dto.ContrasenaActual, usuario.PasswordHash))
            return BadRequest(new { message = "La contraseña actual es incorrecta." });

        usuario.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.ContrasenaNueva);
        await _context.SaveChangesAsync();

        return NoContent();
    }
}

public class ActualizarPerfilDto
{
    public string Nombre { get; set; } = string.Empty;
    public string Apellido { get; set; } = string.Empty;
}

public class CambiarContrasenaDto
{
    public string ContrasenaActual { get; set; } = string.Empty;
    public string ContrasenaNueva { get; set; } = string.Empty;
}
