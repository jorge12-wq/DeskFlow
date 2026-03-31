import apiClient from './client';

export interface HelpDeskAgente {
  id: string;
  usuarioId: string;
  nombreCompleto: string;
  email: string;
  rol: string;
  esResponsable: boolean;
  fechaAsignacion: string;
}

export interface HelpDeskListItem {
  id: string;
  nombre: string;
  descripcion?: string;
  icono?: string;
  color: string;
  activo: boolean;
  esPublico: boolean;
  orden: number;
  cantidadAgentes: number;
  ticketsAbiertos: number;
}

export interface HelpDeskDetalle {
  id: string;
  nombre: string;
  descripcion?: string;
  icono?: string;
  color: string;
  activo: boolean;
  esPublico: boolean;
  orden: number;
  fechaCreacion: string;
  agentes: HelpDeskAgente[];
  ticketsAbiertos: number;
  ticketsHoy: number;
}

export interface MiHelpDesk {
  id: string;
  nombre: string;
  icono?: string;
  color: string;
  esResponsable: boolean;
}

export const helpdesksApi = {
  getAll: () =>
    apiClient.get<HelpDeskListItem[]>('/helpdesks').then(r => r.data),

  getMisHelpDesks: () =>
    apiClient.get<MiHelpDesk[]>('/helpdesks/mis-helpdesks').then(r => r.data),

  getById: (id: string) =>
    apiClient.get<HelpDeskDetalle>(`/helpdesks/${id}`).then(r => r.data),

  create: (dto: { nombre: string; descripcion?: string; icono?: string; color: string; esPublico: boolean; orden: number }) =>
    apiClient.post<HelpDeskDetalle>('/helpdesks', dto).then(r => r.data),

  update: (id: string, dto: { nombre: string; descripcion?: string; icono?: string; color: string; activo: boolean; esPublico: boolean; orden: number }) =>
    apiClient.put<HelpDeskDetalle>(`/helpdesks/${id}`, dto).then(r => r.data),

  delete: (id: string) =>
    apiClient.delete(`/helpdesks/${id}`),

  asignarAgente: (helpDeskId: string, usuarioId: string, esResponsable: boolean) =>
    apiClient.post(`/helpdesks/${helpDeskId}/agentes`, { usuarioId, esResponsable }),

  removerAgente: (helpDeskId: string, usuarioId: string) =>
    apiClient.delete(`/helpdesks/${helpDeskId}/agentes/${usuarioId}`),
};
