import apiClient from './client';
import type { Dashboard, Estado, Prioridad, Categoria, Sucursal, Area, Tecnico } from '../types';

export const dashboardApi = {
  get: () => apiClient.get<Dashboard>('/dashboard').then(r => r.data),
};

export const catalogosApi = {
  getEstados: () => apiClient.get<Estado[]>('/catalogos/estados').then(r => r.data),
  getPrioridades: () => apiClient.get<Prioridad[]>('/catalogos/prioridades').then(r => r.data),
  getCategorias: () => apiClient.get<Categoria[]>('/catalogos/categorias').then(r => r.data),
  getSucursales: () => apiClient.get<Sucursal[]>('/catalogos/sucursales').then(r => r.data),
  getAreas: () => apiClient.get<Area[]>('/catalogos/areas').then(r => r.data),
  getTecnicos: () => apiClient.get<Tecnico[]>('/catalogos/tecnicos').then(r => r.data),
};
