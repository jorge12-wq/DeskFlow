using DeskFlow.Core.DTOs.Permisos;

namespace DeskFlow.Core.Interfaces;

public interface IPermisosModuloService
{
    Task<List<RolPermisosDto>> GetMatrizAsync();
    Task ActualizarPermisosRolAsync(Guid rolId, ActualizarPermisosRolDto dto);
    Task<List<string>> GetModulosUsuarioAsync();
    Task ResetearRolAsync(Guid rolId);
}
