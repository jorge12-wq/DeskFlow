using DeskFlow.Core.DTOs.Permisos;
using DeskFlow.Core.Entities;
using DeskFlow.Core.Interfaces;
using DeskFlow.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace DeskFlow.Infrastructure.Services;

public class PermisosModuloService : IPermisosModuloService
{
    private readonly DeskFlowDbContext _context;
    private readonly ITenantContext _tenant;

    public PermisosModuloService(DeskFlowDbContext context, ITenantContext tenant)
    {
        _context = context;
        _tenant = tenant;
    }

    public async Task<List<RolPermisosDto>> GetMatrizAsync()
    {
        var roles = await _context.Roles.OrderBy(r => r.Nombre).ToListAsync();
        var permisosExistentes = await _context.PermisosModulo.ToListAsync();

        var resultado = new List<RolPermisosDto>();

        foreach (var rol in roles)
        {
            var permisosRol = permisosExistentes.Where(p => p.RolId == rol.Id).ToList();
            var modulosDefault = ModulosClave.DefaultPorRol.GetValueOrDefault(rol.Nombre, new List<string>());

            var modulos = ModulosClave.Todos.Select(m =>
            {
                bool activo;
                var permisoExistente = permisosRol.FirstOrDefault(p => p.ModuloClave == m.Clave);
                if (permisoExistente != null)
                    activo = permisoExistente.Activo;
                else
                    activo = modulosDefault.Contains(m.Clave);

                return new ModuloInfoDto
                {
                    Clave = m.Clave,
                    Nombre = m.Nombre,
                    Grupo = m.Grupo,
                    Activo = activo
                };
            }).ToList();

            resultado.Add(new RolPermisosDto
            {
                RolId = rol.Id,
                RolNombre = rol.Nombre,
                Modulos = modulos
            });
        }

        return resultado;
    }

    public async Task ActualizarPermisosRolAsync(Guid rolId, ActualizarPermisosRolDto dto)
    {
        var permisosExistentes = await _context.PermisosModulo
            .Where(p => p.RolId == rolId)
            .ToListAsync();

        foreach (var modulo in ModulosClave.Todos)
        {
            var activo = dto.ModulosActivos.Contains(modulo.Clave);
            var existente = permisosExistentes.FirstOrDefault(p => p.ModuloClave == modulo.Clave);

            if (existente != null)
            {
                existente.Activo = activo;
            }
            else
            {
                _context.PermisosModulo.Add(new PermisoModulo
                {
                    TenantId = _tenant.TenantId,
                    RolId = rolId,
                    ModuloClave = modulo.Clave,
                    Activo = activo
                });
            }
        }

        await _context.SaveChangesAsync();
    }

    public async Task<List<string>> GetModulosUsuarioAsync()
    {
        var rolNombre = _tenant.RolNombre;

        var permisosConfigurados = await _context.PermisosModulo
            .Where(p => p.Rol.Nombre == rolNombre)
            .ToListAsync();

        if (permisosConfigurados.Count > 0)
        {
            return permisosConfigurados
                .Where(p => p.Activo)
                .Select(p => p.ModuloClave)
                .ToList();
        }

        // Fallback a defaults
        var defaults = ModulosClave.DefaultPorRol.GetValueOrDefault(rolNombre, new List<string>());
        return defaults.ToList();
    }

    public async Task ResetearRolAsync(Guid rolId)
    {
        var permisos = await _context.PermisosModulo
            .Where(p => p.RolId == rolId)
            .ToListAsync();

        _context.PermisosModulo.RemoveRange(permisos);
        await _context.SaveChangesAsync();
    }
}
