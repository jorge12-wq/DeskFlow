import apiClient from './client';

export interface WorkflowNodoDto {
  id: string;
  tipoNodo: string;
  nombre: string;
  posicionX: number;
  posicionY: number;
  configJson?: string;
}

export interface WorkflowConexionDto {
  id: string;
  nodoOrigenId: string;
  nodoDestinoId: string;
  etiqueta?: string;
  orden: number;
  origenLado?: 'right' | 'left' | 'top' | 'bottom';
  destinoLado?: 'right' | 'left' | 'top' | 'bottom';
  midOffsetX?: number;
  midOffsetY?: number;
}

export interface WorkflowListItem {
  id: string;
  nombre: string;
  descripcion?: string;
  tipo: string;
  servicioNombre?: string;
  activo: boolean;
  cantidadNodos: number;
  fechaCreacion: string;
  creadoPorNombre?: string;
}

export interface WorkflowDetalle {
  id: string;
  nombre: string;
  descripcion?: string;
  tipo: string;
  servicioId?: string;
  servicioNombre?: string;
  activo: boolean;
  fechaCreacion: string;
  fechaActualizacion?: string;
  creadoPorNombre?: string;
  nodos: WorkflowNodoDto[];
  conexiones: WorkflowConexionDto[];
}

export const workflowsApi = {
  getAll: () =>
    apiClient.get<WorkflowListItem[]>('/workflows').then(r => r.data),

  getById: (id: string) =>
    apiClient.get<WorkflowDetalle>(`/workflows/${id}`).then(r => r.data),

  create: (dto: { nombre: string; descripcion?: string; tipo: string; servicioId?: string }) =>
    apiClient.post<WorkflowDetalle>('/workflows', dto).then(r => r.data),

  save: (id: string, dto: {
    nombre: string;
    descripcion?: string;
    tipo: string;
    servicioId?: string;
    activo: boolean;
    nodos: WorkflowNodoDto[];
    conexiones: WorkflowConexionDto[];
  }) => apiClient.put<WorkflowDetalle>(`/workflows/${id}`, dto).then(r => r.data),

  delete: (id: string) =>
    apiClient.delete(`/workflows/${id}`).then(r => r.data),
};
