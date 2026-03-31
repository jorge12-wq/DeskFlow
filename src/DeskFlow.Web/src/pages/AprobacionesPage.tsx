import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, XCircle, Clock, ChevronRight, AlertTriangle } from 'lucide-react';
import { aprobacionesApi, type Aprobacion } from '../api/aprobaciones';
import { formatDistanceToNow } from '../utils/date';
import { toast } from 'sonner';

const ESTADO_LABEL: Record<number, { label: string; color: string }> = {
  0: { label: 'Pendiente',  color: 'bg-amber-100 text-amber-700' },
  1: { label: 'Aprobado',   color: 'bg-green-100 text-green-700' },
  2: { label: 'Rechazado',  color: 'bg-red-100 text-red-700' },
};

export default function AprobacionesPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<'pendientes' | 'historial'>('pendientes');
  const [decidiendo, setDecidiendo] = useState<string | null>(null);
  const [comentario, setComentario] = useState('');

  const { data: pendientes, isLoading: loadPend } = useQuery({
    queryKey: ['aprobaciones-pendientes'],
    queryFn: aprobacionesApi.getPendientes,
    refetchInterval: 30000,
  });

  const { data: historial, isLoading: loadHist } = useQuery({
    queryKey: ['aprobaciones-historial'],
    queryFn: aprobacionesApi.getHistorial,
    enabled: tab === 'historial',
  });

  const decidirMutation = useMutation({
    mutationFn: ({ id, aprobado }: { id: string; aprobado: boolean }) =>
      aprobacionesApi.decidir(id, aprobado, comentario || undefined),
    onSuccess: (_, { aprobado }) => {
      setDecidiendo(null);
      setComentario('');
      toast.success(aprobado ? 'Ticket aprobado' : 'Ticket rechazado');
      queryClient.invalidateQueries({ queryKey: ['aprobaciones-pendientes'] });
      queryClient.invalidateQueries({ queryKey: ['aprobaciones-pendientes-count'] });
      queryClient.invalidateQueries({ queryKey: ['aprobaciones-historial'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Error al procesar la aprobación'),
  });

  const isLoading = tab === 'pendientes' ? loadPend : loadHist;
  const items = tab === 'pendientes' ? (pendientes ?? []) : (historial ?? []);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Aprobaciones</h1>
          <p className="text-gray-500 text-sm mt-1">
            {pendientes?.length ?? 0} solicitudes pendientes de aprobación
          </p>
        </div>
        {(pendientes?.length ?? 0) > 0 && (
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 px-4 py-2 rounded-xl">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <span className="text-sm font-medium text-amber-700">
              {pendientes!.length} pendiente{pendientes!.length !== 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setTab('pendientes')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition ${
            tab === 'pendientes' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Clock className="h-4 w-4" />
          Pendientes
          {(pendientes?.length ?? 0) > 0 && (
            <span className="bg-amber-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
              {pendientes!.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab('historial')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition ${
            tab === 'historial' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <CheckCircle2 className="h-4 w-4" />
          Historial
        </button>
      </div>

      {/* Content */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-16">
            <CheckCircle2 className="h-10 w-10 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">
              {tab === 'pendientes' ? 'No hay solicitudes pendientes' : 'Sin historial de aprobaciones'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {items.map(item => (
              <AprobacionRow
                key={item.id}
                item={item}
                showActions={tab === 'pendientes'}
                decidiendo={decidiendo === item.id}
                comentario={decidiendo === item.id ? comentario : ''}
                onDecidirClick={() => {
                  setDecidiendo(decidiendo === item.id ? null : item.id);
                  setComentario('');
                }}
                onComentarioChange={setComentario}
                onAprobar={() => decidirMutation.mutate({ id: item.id, aprobado: true })}
                onRechazar={() => decidirMutation.mutate({ id: item.id, aprobado: false })}
                onVerTicket={() => navigate(`/tickets/${item.ticketId}`)}
                isPending={decidirMutation.isPending}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function AprobacionRow({
  item, showActions, decidiendo, comentario,
  onDecidirClick, onComentarioChange, onAprobar, onRechazar, onVerTicket, isPending,
}: {
  item: Aprobacion;
  showActions: boolean;
  decidiendo: boolean;
  comentario: string;
  onDecidirClick: () => void;
  onComentarioChange: (v: string) => void;
  onAprobar: () => void;
  onRechazar: () => void;
  onVerTicket: () => void;
  isPending: boolean;
}) {
  const estadoInfo = ESTADO_LABEL[item.estado];

  return (
    <div className={`p-5 transition ${decidiendo ? 'bg-blue-50/30' : 'hover:bg-gray-50/50'}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <button
              onClick={onVerTicket}
              className="text-sm font-bold text-blue-600 hover:underline"
            >
              {item.numeroTicket}
            </button>
            <span
              className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ backgroundColor: item.prioridadColor + '20', color: item.prioridadColor }}
            >
              {item.prioridadTicket}
            </span>
            {!showActions && (
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${estadoInfo.color}`}>
                {estadoInfo.label}
              </span>
            )}
          </div>
          <p className="text-sm font-medium text-gray-900 truncate">{item.asuntoTicket}</p>
          <div className="flex items-center gap-3 mt-1 text-xs text-gray-400 flex-wrap">
            <span>Solicitado por <strong className="text-gray-600">{item.solicitanteTicket}</strong></span>
            <span>·</span>
            <span>{formatDistanceToNow(item.fechaCreacion)}</span>
            {item.aprobador && (
              <>
                <span>·</span>
                <span>Decidido por <strong className="text-gray-600">{item.aprobador}</strong></span>
              </>
            )}
          </div>
          {item.comentario && !showActions && (
            <p className="text-xs text-gray-500 mt-1.5 bg-gray-50 rounded px-2 py-1 border border-gray-100">
              "{item.comentario}"
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {showActions && (
            <button
              onClick={onDecidirClick}
              className={`flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg border transition ${
                decidiendo
                  ? 'border-blue-300 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-blue-300 text-gray-600 hover:text-blue-600'
              }`}
            >
              Revisar <ChevronRight className={`h-3.5 w-3.5 transition-transform ${decidiendo ? 'rotate-90' : ''}`} />
            </button>
          )}
          <button
            onClick={onVerTicket}
            className="text-xs text-gray-400 hover:text-gray-600 border border-gray-200 rounded-lg px-2.5 py-1.5 hover:border-gray-300 transition"
          >
            Ver ticket
          </button>
        </div>
      </div>

      {/* Panel de decisión */}
      {decidiendo && (
        <div className="mt-4 pt-4 border-t border-blue-100">
          <textarea
            value={comentario}
            onChange={e => onComentarioChange(e.target.value)}
            placeholder="Comentario (opcional)..."
            rows={2}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none mb-3"
          />
          <div className="flex items-center gap-2">
            <button
              onClick={onAprobar}
              disabled={isPending}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50"
            >
              <CheckCircle2 className="h-4 w-4" />
              Aprobar
            </button>
            <button
              onClick={onRechazar}
              disabled={isPending}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50"
            >
              <XCircle className="h-4 w-4" />
              Rechazar
            </button>
            <button onClick={onDecidirClick} className="text-sm text-gray-400 hover:text-gray-600 ml-2">
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
