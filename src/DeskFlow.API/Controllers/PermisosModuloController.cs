using DeskFlow.Core.DTOs.Permisos;
using DeskFlow.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DeskFlow.API.Controllers;

[ApiController]
[Route("api/admin/permisos-modulo")]
[Authorize]
public class PermisosModuloController : ControllerBase
{
    private readonly IPermisosModuloService _service;

    public PermisosModuloController(IPermisosModuloService service)
    {
        _service = service;
    }

    /// <summary>Matriz completa roles × módulos (solo admins)</summary>
    [HttpGet]
    [Authorize(Roles = "Administrador")]
    public async Task<IActionResult> GetMatriz()
    {
        var result = await _service.GetMatrizAsync();
        return Ok(result);
    }

    /// <summary>Módulos accesibles para el usuario actual (todos los roles)</summary>
    [HttpGet("mis-modulos")]
    public async Task<IActionResult> GetMisModulos()
    {
        var result = await _service.GetModulosUsuarioAsync();
        return Ok(result);
    }

    /// <summary>Actualizar permisos de un rol</summary>
    [HttpPut("{rolId}")]
    [Authorize(Roles = "Administrador")]
    public async Task<IActionResult> ActualizarRol(Guid rolId, [FromBody] ActualizarPermisosRolDto dto)
    {
        await _service.ActualizarPermisosRolAsync(rolId, dto);
        return NoContent();
    }

    /// <summary>Resetear permisos de un rol a valores por defecto</summary>
    [HttpPost("{rolId}/reset")]
    [Authorize(Roles = "Administrador")]
    public async Task<IActionResult> ResetearRol(Guid rolId)
    {
        await _service.ResetearRolAsync(rolId);
        return NoContent();
    }

    /// <summary>Lista de todos los módulos disponibles</summary>
    [HttpGet("modulos")]
    [Authorize(Roles = "Administrador")]
    public IActionResult GetModulos()
    {
        var modulos = ModulosClave.Todos.Select(m => new
        {
            clave = m.Clave,
            nombre = m.Nombre,
            grupo = m.Grupo
        });
        return Ok(modulos);
    }
}
