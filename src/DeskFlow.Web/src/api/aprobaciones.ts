import apiClient from './client';

export interface Aprobacion {
  id: string;
  ticketId: string;
  numeroTicket: string;
  asuntoTicket: string;
  estadoTicket: string;
  prioridadTicket: string;
  prioridadColor: string;
  solicitanteTicket: string;
  estado: 0 | 1 | 2; // 0=Pendiente, 1=Aprobado, 2=Rechazado
  aprobador?: string;
  comentario?: string;
  fechaDecision?: string;
  fechaCreacion: string;
  fechaCreacionTicket: string;
}

export const aprobacionesApi = {
  getPendientes: () =>
    apiClient.get<Aprobacion[]>('/aprobaciones/pendientes').then(r => r.data),

  getHistorial: () =>
    apiClient.get<Aprobacion[]>('/aprobaciones/historial').then(r => r.data),

  decidir: (id: string, aprobado: boolean, comentario?: string) =>
    apiClient.post(`/aprobaciones/${id}/decidir`, { aprobado, comentario }).then(r => r.data),

  solicitarAprobacion: (ticketId: string, comentario?: string) =>
    apiClient.post(`/tickets/${ticketId}/solicitar-aprobacion`, { comentario }).then(r => r.data),

  escalar: (ticketId: string, motivo?: string) =>
    apiClient.post(`/tickets/${ticketId}/escalar`, { motivo }).then(r => r.data),
};
