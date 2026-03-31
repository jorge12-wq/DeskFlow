import apiClient from './client';
import type { Usuario, Rol, Etiqueta, AuditLog, PagedResult, Sucursal, Area } from '../types';

export interface UpdateUserData {
  nombre: string;
  apellido: string;
  email: string;
  sucursalId?: string;
  areaId?: string;
}

export const usuariosApi = {
  getAll: () =>
    apiClient.get<Usuario[]>('/usuarios').then(r => r.data),

  getRoles: () =>
    apiClient.get<Rol[]>('/usuarios/roles').then(r => r.data),

  getSucursales: () =>
    apiClient.get<Sucursal[]>('/catalogos/sucursales').then(r => r.data),

  getAreas: () =>
    apiClient.get<Area[]>('/catalogos/areas').then(r => r.data),

  create: (data: { nombre: string; apellido: string; email: string; password: string; rolId: string }) =>
    apiClient.post<Usuario>('/auth/register', data).then(r => r.data),

  update: (id: string, data: UpdateUserData) =>
    apiClient.put<Usuario>(`/usuarios/${id}`, data).then(r => r.data),

  delete: (id: string) =>
    apiClient.delete(`/usuarios/${id}`),

  toggleActivo: (id: string) =>
    apiClient.patch(`/usuarios/${id}/toggle`).then(r => r.data),

  cambiarRol: (id: string, rolId: string) =>
    apiClient.patch(`/usuarios/${id}/rol`, { rolId }).then(r => r.data),
};

export const etiquetasApi = {
  getAll: () =>
    apiClient.get<Etiqueta[]>('/etiquetas').then(r => r.data),

  create: (data: { nombre: string; color: string }) =>
    apiClient.post<Etiqueta>('/etiquetas', data).then(r => r.data),

  update: (id: string, data: { nombre?: string; color?: string; activo?: boolean }) =>
    apiClient.put<Etiqueta>(`/etiquetas/${id}`, data).then(r => r.data),

  delete: (id: string) =>
    apiClient.delete(`/etiquetas/${id}`),

  getEstadisticas: () =>
    apiClient.get<Array<{ id: string; nombre: string; color: string; cantidadTickets: number }>>('/etiquetas/estadisticas').then(r => r.data),
};

export const auditoriaApi = {
  getPaged: (params: { entidad?: string; entidadId?: string; pagina?: number; porPagina?: number }) => {
    const p = new URLSearchParams();
    if (params.entidad) p.set('entidad', params.entidad);
    if (params.entidadId) p.set('entidadId', params.entidadId);
    if (params.pagina) p.set('pagina', String(params.pagina));
    if (params.porPagina) p.set('porPagina', String(params.porPagina));
    return apiClient.get<PagedResult<AuditLog>>(`/auditoria?${p}`).then(r => r.data);
  },
};
