import apiClient from './client';
import type { Notificacion } from '../types';

export const notificacionesApi = {
  getAll: (soloNoLeidas = false) =>
    apiClient.get<Notificacion[]>(`/notificaciones?soloNoLeidas=${soloNoLeidas}`).then(r => r.data),

  marcarLeida: (id: string) =>
    apiClient.patch(`/notificaciones/${id}/leer`).then(r => r.data),

  marcarTodasLeidas: () =>
    apiClient.patch('/notificaciones/leer-todas').then(r => r.data),

  getNoLeidas: () =>
    apiClient.get<number>('/notificaciones/no-leidas/count').then(r => r.data),
};
