// Auth
export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiry: string;
  usuario: UsuarioInfo;
}

export interface UsuarioInfo {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  rol: string;
  tenantId: string;
}

// Tickets
export interface Ticket {
  id: string;
  numero: string;
  asunto: string;
  descripcion: string;
  categoria: string;
  categoriaId: string;
  subcategoria?: string;
  subcategoriaId?: string;
  prioridad: string;
  prioridadColor: string;
  prioridadId: string;
  estado: string;
  estadoColor: string;
  estadoId: string;
  usuarioCreador: UsuarioResumen;
  tecnicoAsignado?: UsuarioResumen;
  supervisor?: UsuarioResumen;
  sucursal?: string;
  area?: string;
  areaId?: string;
  helpDesk?: string;
  helpDeskId?: string;
  fechaCreacion: string;
  fechaAsignacion?: string;
  fechaResolucion?: string;
  fechaCierre?: string;
  fechaLimiteSLA?: string;
  fechaEscalacion?: string;
  slaVencido: boolean;
  estaEnEspera: boolean;
  motivoEsperaId?: string;
  motivoEspera?: string;
  motivoEsperaIcono?: string;
  fechaEnEspera?: string;
  comentarios: Comentario[];
  historial: Historial[];
}

export interface TicketListItem {
  id: string;
  numero: string;
  asunto: string;
  categoria: string;
  subcategoria?: string;
  prioridad: string;
  prioridadColor: string;
  estado: string;
  estadoColor: string;
  usuarioCreadorId: string;
  usuarioCreador: string;
  tecnicoAsignadoId?: string;
  tecnicoAsignado?: string;
  fechaCreacion: string;
  fechaAsignacion?: string;
  fechaResolucion?: string;
  fechaCierre?: string;
  fechaLimiteSLA?: string;
  slaVencido: boolean;
  sLAEstado?: 'EnTiempo' | 'EnRiesgo' | 'Vencido';
}

export interface MiTrabajoStats {
  totalActivos: number;
  esperandoPorMi: number;
  asignadosAMi: number;
  sinAsignar: number;
  aprobacionesPendientes: number;
  vencimientosProximos: number;
  ticketsRecientes: TicketListItem[];
}

export interface UsuarioResumen {
  id: string;
  nombreCompleto: string;
  email: string;
}

export interface Comentario {
  id: string;
  usuario: UsuarioResumen;
  contenido: string;
  esInterno: boolean;
  fechaCreacion: string;
}

export interface Historial {
  id: string;
  usuario: UsuarioResumen;
  estadoAnterior?: string;
  estadoNuevo?: string;
  descripcion: string;
  fechaCreacion: string;
}

export interface CreateTicketRequest {
  asunto: string;
  descripcion: string;
  categoriaId: string;
  subcategoriaId?: string;
  prioridadId: string;
  sucursalId?: string;
  areaId?: string;
  helpDeskId?: string;
}

export interface PagedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface TicketFilter {
  page?: number;
  pageSize?: number;
  estadoId?: string;
  prioridadId?: string;
  tecnicoId?: string;
  categoriaId?: string;
  busqueda?: string;
  soloSinAsignar?: boolean;
  soloFinales?: boolean;
  helpDeskId?: string;
  areaId?: string;
  fechaDesde?: string;
  fechaHasta?: string;
  usuarioCreadorId?: string;
  ordenarPor?: string;
  direccion?: string;
}

// Dashboard
export interface Dashboard {
  totalTickets: number;
  ticketsAbiertos: number;
  ticketsEnProceso: number;
  ticketsResueltos: number;
  ticketsCerrados: number;
  ticketsVencidosSLA: number;
  porEstado: ContadorEstado[];
  porPrioridad: ContadorPrioridad[];
  ultimosTickets: TicketReciente[];
}

export interface ContadorEstado {
  estado: string;
  color: string;
  cantidad: number;
}

export interface ContadorPrioridad {
  prioridad: string;
  color: string;
  cantidad: number;
}

export interface TicketReciente {
  id: string;
  numero: string;
  asunto: string;
  estado: string;
  estadoColor: string;
  prioridad: string;
  prioridadColor: string;
  fechaCreacion: string;
}

// Catalogos
export interface Estado {
  id: string;
  nombre: string;
  color: string;
  esFinal: boolean;
}

export interface Prioridad {
  id: string;
  nombre: string;
  color: string;
  tiempoRespuestaSLA_Horas: number;
  tiempoResolucionSLA_Horas: number;
}

