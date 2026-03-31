import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, Link, CheckCircle, Bug, Clock, X,
  ChevronDown, ChevronUp, ShieldAlert,
} from 'lucide-react';
import { problemasApi } from '../api/problemas';
import { useAuthStore } from '../store/authStore';

const ROLES_STAFF = ['Administrador', 'Supervisor', 'Agente'];
const ROLES_SUP_ADMIN = ['Administrador', 'Supervisor'];

export default function ProblemaDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { usuario } = useAuthStore();

  const esStaff = ROLES_STAFF.includes(usuario?.rol ?? '');
  const esSupervisorAdmin = ROLES_SUP_ADMIN.includes(usuario?.rol ?? '');

  const [showResolver, setShowResolver] = useState(false);
  const [showVincular, setShowVincular] = useState(false);
  const [showUpdatePanel, setShowUpdatePanel] = useState(false);
  const [ticketIdVincular, setTicketIdVincular] = useState('');
  const [resolverForm, setResolverForm] = useState({
    solucion: '',
    causaRaiz: '',
    actualizarIncidentesVinculados: true,
  });
  const [updateForm, setUpdateForm] = useState({ causaRaiz: '', workaround: '' });

  const { data: problema, isLoading } = useQuery({
    queryKey: ['problema', id],
    queryFn: () => problemasApi.getById(id!),
    enabled: !!id,
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['problema', id] });
    qc.invalidateQueries({ queryKey: ['problemas'] });
  };

  const resolverMutation = useMutation({
    mutationFn: () => problemasApi.resolver(id!, resolverForm),
    onSuccess: () => { invalidate(); setShowResolver(false); },
  });

  const errorConocidoMutation = useMutation({
    mutationFn: () => problemasApi.marcarErrorConocido(id!),
    onSuccess: invalidate,
  });

  const vincularMutation = useMutation({
    mutationFn: () => problemasApi.vincularIncidente(id!, ticketIdVincular),
    onSuccess: () => { invalidate(); setTicketIdVincular(''); setShowVincular(false); },
  });

  const desvincularMutation = useMutation({
    mutationFn: (ticketId: string) => problemasApi.desvincularIncidente(id!, ticketId),
    onSuccess: invalidate,
  });

  const cerrarMutation = useMutation({
    mutationFn: () => problemasApi.cerrar(id!),
    onSuccess: invalidate,
  });

  const updateMutation = useMutation({
    mutationFn: () => problemasApi.update(id!, {
      causaRaiz: updateForm.causaRaiz || undefined,
      workaround: updateForm.workaround || undefined,
    }),
    onSuccess: () => { invalidate(); setShowUpdatePanel(false); },
  });

  if (isLoading) return <div className="p-6 text-center text-gray-400">Cargando...</div>;
  if (!problema) return <div className="p-6 text-center text-red-500">Problema no encontrado</div>;

  const esFinal = problema.estadoEsFinal;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-5">
      {/* Back */}
      <button
        onClick={() => navigate('/problemas')}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft size={14} /> Volver a problemas
      </button>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            <span className="font-mono text-sm text-gray-400">{problema.numero}</span>
            <span
              className="text-xs font-semibold px-2.5 py-1 rounded-full text-white"
              style={{ backgroundColor: problema.estadoColor }}
            >
              {problema.estadoNombre}
            </span>
            {problema.esErrorConocido && (
              <span className="bg-yellow-100 text-yellow-700 text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1">
                <Bug size={12} /> Error Conocido
              </span>
            )}
            <span
              className="text-xs font-medium px-2 py-0.5 rounded-full text-white"
              style={{ backgroundColor: problema.prioridadColor }}
            >
              {problema.prioridadNombre}
            </span>
          </div>
          <h1 className="text-xl font-bold text-gray-900">{problema.titulo}</h1>
        </div>

        {esStaff && !esFinal && (
          <div className="flex gap-2 flex-wrap shrink-0">
            {!problema.esErrorConocido && (
              <button
                onClick={() => errorConocidoMutation.mutate()}
                disabled={errorConocidoMutation.isPending}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-lg hover:bg-yellow-100 transition-colors"
              >
                <Bug size={14} /> Error Conocido
              </button>
            )}
            <button
              onClick={() => setShowVincular(!showVincular)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <Link size={14} /> Vincular Incidente
            </button>
            <button
              onClick={() => setShowResolver(!showResolver)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <CheckCircle size={14} /> Resolver
            </button>
            {esSupervisorAdmin && (
              <button
                onClick={() => { if (window.confirm('¿Cerrar este problema definitivamente?')) cerrarMutation.mutate(); }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <X size={14} /> Cerrar
              </button>
            )}
          </div>
        )}
      </div>

      {/* Vincular panel */}
      {showVincular && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-blue-800 mb-3">Vincular incidente al problema</h3>
          <div className="flex gap-3">
            <input
              value={ticketIdVincular}
              onChange={e => setTicketIdVincular(e.target.value)}
              placeholder="UUID del ticket..."
              className="flex-1 px-3 py-2 border border-blue-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={() => vincularMutation.mutate()}
              disabled={!ticketIdVincular.trim() || vincularMutation.isPending}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {vincularMutation.isPending ? 'Vinculando...' : 'Vincular'}
            </button>
            <button onClick={() => setShowVincular(false)} className="p-2 text-gray-500 hover:text-gray-700">
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Resolver panel */}
      {showResolver && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 space-y-3">
          <h3 className="text-sm font-semibold text-green-800">Resolver problema</h3>
          <div>
            <label className="block text-xs font-medium text-green-700 mb-1">Causa raíz identificada</label>
            <textarea
              value={resolverForm.causaRaiz}
              onChange={e => setResolverForm(f => ({ ...f, causaRaiz: e.target.value }))}
              className="w-full px-3 py-2 border border-green-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-green-500"
              rows={2}
              placeholder="¿Cuál fue la causa raíz del problema?"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-green-700 mb-1">Solución aplicada *</label>
            <textarea
              value={resolverForm.solucion}
              onChange={e => setResolverForm(f => ({ ...f, solucion: e.target.value }))}
              className="w-full px-3 py-2 border border-green-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-green-500"
              rows={3}
              placeholder="Describí la solución implementada..."
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-green-800 cursor-pointer">
            <input
              type="checkbox"
              checked={resolverForm.actualizarIncidentesVinculados}
              onChange={e => setResolverForm(f => ({ ...f, actualizarIncidentesVinculados: e.target.checked }))}
              className="rounded border-green-300 text-green-600"
            />
            Notificar a los creadores de los {problema.incidentes.length} incidentes vinculados
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => resolverMutation.mutate()}
              disabled={!resolverForm.solucion.trim() || resolverMutation.isPending}
              className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              {resolverMutation.isPending ? 'Guardando...' : 'Confirmar resolución'}
            </button>
            <button onClick={() => setShowResolver(false)} className="px-3 py-2 text-gray-500 text-sm hover:text-gray-700">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Content grid */}
      <div className="grid grid-cols-3 gap-6">
        {/* Main */}
        <div className="col-span-2 space-y-5">

          {/* Description */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Descripción</h2>
            <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">{problema.descripcion}</p>
          </div>

          {/* Workaround (highlight) */}
          {problema.workaround && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-5">
              <h2 className="text-sm font-semibold text-yellow-800 mb-2 flex items-center gap-2">
                <ShieldAlert size={14} /> Workaround disponible
              </h2>
              <p className="text-sm text-yellow-900 whitespace-pre-wrap">{problema.workaround}</p>
            </div>
          )}

          {/* Root cause + Solution */}
          {(problema.causaRaiz || problema.solucion) && (
            <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
              {problema.causaRaiz && (
                <div>
                  <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Causa Raíz</div>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{problema.causaRaiz}</p>
                </div>
              )}
              {problema.solucion && (
                <div>
                  <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Solución</div>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{problema.solucion}</p>
                </div>
              )}
            </div>
          )}

          {/* Update workaround / causa raiz */}
          {esStaff && !esFinal && (
            <div>
              <button
                onClick={() => setShowUpdatePanel(!showUpdatePanel)}
                className="flex items-center gap-1 text-sm text-orange-600 hover:text-orange-700 font-medium"
              >
                {showUpdatePanel ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                {showUpdatePanel ? 'Ocultar' : 'Actualizar workaround / causa raíz'}
              </button>
              {showUpdatePanel && (
                <div className="mt-3 bg-orange-50 border border-orange-200 rounded-xl p-4 space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-orange-700 mb-1">Workaround</label>
                    <textarea
                      value={updateForm.workaround}
                      onChange={e => setUpdateForm(f => ({ ...f, workaround: e.target.value }))}
                      placeholder={problema.workaround ?? 'Describí un workaround temporal...'}
                      className="w-full px-3 py-2 border border-orange-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-400"
                      rows={2}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-orange-700 mb-1">Causa raíz</label>
                    <textarea
                      value={updateForm.causaRaiz}
                      onChange={e => setUpdateForm(f => ({ ...f, causaRaiz: e.target.value }))}
                      placeholder={problema.causaRaiz ?? 'Describí la causa raíz identificada...'}
                      className="w-full px-3 py-2 border border-orange-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-400"
                      rows={2}
                    />
                  </div>
                  <button
                    onClick={() => updateMutation.mutate()}
                    disabled={updateMutation.isPending}
                    className="px-4 py-2 bg-orange-600 text-white rounded-lg text-sm hover:bg-orange-700 disabled:opacity-50 transition-colors"
                  >
                    {updateMutation.isPending ? 'Guardando...' : 'Guardar cambios'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Linked incidents */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <Link size={14} />
              Incidentes vinculados ({problema.incidentes.length})
            </h2>
            {problema.incidentes.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">No hay incidentes vinculados</p>
            ) : (
              <div className="space-y-2">
                {problema.incidentes.map(i => (
                  <div key={i.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <span className="text-xs font-mono text-gray-400 w-28 shrink-0">{i.ticketNumero}</span>
                    <span className="flex-1 text-sm text-gray-700 truncate">{i.ticketAsunto}</span>
                    <span
                      className="text-xs px-2 py-0.5 rounded-full text-white font-medium shrink-0"
                      style={{ backgroundColor: i.ticketEstadoColor }}
                    >
                      {i.ticketEstado}
                    </span>
                    {esStaff && (
                      <button
                        onClick={() => desvincularMutation.mutate(i.ticketId)}
                        className="text-gray-400 hover:text-red-500 transition-colors shrink-0"
                        title="Desvincular"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* History */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <Clock size={14} /> Historial
            </h2>
            <div className="space-y-4">
              {problema.historial.map(h => (
                <div key={h.id} className="flex gap-3 text-sm">
                  <div className="mt-1.5 w-2 h-2 bg-orange-300 rounded-full shrink-0" />
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
              ['Responsable', problema.responsableNombre ?? 'Sin asignar'],
              ['Creado por', problema.creadorNombre],
              ['Categoría', problema.categoriaNombre ?? '—'],
              ['Fecha creación', new Date(problema.fechaCreacion).toLocaleDateString('es-AR')],
              ...(problema.fechaResolucion ? [['Resolución', new Date(problema.fechaResolucion).toLocaleDateString('es-AR')]] : []),
              ...(problema.fechaCierre ? [['Cierre', new Date(problema.fechaCierre).toLocaleDateString('es-AR')]] : []),
            ] as [string, string][]).map(([label, value]) => (
              <div key={label}>
                <div className="text-xs text-gray-400">{label}</div>
                <div className="text-sm text-gray-800 font-medium mt-0.5">{value}</div>
              </div>
            ))}
          </div>

          {/* Quick stats */}
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Impacto</h3>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600">{problema.incidentes.length}</div>
              <div className="text-xs text-gray-500 mt-1">incidente{problema.incidentes.length !== 1 ? 's' : ''} afectado{problema.incidentes.length !== 1 ? 's' : ''}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
