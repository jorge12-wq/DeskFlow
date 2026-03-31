import apiClient from './client';

export interface ModuloInfo {
  clave: string;
  nombre: string;
  grupo: string;
  activo: boolean;
}

export interface RolPermisos {
  rolId: string;
  rolNombre: string;
  modulos: ModuloInfo[];
}

export const permisosModuloApi = {
  getMatriz: () =>
    apiClient.get<RolPermisos[]>('/admin/permisos-modulo').then(r => r.data),

  getMisModulos: () =>
    apiClient.get<string[]>('/admin/permisos-modulo/mis-modulos').then(r => r.data),

  actualizarRol: (rolId: string, modulosActivos: string[]) =>
    apiClient.put(`/admin/permisos-modulo/${rolId}`, { modulosActivos }),

  resetearRol: (rolId: string) =>
    apiClient.post(`/admin/permisos-modulo/${rolId}/reset`),
};
