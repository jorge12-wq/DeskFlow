import apiClient from './client';
import type { Departamento, ServicioListItem, ServicioDetalle, RespuestaFormulario, TareaTicket } from '../types';

export const catalogoApi = {
  getDepartamentos: () =>
    apiClient.get<Departamento[]>('/catalogo/departamentos').then(r => r.data),

  getServicios: (departamentoId?: string, soloPublicos = false) => {
    const params = new URLSearchParams();
    if (departamentoId) params.set('departamentoId', departamentoId);
    if (soloPublicos) params.set('soloPublicos', 'true');
    return apiClient.get<ServicioListItem[]>(`/catalogo/servicios?${params}`).then(r => r.data);
  },

  getServicio: (id: string) =>
    apiClient.get<ServicioDetalle>(`/catalogo/servicios/${id}`).then(r => r.data),

  solicitarServicio: (id: string, respuestas: Record<string, string>) =>
    apiClient.post(`/catalogo/servicios/${id}/solicitar`, { respuestas }).then(r => r.data),

  getRespuestas: (ticketId: string) =>
    apiClient.get<RespuestaFormulario[]>(`/catalogo/tickets/${ticketId}/respuestas`).then(r => r.data),

  getTareas: (ticketId: string) =>
    apiClient.get<TareaTicket[]>(`/catalogo/tickets/${ticketId}/tareas`).then(r => r.data),

  completarTarea: (tareaId: string) =>
    apiClient.post<TareaTicket>(`/catalogo/tareas/${tareaId}/completar`).then(r => r.data),
};