export interface Categoria {
  id: string;
  nombre: string;
  descripcion?: string;
  icono?: string;
  subcategorias: Subcategoria[];
}

export interface Subcategoria {
  id: string;
  nombre: string;
  descripcion?: string;
}

export interface Sucursal {
  id: string;
  nombre: string;
  direccion?: string;
}

export interface Area {
  id: string;
  nombre: string;
  descripcion?: string;
  helpDeskId?: string;
}

export interface Tecnico {
  id: string;
  nombreCompleto: string;
  email: string;
}

// Notificaciones
export interface Notificacion {
  id: string;
  titulo: string;
  mensaje: string;
  tipo: string;
  leida: boolean;
  ticketId?: string;
  fechaCreacion: string;
}

// Base de Conocimiento
export interface ArticuloListItem {
  id: string;
  titulo: string;
  categoria: string;
  subcategoria?: string;
  etiquetas: string[];
  autor: string;
  vistas: number;
  fechaCreacion: string;
  fechaActualizacion: string;
}

export interface AdjuntoArticulo {
  id: string;
  nombreOriginal: string;
  contentType: string;
  tamanoBytes: number;
  fechaCreacion: string;
}

export interface Articulo extends ArticuloListItem {
  contenido: string;
  categoriaId: string;
  subcategoriaId?: string;
  autorId: string;
  esPublico: boolean;
  adjuntos: AdjuntoArticulo[];
}

export interface CreateArticuloRequest {
  titulo: string;
  contenido: string;
  categoriaId: string;
  subcategoriaId?: string;
  etiquetas: string[];
  esPublico: boolean;
}

// Encuestas
export interface EncuestaPendiente {
  id: string;
  ticketId: string;
  ticketNumero: string;
  ticketAsunto: string;
  tecnico?: string;
  fechaCierre: string;
  pregunta: string;
  escalaMinima: number;
  escalaMaxima: number;
}

// Etiquetas
export interface Etiqueta {
  id: string;
  nombre: string;
  color: string;
  activo: boolean;
}

// Usuarios (admin)
export interface Usuario {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  rol: string;
  rolId: string;
  activo: boolean;
  fechaCreacion: string;
  sucursal?: string;
  sucursalId?: string;
  area?: string;
  areaId?: string;
}

export interface Rol {
  id: string;
  nombre: string;
  descripcion?: string;
}

// Auditoría
export interface AuditLog {
  id: string;
  usuario: string;
  accion: string;
  entidad: string;
  entidadId?: string;
  datosAnteriores?: string;
  datosNuevos?: string;
  ip?: string;
  fechaCreacion: string;
}

// SLA Config
export interface SLAConfiguracion {
  id: string;
  prioridadId: string;
  prioridad: string;
  categoriaId?: string;
  categoria?: string;
  tiempoRespuestaHoras: number;
  tiempoResolucionHoras: number;
  activo: boolean;
}

// Catálogo de Servicios
export interface Departamento {
  id: string;
  nombre: string;
  descripcion?: string;
  icono?: string;
  color?: string;
  cantidadServicios: number;
}

export interface ServicioListItem {
  id: string;
  departamentoId: string;
  departamento: string;
  departamentoColor?: string;
  nombre: string;
  descripcion?: string;
  icono?: string;
  color?: string;
  tiempoEntregaHoras?: number;
  requiereAprobacion: boolean;
  esPublico: boolean;
}

export interface CampoServicio {
  id: string;
  nombre: string;
  etiqueta: string;
  tipoCampo: string;
  placeholder?: string;
  requerido: boolean;
  orden: number;
  opciones: string[];
}

export interface PlantillaTarea {
  id: string;
  titulo: string;
  descripcion?: string;
  orden: number;
  asignarARol?: string;
}

export interface ServicioDetalle extends ServicioListItem {
  campos: CampoServicio[];
  plantillas: PlantillaTarea[];
}

export interface RespuestaFormulario {
  campoId: string;
  etiqueta: string;
  tipoCampo: string;
  valor?: string;
}

export interface TareaTicket {
  id: string;
  titulo: string;
  descripcion?: string;
  asignadoA?: string;
  asignadoAId?: string;
  completada: boolean;
  fechaCompletada?: string;
  fechaVencimiento?: string;
  fechaCreacion: string;
}

// ── Change Management ────────────────────────────────────────
export interface TipoCambio {
  id: string;
  nombre: string;
  descripcion?: string;
  color: string;
}

