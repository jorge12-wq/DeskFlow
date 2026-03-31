import apiClient from './client';

export interface LogroResumen {
  icono: string;
  nombre: string;
}

export interface RankingItem {
  posicion: number;
  usuarioId: string;
  nombreCompleto: string;
  rol: string;
  ticketsResueltos: number;
  ticketsEnSLA: number;
  porcentajeSLA: number;
  promedioCsat: number | null;
  tiempoPromedioHoras: number;
  puntos: number;
  logros: LogroResumen[];
}

export interface LogroDto {
  id: string;
  clave: string;
  nombre: string;
  descripcion: string;
  icono: string;
  criterio: string;
  puntosRecompensa: number;
  obtenido: boolean;
  fechaObtenido: string | null;
}

export interface PerfilGamificacion {
  usuarioId: string;
  nombreCompleto: string;
  posicion: number;
  puntos: number;
  ticketsResueltos: number;
  porcentajeSLA: number;
  promedioCsat: number | null;
  logros: LogroDto[];
}

export interface WidgetConfig {
  id: string;
  tipo: string;
  titulo: string;
  visible: boolean;
  orden: number;
}

export interface ReporteCompartido {
  id: string;
  token: string;
  titulo: string;
  url: string;
  fechaCreacion: string;
  fechaExpiracion: string | null;
}

export interface CrearReporteDto {
  titulo: string;
  configJson: string;
  datosJson: string;
  diasExpiracion?: number;
}

export const gamificacionApi = {
  getRanking: (periodo: 'semana' | 'mes' | 'total' = 'mes') =>
    apiClient.get<RankingItem[]>('/gamificacion/ranking', { params: { periodo } }).then(r => r.data),

  getMiPerfil: () =>
    apiClient.get<PerfilGamificacion>('/gamificacion/mi-perfil').then(r => r.data),

  getMisLogros: () =>
    apiClient.get<LogroDto[]>('/gamificacion/mis-logros').then(r => r.data),

  checkBadges: (usuarioId: string) =>
    apiClient.post('/gamificacion/check-badges', null, { params: { usuarioId } }),

  getMisWidgets: () =>
    apiClient.get<WidgetConfig[]>('/gamificacion/mis-widgets').then(r => r.data),

  saveWidgets: (widgets: WidgetConfig[]) =>
    apiClient.put('/gamificacion/mis-widgets', widgets),

  getMisReportes: () =>
    apiClient.get<ReporteCompartido[]>('/gamificacion/reportes').then(r => r.data),

  crearReporte: (dto: CrearReporteDto) =>
    apiClient.post<ReporteCompartido>('/gamificacion/reportes', dto).then(r => r.data),

  eliminarReporte: (id: string) =>
    apiClient.delete(`/gamificacion/reportes/${id}`),
};
