import apiClient from './client';
import type { EncuestaPendiente } from '../types';

export const encuestasApi = {
  getPendientes: () =>
    apiClient.get<EncuestaPendiente[]>('/encuestas/pendientes').then(r => r.data),

  responder: (data: { encuestaId: string; puntuacion: number; comentario?: string }) =>
    apiClient.post('/encuestas/responder', data).then(r => r.data),

  getPromedio: () =>
    apiClient.get<{ promedio: number }>('/encuestas/promedio').then(r => r.data),

  getPorTecnico: () =>
    apiClient.get<Array<{ tecnicoId: string; tecnico: string; promedio: number; totalEncuestas: number }>>('/encuestas/por-tecnico').then(r => r.data),

  getPorMes: () =>
    apiClient.get<Array<{ anio: number; mes: number; promedio: number; totalEncuestas: number }>>('/encuestas/por-mes').then(r => r.data),
};