export interface EstadoCambio {
  id: string;
  nombre: string;
  color: string;
  orden: number;
  esFinal: boolean;
}

export interface AprobadorCAB {
  id: string;
  aprobadorId: string;
  aprobadorNombre: string;
  estado: 0 | 1 | 2;
  estadoNombre: string;
  comentario?: string;
  fechaDecision?: string;
}

export interface HistorialCambioItem {
  id: string;
  accion: string;
  detalle?: string;
  usuarioNombre?: string;
  fechaAccion: string;
}

export interface CambioListItem {
  id: string;
  numero: string;
  titulo: string;
  tipoNombre: string;
  tipoColor: string;
  estadoNombre: string;
  estadoColor: string;
  estadoEsFinal: boolean;
  prioridadNombre: string;
  prioridadColor: string;
  riesgo: string;
  impacto: string;
  solicitanteNombre: string;
  implementadorNombre?: string;
  aprobadoresPendientes: number;
  fechaCreacion: string;
  fechaInicioPlaneado?: string;
  fechaFinPlaneado?: string;
}

export interface CambioDetalle {
  id: string;
  numero: string;
  titulo: string;
  descripcion: string;
  tipoCambioId: string;
  tipoNombre: string;
  tipoColor: string;
  estadoId: string;
  estadoNombre: string;
  estadoColor: string;
  estadoEsFinal: boolean;
  prioridadId: string;
  prioridadNombre: string;
  prioridadColor: string;
  categoriaId?: string;
  categoriaNombre?: string;
  solicitanteId: string;
  solicitanteNombre: string;
  implementadorId?: string;
  implementadorNombre?: string;
  riesgo: string;
  impacto: string;
  urgencia: string;
  descripcionImpacto?: string;
  planImplementacion?: string;
  planPruebas?: string;
  planBackout?: string;
  resultadoPostImpl?: string;
  fechaCreacion: string;
  fechaInicioPlaneado?: string;
  fechaFinPlaneado?: string;
  fechaInicioReal?: string;
  fechaFinReal?: string;
  fechaCierre?: string;
  aprobadoresCAB: AprobadorCAB[];
  historial: HistorialCambioItem[];
}

export interface CambioCalendarioItem {
  id: string;
  numero: string;
  titulo: string;
  tipoNombre: string;
  tipoColor: string;
  estadoNombre: string;
  estadoColor: string;
  riesgo: string;
  implementadorNombre?: string;
  fechaInicioPlaneado?: string;
  fechaFinPlaneado?: string;
}

// ── Problem Management ──────────────────────────────────────
export interface EstadoProblema {
  id: string;
  nombre: string;
  color: string;
  orden: number;
  esFinal: boolean;
}

export interface ProblemaListItem {
  id: string;
  numero: string;
  titulo: string;
  estadoNombre: string;
  estadoColor: string;
  prioridadNombre: string;
  prioridadColor: string;
  categoriaNombre?: string;
  responsableNombre?: string;
  creadorNombre: string;
  esErrorConocido: boolean;
  incidentesCount: number;
  fechaCreacion: string;
  fechaResolucion?: string;
}

export interface IncidenteVinculado {
  id: string;
  ticketId: string;
  ticketNumero: string;
  ticketAsunto: string;
  ticketEstado: string;
  ticketEstadoColor: string;
  vinculadoPorNombre?: string;
  fechaVinculacion: string;
}

export interface HistorialProblemaItem {
  id: string;
  accion: string;
  detalle?: string;
  usuarioNombre?: string;
  fechaAccion: string;
}

export interface ProblemaDetalle {
  id: string;
  numero: string;
  titulo: string;
  descripcion: string;
  estadoId: string;
  estadoNombre: string;
  estadoColor: string;
  estadoEsFinal: boolean;
  prioridadId: string;
  prioridadNombre: string;
  prioridadColor: string;
  categoriaId?: string;
  categoriaNombre?: string;
  responsableId?: string;
  responsableNombre?: string;
  usuarioCreadorId: string;
  creadorNombre: string;
  causaRaiz?: string;
  workaround?: string;
  solucion?: string;
  esErrorConocido: boolean;
  fechaCreacion: string;
  fechaIdentificacion?: string;
  fechaResolucion?: string;
  fechaCierre?: string;
  incidentes: IncidenteVinculado[];
  historial: HistorialProblemaItem[];
}
