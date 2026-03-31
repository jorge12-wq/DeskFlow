import apiClient from './client';
import type {
  Ticket, TicketListItem, CreateTicketRequest,
  PagedResult, TicketFilter, Comentario, Historial, MiTrabajoStats
} from '../types';

export const ticketsApi = {
  getAll: (filter: TicketFilter = {}) => {
    const params = new URLSearchParams();
    if (filter.page) params.set('page', String(filter.page));
    if (filter.pageSize) params.set('pageSize', String(filter.pageSize));
    if (filter.estadoId) params.set('estadoId', filter.estadoId);
    if (filter.prioridadId) params.set('prioridadId', filter.prioridadId);
    if (filter.tecnicoId) params.set('tecnicoId', filter.tecnicoId);
    if (filter.categoriaId) params.set('categoriaId', filter.categoriaId);
    if (filter.busqueda) params.set('busqueda', filter.busqueda);
    if (filter.soloSinAsignar) params.set('soloSinAsignar', 'true');
    if (filter.soloFinales !== undefined) params.set('soloFinales', String(filter.soloFinales));
    if (filter.helpDeskId) params.set('helpDeskId', filter.helpDeskId);
    if (filter.areaId) params.set('areaId', filter.areaId);
    if (filter.fechaDesde) params.set('fechaDesde', filter.fechaDesde);
    if (filter.fechaHasta) params.set('fechaHasta', filter.fechaHasta);
    if (filter.usuarioCreadorId) params.set('usuarioCreadorId', filter.usuarioCreadorId);
    if (filter.ordenarPor) params.set('ordenarPor', filter.ordenarPor);
    if (filter.direccion) params.set('direccion', filter.direccion);
    return apiClient.get<PagedResult<TicketListItem>>(`/tickets?${params}`).then(r => r.data);
  },

  getById: (id: string) =>
    apiClient.get<Ticket>(`/tickets/${id}`).then(r => r.data),

  create: (data: CreateTicketRequest) =>
    apiClient.post<Ticket>('/tickets', data).then(r => r.data),

  update: (id: string, data: Partial<CreateTicketRequest>) =>
    apiClient.put<Ticket>(`/tickets/${id}`, data).then(r => r.data),

  cambiarEstado: (id: string, estadoId: string, comentario?: string) =>
    apiClient.patch<Ticket>(`/tickets/${id}/estado`, { estadoId, comentario }).then(r => r.data),

  asignarTecnico: (id: string, tecnicoId: string, supervisorId?: string, comentario?: string) =>
    apiClient.patch<Ticket>(`/tickets/${id}/asignar`, { tecnicoId, supervisorId, comentario }).then(r => r.data),

  tomarTicket: (id: string) =>
    apiClient.post<Ticket>(`/tickets/${id}/tomar`).then(r => r.data),

  setSla: (id: string, fechaLimite: string, comentario?: string) =>
    apiClient.patch<Ticket>(`/tickets/${id}/sla`, { fechaLimite, comentario }).then(r => r.data),

  addComentario: (id: string, contenido: string, esInterno = false) =>
    apiClient.post<Comentario>(`/tickets/${id}/comentarios`, { contenido, esInterno }).then(r => r.data),

  getComentarios: (id: string) =>
    apiClient.get<Comentario[]>(`/tickets/${id}/comentarios`).then(r => r.data),

  getHistorial: (id: string) =>
    apiClient.get<Historial[]>(`/tickets/${id}/historial`).then(r => r.data),

  getMiTrabajo: () =>
    apiClient.get<MiTrabajoStats>('/tickets/mi-trabajo').then(r => r.data),

  getMotivosEspera: (ticketId: string) =>
    apiClient.get<MotivoEspera[]>(`/tickets/${ticketId}/motivos-espera`).then(r => r.data),

  ponerEnEspera: (id: string, motivoEsperaId?: string, comentario?: string) =>
    apiClient.patch<import('../types').Ticket>(`/tickets/${id}/espera`, { motivoEsperaId, comentario }).then(r => r.data),

  reanudarEspera: (id: string, comentario?: string) =>
    apiClient.patch<import('../types').Ticket>(`/tickets/${id}/reanudar-espera`, { comentario }).then(r => r.data),
};

export interface MotivoEspera {
  id: string;
  nombre: string;
  descripcion?: string;
  icono: string;
  helpDeskId?: string;
  helpDesk?: string;
  activo: boolean;
  orden: number;
}
