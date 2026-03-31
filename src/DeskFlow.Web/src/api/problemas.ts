import apiClient from './client';
import type { ProblemaListItem, ProblemaDetalle, EstadoProblema } from '../types';

export const problemasApi = {
  getAll: (params?: { soloErroresConocidos?: boolean; responsableId?: string }) =>
    apiClient.get<ProblemaListItem[]>('/problemas', { params }).then(r => r.data),

  getEstados: () =>
    apiClient.get<EstadoProblema[]>('/problemas/estados').then(r => r.data),

  getById: (id: string) =>
    apiClient.get<ProblemaDetalle>(`/problemas/${id}`).then(r => r.data),

  create: (dto: {
    titulo: string;
    descripcion: string;
    prioridadId: string;
    categoriaId?: string;
    responsableId?: string;
    ticketOrigenId?: string;
  }) => apiClient.post<ProblemaDetalle>('/problemas', dto).then(r => r.data),

  update: (id: string, dto: {
    titulo?: string;
    descripcion?: string;
    prioridadId?: string;
    categoriaId?: string;
    responsableId?: string;
    estadoId?: string;
    causaRaiz?: string;
    workaround?: string;
    solucion?: string;
    esErrorConocido?: boolean;
  }) => apiClient.put<ProblemaDetalle>(`/problemas/${id}`, dto).then(r => r.data),

  vincularIncidente: (id: string, ticketId: string) =>
    apiClient.post<ProblemaDetalle>(`/problemas/${id}/vincular-incidente`, { ticketId }).then(r => r.data),

  desvincularIncidente: (id: string, ticketId: string) =>
    apiClient.delete(`/problemas/${id}/incidentes/${ticketId}`),

  marcarErrorConocido: (id: string) =>
    apiClient.post<ProblemaDetalle>(`/problemas/${id}/error-conocido`).then(r => r.data),

  resolver: (id: string, dto: { solucion: string; causaRaiz?: string; actualizarIncidentesVinculados: boolean }) =>
    apiClient.post<ProblemaDetalle>(`/problemas/${id}/resolver`, dto).then(r => r.data),

  cerrar: (id: string) =>
    apiClient.post<ProblemaDetalle>(`/problemas/${id}/cerrar`).then(r => r.data),
};
