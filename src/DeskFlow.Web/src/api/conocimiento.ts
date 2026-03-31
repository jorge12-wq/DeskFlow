import apiClient from './client';
import type { ArticuloListItem, Articulo, AdjuntoArticulo, CreateArticuloRequest, PagedResult } from '../types';

export const conocimientoApi = {
  buscar: (params: { buscar?: string; categoriaId?: string; pagina?: number; porPagina?: number }) => {
    const p = new URLSearchParams();
    if (params.buscar) p.set('buscar', params.buscar);
    if (params.categoriaId) p.set('categoriaId', params.categoriaId);
    if (params.pagina) p.set('pagina', String(params.pagina));
    if (params.porPagina) p.set('porPagina', String(params.porPagina));
    return apiClient.get<PagedResult<ArticuloListItem>>(`/conocimiento?${p}`).then(r => r.data);
  },

  getById: (id: string) =>
    apiClient.get<Articulo>(`/conocimiento/${id}`).then(r => r.data),

  getPopulares: () =>
    apiClient.get<ArticuloListItem[]>('/conocimiento/populares').then(r => r.data),

  getRelacionados: (id: string) =>
    apiClient.get<ArticuloListItem[]>(`/conocimiento/${id}/relacionados`).then(r => r.data),

  sugerirParaTicket: (ticketId: string) =>
    apiClient.get<ArticuloListItem[]>(`/conocimiento/sugerir?ticketId=${ticketId}`).then(r => r.data),

  create: (data: CreateArticuloRequest) =>
    apiClient.post<Articulo>('/conocimiento', data).then(r => r.data),

  update: (id: string, data: Partial<CreateArticuloRequest>) =>
    apiClient.put<Articulo>(`/conocimiento/${id}`, data).then(r => r.data),

  delete: (id: string) =>
    apiClient.delete(`/conocimiento/${id}`),

  // Adjuntos
  uploadAdjunto: (articuloId: string, archivo: File) => {
    const form = new FormData();
    form.append('archivo', archivo);
    return apiClient.post<AdjuntoArticulo>(`/conocimiento/${articuloId}/adjuntos`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data);
  },

  getAdjuntoUrl: (articuloId: string, adjuntoId: string) =>
    `/api/conocimiento/${articuloId}/adjuntos/${adjuntoId}`,

  deleteAdjunto: (articuloId: string, adjuntoId: string) =>
    apiClient.delete(`/conocimiento/${articuloId}/adjuntos/${adjuntoId}`),
};
