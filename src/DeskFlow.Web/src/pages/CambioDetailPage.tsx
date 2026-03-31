import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, Clock, CheckCircle, X, Play,
  ThumbsUp, ThumbsDown, ChevronDown, ChevronUp, AlertCircle,
} from 'lucide-react';
import { cambiosApi } from '../api/cambios';
import { useAuthStore } from '../store/authStore';

const RIESGO_COLOR: Record<string, string> = {
  'Bajo': 'bg-green-100 text-green-700',
  'Medio': 'bg-yellow-100 text-yellow-700',
  'Alto': 'bg-orange-100 text-orange-700',
  'Crítico': 'bg-red-100 text-red-700',
};

export default function CambioDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { usuario } = useAuthStore();

  const esStaff = ['Administrador', 'Supervisor', 'Agente'].includes(usuario?.rol ?? '');
  const puedeVotarCAB = ['Administrador', 'Supervisor', 'Aprobador'].includes(usuario?.rol ?? '');
  const esSupervisorAdmin = ['Administrador', 'Supervisor'].includes(usuario?.rol ?? '');

  const [showEnviarCAB, setShowEnviarCAB] = useState(false);
  const [showVotar, setShowVotar] = useState<'aprobar' | 'rechazar' | null>(null);
  const [showIniciar, setShowIniciar] = useState(false);
  const [showCompletar, setShowCompletar] = useState(false);
  const [votarComentario, setVotarComentario] = useState('');
  const [iniciarComentario, setIniciarComentario] = useState('');
  const [resultadoPostImpl, setResultadoPostImpl] = useState('');
  const [showPlanes, setShowPlanes] = useState(false);

  const { data: cambio, isLoading } = useQuery({
    queryKey: ['cambio', id],
    queryFn: () => cambiosApi.getById(id!),
    enabled: !!id,
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['cambio', id] });
    qc.invalidateQueries({ queryKey: ['cambios'] });
  };

  const enviarCABMutation = useMutation({
    mutationFn: () => cambiosApi.enviarCAB(id!),
    onSuccess: () => { invalidate(); setShowEnviarCAB(false); },
  });

  const votarMutation = useMutation({
    mutationFn: (aprobado: boolean) => cambiosApi.votarCAB(id!, aprobado, votarComentario || undefined),
    onSuccess: () => { invalidate(); setShowVotar(null); setVotarComentario(''); },
  });

  const iniciarMutation = useMutation({
    mutationFn: () => cambiosApi.iniciarImplementacion(id!, iniciarComentario || undefined),
    onSuccess: () => { invalidate(); setShowIniciar(false); },
  });

  const completarMutation = useMutation({
    mutationFn: () => cambiosApi.completarImplementacion(id!, resultadoPostImpl),
    onSuccess: () => { invalidate(); setShowCompletar(false); },
  });

  const cerrarMutation = useMutation({
    mutationFn: () => cambiosApi.cerrar(id!),
    onSuccess: invalidate,
  });

  const rechazarMutation = useMutation({
    mutationFn: (motivo?: string) => cambiosApi.rechazar(id!, motivo),
    onSuccess: invalidate,
  });

  if (isLoading) return <div className="p-6 text-center text-gray-400">Cargando...</div>;
  if (!cambio) return <div className="p-6 text-center text-red-500">RFC no encontrado</div>;

  const miVoto = cambio.aprobadoresCAB.find(a => a.aprobadorId === usuario?.id);
  const puedeVotarEsteCAB = puedeVotarCAB && miVoto && miVoto.estado === 0;
  const esFinal = cambio.estadoEsFinal;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-5">
      <button onClick={() => navigate('/cambios')}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft size={14} /> Volver a cambios
      </button>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            <span className="font-mono text-sm text-gray-400">{cambio.numero}</span>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full text-white"
              style={{ backgroundColor: cambio.tipoColor }}>{cambio.tipoNombre}</span>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full text-white"
              style={{ backgroundColor: cambio.estadoColor }}>{cambio.estadoNombre}</span>
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${RIESGO_COLOR[cambio.riesgo] ?? 'bg-gray-100 text-gray-600'}`}>
              Riesgo {cambio.riesgo}
            </span>
          </div>
          <h1 className="text-xl font-bold text-gray-900">{cambio.titulo}</h1>
        </div>

        {/* Actions */}
        {!esFinal && (
          <div className="flex gap-2 flex-wrap shrink-0">
            {cambio.estadoNombre === 'Borrador' && esStaff && (
              <button onClick={() => setShowEnviarCAB(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                <AlertCircle size={14} /> Enviar a CAB
              </button>
            )}
            {cambio.estadoNombre === 'Aprobado por CAB' && esStaff && (
              <button onClick={() => setShowIniciar(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                <Play size={14} /> Iniciar Implementación
              </button>
            )}
            {cambio.estadoNombre === 'En Implementación' && esStaff && (
              <button onClick={() => setShowCompletar(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                <CheckCircle size={14} /> Completar
              </button>
            )}
            {cambio.estadoNombre === 'Revisión Post-Impl.' && esSupervisorAdmin && (
              <button onClick={() => { if (window.confirm('¿Cerrar este cambio?')) cerrarMutation.mutate(); }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
                <X size={14} /> Cerrar
              </button>
            )}
            {esSupervisorAdmin && !['Cerrado', 'Rechazado'].includes(cambio.estadoNombre) && (
              <button onClick={() => { const m = window.prompt('Motivo de rechazo (opcional):'); if (m !== null) rechazarMutation.mutate(m || undefined); }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors">
                <X size={14} /> Rechazar
              </button>
            )}
          </div>
        )}
      </div>

      {/* CAB vote panel */}
      {puedeVotarEsteCAB && cambio.estadoNombre === 'Enviado a CAB' && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-sm font-semibold text-blue-800 mb-3 flex items-center gap-2">
            <AlertCircle size={14} /> Tu voto como miembro del CAB está pendiente
          </p>
          {showVotar && (
            <div className="mb-3">
              <textarea value={votarComentario} onChange={e => setVotarComentario(e.target.value)}
                placeholder="Comentario (opcional)..."
                className="w-full px-3 py-2 border border-blue-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-400"
                rows={2} />
            </div>
          )}
          <div className="flex gap-2">
            <button onClick={() => showVotar === 'aprobar' ? votarMutation.mutate(true) : setShowVotar('aprobar')}
              disabled={votarMutation.isPending}
              className="flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 disabled:opacity-50 transition-colors">
              <ThumbsUp size={14} /> {showVotar === 'aprobar' ? 'Confirmar Aprobación' : 'Aprobar'}
            </button>
            <button onClick={() => showVotar === 'rechazar' ? votarMutation.mutate(false) : setShowVotar('rechazar')}
              disabled={votarMutation.isPending}
              className="flex items-center gap-1.5 px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 disabled:opacity-50 transition-colors">
              <ThumbsDown size={14} /> {showVotar === 'rechazar' ? 'Confirmar Rechazo' : 'Rechazar'}
            </button>
            {showVotar && (
              <button onClick={() => setShowVotar(null)} className="px-3 py-2 text-gray-500 text-sm hover:text-gray-700">
                Cancelar
              </button>
            )}
          </div>
        </div>
      )}

      {/* Enviar CAB confirm */}
      {showEnviarCAB && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-sm text-blue-800 mb-3">Se notificará a todos los Supervisores y Administradores como miembros del CAB.</p>
          <div className="flex gap-2">
            <button onClick={() => enviarCABMutation.mutate()} disabled={enviarCABMutation.isPending}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors">
              {enviarCABMutation.isPending ? 'Enviando...' : 'Confirmar'}
            </button>
            <button onClick={() => setShowEnviarCAB(false)} className="px-3 py-2 text-gray-500 text-sm hover:text-gray-700">Cancelar</button>
          </div>
        </div>
      )}

      {/* Iniciar implementación */}
      {showIniciar && (
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 space-y-3">
          <h3 className="text-sm font-semibold text-purple-800">Iniciar Implementación</h3>
          <textarea value={iniciarComentario} onChange={e => setIniciarComentario(e.target.value)}
            placeholder="Comentario inicial (opcional)..."
            className="w-full px-3 py-2 border border-purple-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-400" rows={2} />
          <div className="flex gap-2">
            <button onClick={() => iniciarMutation.mutate()} disabled={iniciarMutation.isPending}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 disabled:opacity-50 transition-colors">
              {iniciarMutation.isPending ? 'Iniciando...' : 'Confirmar inicio'}
            </button>
            <button onClick={() => setShowIniciar(false)} className="px-3 py-2 text-gray-500 text-sm hover:text-gray-700">Cancelar</button>
          </div>
        </div>
      )}

      {/* Completar implementación */}
      {showCompletar && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 space-y-3">
          <h3 className="text-sm font-semibold text-green-800">Completar implementación — Revisión post-impl.</h3>
          <textarea value={resultadoPostImpl} onChange={e => setResultadoPostImpl(e.target.value)}
            placeholder="Describí el resultado: ¿qué se implementó, cómo quedó, hay issues residuales?..."
            className="w-full px-3 py-2 border border-green-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-green-400" rows={3} />
          <div className="flex gap-2">
            <button onClick={() => completarMutation.mutate()}
              disabled={!resultadoPostImpl.trim() || completarMutation.isPending}
              className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 disabled:opacity-50 transition-colors">
              {completarMutation.isPending ? 'Guardando...' : 'Confirmar'}
            </button>
            <button onClick={() => setShowCompletar(false)} className="px-3 py-2 text-gray-500 text-sm hover:text-gray-700">Cancelar</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-6">
        {/* Main */}
        <div className="col-span-2 space-y-5">

          {/* Description */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Descripción</h2>
            <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">{cambio.descripcion}</p>
            {cambio.descripcionImpacto && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Descripción del impacto</div>
                <p className="text-sm text-gray-600 whitespace-pre-wrap">{cambio.descripcionImpacto}</p>
              </div>
            )}
          </div>

          {/* Planes */}
          {(cambio.planImplementacion || cambio.planPruebas || cambio.planBackout) && (
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <button onClick={() => setShowPlanes(!showPlanes)}
                className="flex items-center justify-between w-full">
                <h2 className="text-sm font-semibold text-gray-700">Planes técnicos</h2>
                {showPlanes ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
              </button>
              {showPlanes && (
                <div className="mt-4 space-y-4">
                  {cambio.planImplementacion && (
                    <div>
                      <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Plan de implementación</div>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 rounded-lg p-3">{cambio.planImplementacion}</p>
                    </div>
                  )}
                  {cambio.planPruebas && (
                    <div>
                      <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Plan de pruebas</div>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 rounded-lg p-3">{cambio.planPruebas}</p>
                    </div>
                  )}
                  {cambio.planBackout && (
                    <div>
                      <div className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-2">Plan de Backout (Rollback)</div>
                      <p className="text-sm text-red-700 whitespace-pre-wrap bg-red-50 rounded-lg p-3">{cambio.planBackout}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Post-impl result */}
          {cambio.resultadoPostImpl && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-5">
              <div className="text-xs font-semibold text-green-700 uppercase tracking-wider mb-2">Resultado Post-Implementación</div>
              <p className="text-sm text-green-800 whitespace-pre-wrap">{cambio.resultadoPostImpl}</p>
            </div>
          )}

          {/* CAB approvers */}
          {cambio.aprobadoresCAB.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <h2 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                <CheckCircle size={14} /> CAB — Aprobaciones ({cambio.aprobadoresCAB.filter(a => a.estado === 1).length}/{cambio.aprobadoresCAB.length})
              </h2>
              <div className="space-y-2">
                {cambio.aprobadoresCAB.map(a => (
                  <div key={a.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${
                      a.estado === 1 ? 'bg-green-500' : a.estado === 2 ? 'bg-red-500' : 'bg-gray-300'
                    }`} />
                    <span className="flex-1 text-sm text-gray-700">{a.aprobadorNombre}</span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      a.estado === 1 ? 'bg-green-100 text-green-700' :
                      a.estado === 2 ? 'bg-red-100 text-red-700' :
                      'bg-gray-100 text-gray-500'
                    }`}>{a.estadoNombre}</span>
                    {a.comentario && <span className="text-xs text-gray-400 truncate max-w-32">{a.comentario}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* History */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <Clock size={14} /> Historial
            </h2>
            <div className="space-y-4">
              {cambio.historial.map(h => (
                <div key={h.id} className="flex gap-3 text-sm">
                  <div className="mt-1.5 w-2 h-2 bg-purple-300 rounded-full shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-gray-800">{h.accion}</span>
                      <span className="text-xs text-gray-400 shrink-0">
                        {new Date(h.fechaAccion).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' })}
                      </span>
                    </div>
                    {h.detalle && <p className="text-xs text-gray-500 mt-0.5">{h.detalle}</p>}
                    {h.usuarioNombre && <p className="text-xs text-gray-400 mt-0.5">por {h.usuarioNombre}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-4">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Detalles</h3>
            {([
              ['Solicitante', cambio.solicitanteNombre],
              ['Implementador', cambio.implementadorNombre ?? 'Sin asignar'],
              ['Categoría', cambio.categoriaNombre ?? '—'],
              ['Urgencia', cambio.urgencia],
              ['Impacto', cambio.impacto],
              ['Creación', new Date(cambio.fechaCreacion).toLocaleDateString('es-AR')],
              ...(cambio.fechaInicioPlaneado ? [['Inicio planeado', new Date(cambio.fechaInicioPlaneado).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' })]] : []),
              ...(cambio.fechaFinPlaneado ? [['Fin planeado', new Date(cambio.fechaFinPlaneado).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' })]] : []),
              ...(cambio.fechaInicioReal ? [['Inicio real', new Date(cambio.fechaInicioReal).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' })]] : []),
              ...(cambio.fechaFinReal ? [['Fin real', new Date(cambio.fechaFinReal).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' })]] : []),
            ] as [string, string][]).map(([label, value]) => (
              <div key={label}>
                <div className="text-xs text-gray-400">{label}</div>
                <div className="text-sm text-gray-800 font-medium mt-0.5">{value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
