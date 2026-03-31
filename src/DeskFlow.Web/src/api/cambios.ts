import apiClient from './client';
import type { CambioListItem, CambioDetalle, TipoCambio, EstadoCambio, CambioCalendarioItem } from '../types';

export const cambiosApi = {
  getAll: (params?: { estado?: string; implementadorId?: string }) =>
    apiClient.get<CambioListItem[]>('/cambios', { params }).then(r => r.data),

  getCalendario: (desde?: string, hasta?: string) =>
    apiClient.get<CambioCalendarioItem[]>('/cambios/calendario', { params: { desde, hasta } }).then(r => r.data),

  getTipos: () =>
    apiClient.get<TipoCambio[]>('/cambios/tipos').then(r => r.data),

  getEstados: () =>
    apiClient.get<EstadoCambio[]>('/cambios/estados').then(r => r.data),

  getById: (id: string) =>
    apiClient.get<CambioDetalle>(`/cambios/${id}`).then(r => r.data),

  create: (dto: {
    titulo: string;
    descripcion: string;
    tipoCambioId: string;
    prioridadId: string;
    categoriaId?: string;
    implementadorId?: string;
    riesgo: string;
    impacto: string;
    urgencia: string;
    descripcionImpacto?: string;
    planImplementacion?: string;
    planPruebas?: string;
    planBackout?: string;
    fechaInicioPlaneado?: string;
    fechaFinPlaneado?: string;
  }) => apiClient.post<CambioDetalle>('/cambios', dto).then(r => r.data),

  update: (id: string, dto: Partial<{
    titulo: string; descripcion: string; tipoCambioId: string;
    prioridadId: string; categoriaId: string; implementadorId: string;
    riesgo: string; impacto: string; urgencia: string;
    descripcionImpacto: string; planImplementacion: string;
    planPruebas: string; planBackout: string;
    fechaInicioPlaneado: string; fechaFinPlaneado: string;
  }>) => apiClient.put<CambioDetalle>(`/cambios/${id}`, dto).then(r => r.data),

  enviarCAB: (id: string, aprobadoresIds?: string[]) =>
    apiClient.post<CambioDetalle>(`/cambios/${id}/enviar-cab`, { aprobadoresIds }).then(r => r.data),

  votarCAB: (id: string, aprobado: boolean, comentario?: string) =>
    apiClient.post<CambioDetalle>(`/cambios/${id}/votar-cab`, { aprobado, comentario }).then(r => r.data),

  iniciarImplementacion: (id: string, comentario?: string) =>
    apiClient.post<CambioDetalle>(`/cambios/${id}/iniciar-implementacion`, { comentario }).then(r => r.data),

  completarImplementacion: (id: string, resultadoPostImpl: string) =>
    apiClient.post<CambioDetalle>(`/cambios/${id}/completar-implementacion`, { resultadoPostImpl }).then(r => r.data),

  cerrar: (id: string) =>
    apiClient.post<CambioDetalle>(`/cambios/${id}/cerrar`).then(r => r.data),

  rechazar: (id: string, motivo?: string) =>
    apiClient.post<CambioDetalle>(`/cambios/${id}/rechazar`, { motivo }).then(r => r.data),
};
