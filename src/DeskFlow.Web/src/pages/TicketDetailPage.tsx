import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, Send, Clock, User, Tag, AlertTriangle, UserCheck,
  CheckCircle2, MessageSquare, History, Calendar, Building2,
  Layers, ChevronDown, Timer, TrendingUp, PauseCircle, PlayCircle, X
} from 'lucide-react';
import { ticketsApi, type MotivoEspera } from '../api/tickets';
import { catalogosApi } from '../api/dashboard';
import { aprobacionesApi } from '../api/aprobaciones';
import { formatDate, formatDistanceToNow } from '../utils/date';
import { useAuthStore } from '../store/authStore';
import { toast } from 'sonner';
import { TokenIcon } from '../lib/iconTokens';

const PRIMERA_RESPUESTA_HORAS = 2;

function calcTimerInfo(targetMs: number, ahora: number) {
  const diff = targetMs - ahora;
  const vencido = diff <= 0;
  const absDiff = Math.abs(diff);
  const horas = Math.floor(absDiff / 3600000);
  const mins = Math.floor((absDiff % 3600000) / 60000);
  const segs = Math.floor((absDiff % 60000) / 1000);
  return { vencido, horas, mins, segs };
}

function useNow() {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  return now;
}

function TimerCard({
  titulo, subtitulo, targetMs, completado, completadoTexto, color
}: {
  titulo: string;
  subtitulo: string;
  targetMs: number | null;
  completado: boolean;
  completadoTexto?: string;
  color: 'blue' | 'amber' | 'red' | 'green';
}) {
  const now = useNow();
  const colores = {
    blue:  { bg: 'bg-blue-50',  border: 'border-blue-200',  text: 'text-blue-700',  digit: 'bg-blue-600 text-white' },
    amber: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', digit: 'bg-amber-500 text-white' },
    red:   { bg: 'bg-red-50',   border: 'border-red-200',   text: 'text-red-700',   digit: 'bg-red-600 text-white' },
    green: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', digit: 'bg-green-600 text-white' },
  };

  const c = colores[color];

  if (completado) {
    return (
      <div className={`${c.bg} border ${c.border} rounded-xl p-3 flex items-center gap-3`}>
        <CheckCircle2 className={`h-6 w-6 ${c.text} flex-shrink-0`} />
        <div>
          <p className={`text-[11px] font-medium ${c.text} uppercase tracking-wide`}>{titulo}</p>
          <p className={`text-[13px] font-semibold ${c.text} mt-0.5`}>{completadoTexto || 'Completado'}</p>
        </div>
      </div>
    );
  }

  if (!targetMs) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
        <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">{titulo}</p>
        <p className="text-[13px] text-gray-400 mt-1">{subtitulo}</p>
      </div>
    );
  }

  const { vencido, horas, mins, segs } = calcTimerInfo(targetMs, now);
  const efectivoColor = vencido ? 'red' : color;
  const ec = colores[efectivoColor];

  return (
    <div className={`${ec.bg} border ${ec.border} rounded-xl p-3`}>
      <div className="flex items-center gap-1.5 mb-2">
        {vencido ? <AlertTriangle className={`h-3 w-3 ${ec.text}`} /> : <Timer className={`h-3 w-3 ${ec.text}`} />}
        <p className={`text-[11px] font-medium ${ec.text} uppercase tracking-wide`}>
          {titulo} {vencido ? '— VENCIDO' : ''}
        </p>
      </div>
      <div className="flex items-center gap-1">
        {[
          { v: String(horas).padStart(2, '0'), u: 'h' },
          { v: String(mins).padStart(2, '0'), u: 'm' },
          { v: String(segs).padStart(2, '0'), u: 's' },
        ].map(({ v, u }) => (
          <div key={u} className="flex items-end gap-0.5">
            <span className={`text-base font-mono font-bold tabular-nums px-1.5 py-0.5 rounded ${ec.digit}`}>{v}</span>
            <span className={`text-[11px] ${ec.text} mb-0.5`}>{u}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { usuario } = useAuthStore();
  const [comentario, setComentario] = useState('');
  const [esInterno, setEsInterno] = useState(false);
  const [mostrarAsignar, setMostrarAsignar] = useState(false);
  const [mostrarCambiarArea, setMostrarCambiarArea] = useState(false);
  const [mostrarSLA, setMostrarSLA] = useState(false);
  const [horasSLA, setHorasSLA] = useState('8');
  const [mostrarEscalar, setMostrarEscalar] = useState(false);
  const [motivoEscalacion, setMotivoEscalacion] = useState('');
  const [esperaCambiando, setEsperaCambiando] = useState(false);
  const [mostrarMotivos, setMostrarMotivos] = useState(false);

  const { data: ticket, isLoading } = useQuery({
    queryKey: ['ticket', id],
    queryFn: () => ticketsApi.getById(id!),
    refetchInterval: 30000,
  });

  const { data: estados } = useQuery({ queryKey: ['estados'], queryFn: catalogosApi.getEstados });
  const { data: tecnicos } = useQuery({
    queryKey: ['tecnicos'],
    queryFn: catalogosApi.getTecnicos,
    enabled: ['Administrador', 'Supervisor'].includes(usuario?.rol ?? ''),
  });
  const { data: areas } = useQuery({
    queryKey: ['areas'],
    queryFn: catalogosApi.getAreas,
    enabled: ['Administrador', 'Supervisor'].includes(usuario?.rol ?? ''),
  });

  const { data: motivosEspera = [] } = useQuery<MotivoEspera[]>({
    queryKey: ['motivos-espera', id],
    queryFn: () => ticketsApi.getMotivosEspera(id!),
    enabled: !!id && ['Administrador', 'Supervisor', 'Agente'].includes(usuario?.rol ?? ''),
  });

  const comentarioMutation = useMutation({
    mutationFn: () => ticketsApi.addComentario(id!, comentario, esInterno),
    onSuccess: () => {
      setComentario('');
      queryClient.invalidateQueries({ queryKey: ['ticket', id] });
      queryClient.invalidateQueries({ queryKey: ['mi-trabajo'] });
    },
    onError: () => toast.error('Error al enviar el comentario'),
  });

  const estadoMutation = useMutation({
    mutationFn: (estadoId: string) => ticketsApi.cambiarEstado(id!, estadoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket', id] });
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      queryClient.invalidateQueries({ queryKey: ['mi-trabajo'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: () => toast.error('Error al cambiar el estado'),
  });

  const asignarMutation = useMutation({
    mutationFn: (tecnicoId: string) => ticketsApi.asignarTecnico(id!, tecnicoId),
    onSuccess: () => {
      setMostrarAsignar(false);
      queryClient.invalidateQueries({ queryKey: ['ticket', id] });
      queryClient.invalidateQueries({ queryKey: ['tickets-pendientes'] });
      queryClient.invalidateQueries({ queryKey: ['tickets-pendientes-count'] });
      queryClient.invalidateQueries({ queryKey: ['mi-trabajo'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: () => toast.error('Error al asignar el agente'),
  });

  const tomarMutation = useMutation({
    mutationFn: () => ticketsApi.tomarTicket(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket', id] });
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      queryClient.invalidateQueries({ queryKey: ['tickets-pendientes'] });
      queryClient.invalidateQueries({ queryKey: ['tickets-pendientes-count'] });
      queryClient.invalidateQueries({ queryKey: ['mi-trabajo'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: () => toast.error('Error al tomar el ticket'),
  });

  const slaMutation = useMutation({
    mutationFn: () => {
      const fecha = new Date(Date.now() + Number(horasSLA) * 3600000).toISOString();
      return ticketsApi.setSla(id!, fecha, `Tiempo estimado de resolución: ${horasSLA}h`);
    },
    onSuccess: () => {
      setMostrarSLA(false);
      queryClient.invalidateQueries({ queryKey: ['ticket', id] });
    },
    onError: () => toast.error('Error al actualizar el SLA'),
  });

  const escalarMutation = useMutation({
    mutationFn: (motivo: string) => aprobacionesApi.escalar(id!, motivo || undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket', id] });
      queryClient.invalidateQueries({ queryKey: ['mi-trabajo'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: () => toast.error('Error al escalar el ticket'),
  });

  const aprobacionMutation = useMutation({
    mutationFn: () => aprobacionesApi.solicitarAprobacion(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket', id] });
      queryClient.invalidateQueries({ queryKey: ['aprobaciones-pendientes'] });
      queryClient.invalidateQueries({ queryKey: ['aprobaciones-pendientes-count'] });
    },
    onError: () => toast.error('Error al enviar la solicitud de aprobación'),
  });

  const areaUpdateMutation = useMutation({
    mutationFn: (areaId: string) => ticketsApi.update(id!, { areaId }),
    onSuccess: () => {
      setMostrarCambiarArea(false);
      queryClient.invalidateQueries({ queryKey: ['ticket', id] });
      toast.success('Área actualizada');
    },
    onError: () => toast.error('Error al cambiar el área'),
  });

  const reanudarMutation = useMutation({
    mutationFn: () => ticketsApi.reanudarEspera(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket', id] });
      toast.success('SLA activo');
    },
    onError: () => toast.error('Error al reanudar'),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!ticket) return <div className="text-gray-500 p-8">Ticket no encontrado</div>;

  const canManage = ['Administrador', 'Supervisor', 'Agente'].includes(usuario?.rol ?? '');
  const esAgente = usuario?.rol === 'Agente';
  const esSupervisorOAdmin = usuario?.rol === 'Supervisor' || usuario?.rol === 'Administrador';
  const puedeTomarTicket = esAgente && !ticket.tecnicoAsignado
    && ticket.estado !== 'Resuelto' && ticket.estado !== 'Cerrado';
  const esFinal = ticket.estado === 'Resuelto' || ticket.estado === 'Cerrado';
  const puedeEscalar = canManage && !esFinal && !ticket.fechaEscalacion;
  const puedeEnviarAprobacion = canManage && !esFinal && ticket.estado !== 'Pendiente de Aprobación' && ticket.estado !== 'Rechazado';

  // Timers
  const primeraRespuestaLimite = new Date(ticket.fechaCreacion).getTime() + PRIMERA_RESPUESTA_HORAS * 3600000;
  const primeraRespuestaCompletada = !!ticket.fechaAsignacion;
  const slaLimiteMs = ticket.fechaLimiteSLA ? new Date(ticket.fechaLimiteSLA).getTime() : null;
  const slaCompletado = ticket.estado === 'Resuelto' || ticket.estado === 'Cerrado';

  // Cambiar estado de espera desde la barra de chips
  const handleCambiarEspera = async (motivoId: string) => {
    if (esperaCambiando || reanudarMutation.isPending) return;
    if (ticket.estaEnEspera && ticket.motivoEsperaId === motivoId) return;
    setEsperaCambiando(true);
    try {
      if (ticket.estaEnEspera) await ticketsApi.reanudarEspera(id!);
      await ticketsApi.ponerEnEspera(id!, motivoId, undefined);
      queryClient.invalidateQueries({ queryKey: ['ticket', id] });
      toast.success('SLA pausado');
    } catch {
      toast.error('Error al cambiar estado de espera');
    } finally {
      setEsperaCambiando(false);
    }
  };

  const handleReanudar = () => {
    if (!ticket.estaEnEspera || reanudarMutation.isPending) return;
    reanudarMutation.mutate();
  };

  const comentariosVisibles = ticket.comentarios.filter(c => !c.esInterno || canManage);
  const avatarColores = ['bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-amber-500', 'bg-rose-500', 'bg-cyan-500'];
  const colorPorUsuario: Record<string, string> = {};
  let colorIdx = 0;
  comentariosVisibles.forEach(c => {
    if (!colorPorUsuario[c.usuario.id]) {
      colorPorUsuario[c.usuario.id] = avatarColores[colorIdx++ % avatarColores.length];
    }
  });

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg hover:bg-gray-200 transition flex-shrink-0 text-gray-500">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-[12px] font-bold text-blue-600 font-mono bg-blue-50 px-2 py-0.5 rounded">{ticket.numero}</span>
              <span
                className="text-[11px] px-2 py-0.5 rounded-full font-semibold"
                style={{ backgroundColor: ticket.estadoColor + '20', color: ticket.estadoColor }}
              >
                {ticket.estado}
              </span>
              <span
                className="text-[11px] px-2 py-0.5 rounded-full font-semibold"
                style={{ backgroundColor: ticket.prioridadColor + '20', color: ticket.prioridadColor }}
              >
                {ticket.prioridad}
              </span>
              {ticket.slaVencido && (
                <span className="flex items-center gap-1 text-[11px] text-red-600 bg-red-50 px-2 py-0.5 rounded-full font-semibold">
                  <AlertTriangle className="h-3 w-3" /> SLA Vencido
                </span>
              )}
              {ticket.estaEnEspera && (
                <span className="flex items-center gap-1 text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full font-semibold border border-amber-200">
                  <PauseCircle className="h-3 w-3" />
                  {ticket.motivoEsperaIcono && (
                    <span className="df-icon-tile h-5 w-5 rounded-full border-none bg-amber-100">
                      <TokenIcon token={ticket.motivoEsperaIcono} fallback="clock3" className="text-amber-700" size={11} />
                    </span>
                  )}
                  {ticket.motivoEspera ? ticket.motivoEspera : 'En espera'}
                </span>
              )}
            </div>
            <h1 className="text-[17px] font-bold text-gray-900 truncate leading-snug">{ticket.asunto}</h1>
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0 flex-wrap justify-end">
          {puedeEscalar && (
            <button
              onClick={() => setMostrarEscalar(true)}
              disabled={escalarMutation.isPending}
              className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg text-[13px] font-medium transition disabled:opacity-50"
            >
              <TrendingUp className="h-3.5 w-3.5" />
              Escalar
            </button>
          )}
          {puedeEnviarAprobacion && (
            <button
              onClick={() => aprobacionMutation.mutate()}
              disabled={aprobacionMutation.isPending}
              className="flex items-center gap-1.5 border border-purple-300 hover:bg-purple-50 text-purple-700 px-3 py-1.5 rounded-lg text-[13px] font-medium transition disabled:opacity-50"
            >
              {aprobacionMutation.isPending ? 'Enviando...' : 'Pedir aprobación'}
            </button>
          )}
          {canManage && !esFinal && (
            <select
              value={ticket.estadoId}
              onChange={e => estadoMutation.mutate(e.target.value)}
              disabled={estadoMutation.isPending}
              className="border border-gray-200 rounded-lg px-3 py-1.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-700 font-medium"
            >
              {estados?.filter(e => !e.esFinal || e.id === ticket.estadoId).map(e => (
                <option key={e.id} value={e.id}>{e.nombre}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Estado de espera — un solo control con dropdown */}
      {canManage && !esFinal && motivosEspera.length > 0 && (
        <div className="relative">
          <button
            onClick={() => setMostrarMotivos(v => !v)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-[13px] font-medium transition
              ${ticket.estaEnEspera
                ? 'bg-amber-50 border-amber-300 text-amber-700'
                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
          >
            {ticket.estaEnEspera
              ? <>
                  <PauseCircle className="h-3.5 w-3.5 shrink-0" />
                  <span className="flex items-center gap-2">
                    {ticket.motivoEsperaIcono && (
                      <span className="df-icon-tile h-5 w-5 rounded-full border-none bg-amber-100">
                        <TokenIcon token={ticket.motivoEsperaIcono} fallback="clock3" className="text-amber-700" size={11} />
                      </span>
                    )}
                    {ticket.motivoEspera ?? 'En espera'}
                  </span>
                </>
              : <><PlayCircle className="h-3.5 w-3.5 shrink-0" /><span>Esperando al agente</span></>
            }
            <ChevronDown className={`h-3.5 w-3.5 shrink-0 transition-transform ${mostrarMotivos ? 'rotate-180' : ''}`} />
          </button>

          {mostrarMotivos && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMostrarMotivos(false)} />
              <div className="absolute top-full left-0 mt-1 w-72 bg-white border border-gray-200 rounded-xl shadow-lg z-20 overflow-hidden">
                {/* Opción: reanudar SLA */}
                <button
                  onClick={() => { handleReanudar(); setMostrarMotivos(false); }}
                  disabled={!ticket.estaEnEspera || reanudarMutation.isPending}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-[13px] text-left border-b border-gray-100 transition
                    ${!ticket.estaEnEspera
                      ? 'bg-emerald-50 text-emerald-700 font-medium cursor-default'
                      : 'text-gray-700 hover:bg-gray-50'}`}
                >
                  <PlayCircle className="h-4 w-4 shrink-0" />
                  <span className="flex-1">Esperando al agente</span>
                  {!ticket.estaEnEspera && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />}
                </button>
                {/* Motivos de espera */}
                {motivosEspera.map(m => (
                  <button
                    key={m.id}
                    onClick={() => { handleCambiarEspera(m.id); setMostrarMotivos(false); }}
                    disabled={esperaCambiando || (ticket.estaEnEspera && ticket.motivoEsperaId === m.id)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-[13px] text-left border-b border-gray-50 last:border-0 transition
                      ${ticket.estaEnEspera && ticket.motivoEsperaId === m.id
                        ? 'bg-amber-50 text-amber-700 font-medium cursor-default'
                        : 'text-gray-700 hover:bg-gray-50'}`}
                  >
                    {m.icono ? (
                      <span className="df-icon-tile h-7 w-7 rounded-full border-slate-200 bg-slate-50">
                        <TokenIcon token={m.icono} fallback="clock3" className="text-slate-500" size={13} />
                      </span>
                    ) : (
                      <PauseCircle className="h-4 w-4 shrink-0 text-gray-300" />
                    )}
                    <span className="flex-1">{m.nombre}</span>
                    {ticket.estaEnEspera && ticket.motivoEsperaId === m.id && (
                      <CheckCircle2 className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Modal overlay: escalación */}
      {mostrarEscalar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => { setMostrarEscalar(false); setMotivoEscalacion(''); }}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-red-500" />
                <h3 className="font-semibold text-gray-900 text-[15px]">Escalar ticket</h3>
              </div>
              <button onClick={() => { setMostrarEscalar(false); setMotivoEscalacion(''); }} className="p-1.5 rounded-md hover:bg-gray-100 transition text-gray-400">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="px-5 py-4 space-y-3">
              <p className="text-[13px] text-gray-600">Al escalar, se notificará al supervisor y quedará registrado en el historial.</p>
              <div>
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Motivo <span className="normal-case font-normal">(opcional)</span></p>
                <textarea
                  value={motivoEscalacion}
                  onChange={e => setMotivoEscalacion(e.target.value)}
                  placeholder="Describí el motivo de la escalación..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-red-400 resize-none bg-gray-50 focus:bg-white transition"
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end px-5 py-3 border-t border-gray-100 bg-gray-50/50 rounded-b-2xl">
              <button onClick={() => { setMostrarEscalar(false); setMotivoEscalacion(''); }} className="px-4 py-2 border border-gray-200 rounded-lg text-[13px] text-gray-600 hover:bg-white transition font-medium">
                Cancelar
              </button>
              <button
                onClick={() => { escalarMutation.mutate(motivoEscalacion); setMostrarEscalar(false); setMotivoEscalacion(''); }}
                disabled={escalarMutation.isPending}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg text-[13px] font-medium transition flex items-center gap-1.5 shadow-sm"
              >
                <TrendingUp className="h-3.5 w-3.5" />
                {escalarMutation.isPending ? 'Escalando...' : 'Confirmar escalación'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left: Descripción + Conversación + Historial */}
        <div className="lg:col-span-2 space-y-4">
          {/* Descripción */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h3 className="text-[13px] font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
              <Tag className="h-3.5 w-3.5" /> Descripción
            </h3>
            <p className="text-gray-700 text-[13px] whitespace-pre-wrap leading-relaxed">{ticket.descripcion}</p>
          </div>

          {/* Conversación */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-3.5 border-b border-gray-100">
              <MessageSquare className="h-3.5 w-3.5 text-gray-400" />
              <h3 className="text-[14px] font-semibold text-gray-800">Conversación</h3>
              <span className="text-[11px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium">{comentariosVisibles.length}</span>
            </div>

            <div className="p-5 space-y-5">
              {comentariosVisibles.length === 0 && (
                <div className="text-center py-8">
                  <MessageSquare className="h-8 w-8 text-gray-200 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">Sin comentarios aún</p>
                </div>
              )}
              {comentariosVisibles.map(c => {
                const esPropio = c.usuario.id === usuario?.id;
                const bgColor = colorPorUsuario[c.usuario.id] ?? 'bg-gray-400';
                return (
                  <div key={c.id} className={`flex gap-3 ${c.esInterno ? 'opacity-80' : ''}`}>
                    <div className={`w-7 h-7 ${bgColor} rounded-full flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0 mt-0.5`}>
                      {c.usuario.nombreCompleto[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className="text-[13px] font-semibold text-gray-900">{c.usuario.nombreCompleto}</span>
                        {esPropio && <span className="text-[11px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full font-medium">Vos</span>}
                        {c.esInterno && <span className="text-[11px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-medium">Interno</span>}
                        <span className="text-[11px] text-gray-400">{formatDistanceToNow(c.fechaCreacion)}</span>
                      </div>
                      <div className={`text-[13px] text-gray-700 rounded-lg px-4 py-3 leading-relaxed
                        ${c.esInterno ? 'bg-amber-50 border border-amber-100' : 'bg-gray-50 border border-gray-100'}`}>
                        {c.contenido}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Input comentario */}
            <div className="border-t border-gray-100 p-5 bg-gray-50/50">
              <textarea
                value={comentario}
                onChange={e => setComentario(e.target.value)}
                placeholder="Escribí tu comentario..."
                rows={3}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none bg-white"
              />
              <div className="flex items-center justify-between mt-2">
                {canManage && (
                  <label className="flex items-center gap-2 text-sm text-gray-500 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={esInterno}
                      onChange={e => setEsInterno(e.target.checked)}
                      className="rounded accent-amber-500"
                    />
                    <span>Comentario interno <span className="text-xs text-gray-400">(no visible para el usuario)</span></span>
                  </label>
                )}
                <button
                  onClick={() => comentario.trim() && comentarioMutation.mutate()}
                  disabled={!comentario.trim() || comentarioMutation.isPending}
                  className="ml-auto flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
                >
                  <Send className="h-3.5 w-3.5" />
                  {comentarioMutation.isPending ? 'Enviando...' : 'Enviar'}
                </button>
              </div>
            </div>
          </div>

          {/* Historial */}
          {ticket.historial.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <h3 className="text-[13px] font-semibold text-gray-500 uppercase tracking-wide mb-4 flex items-center gap-2">
                <History className="h-3.5 w-3.5" /> Historial de cambios
              </h3>
              <div className="relative">
                <div className="absolute left-[7px] top-0 bottom-0 w-px bg-gray-100" />
                <div className="space-y-3">
                  {ticket.historial.map(h => (
                    <div key={h.id} className="flex items-start gap-3 pl-0">
                      <div className="w-3.5 h-3.5 rounded-full border-2 border-blue-400 bg-white flex-shrink-0 z-10 mt-1" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] text-gray-700">
                          <span className="font-semibold text-gray-800">{h.usuario.nombreCompleto}</span>
                          <span className="text-gray-400 mx-1">·</span>{h.descripcion}
                        </p>
                        {h.estadoAnterior && h.estadoNuevo && (
                          <p className="text-[11px] text-gray-400 mt-0.5">
                            {h.estadoAnterior} → <strong className="text-gray-600">{h.estadoNuevo}</strong>
                          </p>
                        )}
                        <p className="text-[11px] text-gray-400 mt-0.5">{formatDate(h.fechaCreacion)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right sidebar */}
        <div className="space-y-4">
          {/* Métricas SLA */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
              <Timer className="h-3.5 w-3.5 text-gray-400" />
              <h3 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Métricas SLA</h3>
              {ticket.estaEnEspera && (
                <span className="ml-auto text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-semibold">Pausado</span>
              )}
            </div>
            <div className="p-4 space-y-3">
              <TimerCard
                titulo="Primera Respuesta"
                subtitulo="2h desde la creación"
                targetMs={primeraRespuestaCompletada ? null : primeraRespuestaLimite}
                completado={primeraRespuestaCompletada}
                completadoTexto={ticket.fechaAsignacion ? `Respondido ${formatDistanceToNow(ticket.fechaAsignacion)}` : 'Respondido'}
                color="blue"
              />
              <TimerCard
                titulo="Resolución (SLA)"
                subtitulo={esAgente && !slaCompletado ? 'Establecé el tiempo estimado' : 'Sin tiempo asignado'}
                targetMs={slaLimiteMs}
                completado={slaCompletado}
                completadoTexto={ticket.fechaResolucion ? `Resuelto ${formatDistanceToNow(ticket.fechaResolucion)}` : 'Cerrado'}
                color="amber"
              />
              {/* SLA setter inline */}
              {(esAgente || esSupervisorOAdmin) && ticket.tecnicoAsignado && !slaCompletado && (
                <div className="pt-2 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] text-gray-400">
                      {slaLimiteMs ? formatDate(ticket.fechaLimiteSLA!) : 'Sin límite definido'}
                    </span>
                    <button
                      onClick={() => setMostrarSLA(!mostrarSLA)}
                      className="text-[12px] text-blue-600 hover:text-blue-700 font-medium flex items-center gap-0.5"
                    >
                      {slaLimiteMs ? 'Modificar' : 'Establecer'}
                      <ChevronDown className={`h-3 w-3 transition-transform ${mostrarSLA ? 'rotate-180' : ''}`} />
                    </button>
                  </div>
                  {mostrarSLA && (
                    <div className="mt-2 space-y-2">
                      <select
                        value={horasSLA}
                        onChange={e => setHorasSLA(e.target.value)}
                        className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {['1','2','4','8','16','24','48','72'].map(h => (
                          <option key={h} value={h}>{h} hora{Number(h) !== 1 ? 's' : ''}</option>
                        ))}
                      </select>
                      <div className="flex gap-2">
                        <button
                          onClick={() => slaMutation.mutate()}
                          disabled={slaMutation.isPending}
                          className="flex-1 bg-amber-500 hover:bg-amber-600 text-white py-1.5 rounded-lg text-[13px] font-medium transition disabled:opacity-50"
                        >
                          {slaMutation.isPending ? 'Guardando...' : 'Confirmar'}
                        </button>
                        <button onClick={() => setMostrarSLA(false)} className="text-[13px] text-gray-400 hover:text-gray-600 px-2">
                          Cancelar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Detalles del ticket */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <h3 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Detalles del ticket</h3>
            </div>
            <div className="p-4 space-y-3">
              <InfoRow icon={Clock} label="Creado" value={formatDate(ticket.fechaCreacion)} />
              {ticket.fechaAsignacion && (
                <InfoRow icon={UserCheck} label="Asignado" value={formatDate(ticket.fechaAsignacion)} />
              )}
              {ticket.fechaResolucion && (
                <InfoRow icon={CheckCircle2} label="Resuelto" value={formatDate(ticket.fechaResolucion)} />
              )}
              <InfoRow icon={Layers} label="Categoría" value={ticket.categoria} />
              {ticket.subcategoria && (
                <InfoRow icon={Layers} label="Subcategoría" value={ticket.subcategoria} />
              )}
              {ticket.sucursal && <InfoRow icon={Building2} label="Sucursal" value={ticket.sucursal} />}
              <div className="flex items-start gap-2.5">
                <Building2 className="h-3.5 w-3.5 text-gray-300 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] text-gray-400 mb-0.5 uppercase tracking-wide font-medium">Área</p>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[13px] text-gray-700 truncate">{ticket.area || 'Sin especificar'}</p>
                    {esSupervisorOAdmin && !esFinal && (
                      <button
                        onClick={() => setMostrarCambiarArea(!mostrarCambiarArea)}
                        className="text-[12px] text-blue-600 hover:text-blue-700 font-medium flex-shrink-0"
                      >
                        {mostrarCambiarArea ? 'Cerrar' : 'Cambiar'}
                      </button>
                    )}
                  </div>
                  {mostrarCambiarArea && areas && (
                    <select
                      className="mt-2 w-full border border-gray-200 rounded-lg px-2 py-1.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500"
                      defaultValue={ticket.areaId ?? ''}
                      onChange={e => e.target.value && areaUpdateMutation.mutate(e.target.value)}
                    >
                      <option value="">Seleccionar área...</option>
                      {areas.filter(a => a.helpDeskId).map(a => (
                        <option key={a.id} value={a.id}>{a.nombre}</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
              {ticket.fechaLimiteSLA && (
                <InfoRow
                  icon={Calendar}
                  label="Límite SLA"
                  value={formatDate(ticket.fechaLimiteSLA)}
                  valueClass={ticket.slaVencido ? 'text-red-600 font-semibold' : 'text-gray-700'}
                />
              )}
              {ticket.fechaEscalacion && (
                <InfoRow
                  icon={AlertTriangle}
                  label="Escalado"
                  value={formatDate(ticket.fechaEscalacion)}
                  valueClass="text-red-600 font-semibold"
                />
              )}
            </div>
          </div>

          {/* Solicitante */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <h3 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Solicitante</h3>
            </div>
            <div className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-[13px] font-bold text-blue-600 flex-shrink-0">
                  {ticket.usuarioCreador.nombreCompleto[0]}
                </div>
                <div>
                  <p className="text-[13px] font-medium text-gray-900">{ticket.usuarioCreador.nombreCompleto}</p>
                  <p className="text-[11px] text-gray-400">{ticket.usuarioCreador.email}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Técnico asignado */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Técnico asignado</h3>
              {esSupervisorOAdmin && !esFinal && (
                <button
                  onClick={() => setMostrarAsignar(!mostrarAsignar)}
                  className="text-[12px] text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                >
                  {ticket.tecnicoAsignado ? 'Cambiar' : 'Asignar'}
                  <ChevronDown className={`h-3 w-3 transition-transform ${mostrarAsignar ? 'rotate-180' : ''}`} />
                </button>
              )}
            </div>
            <div className="p-4">
              {ticket.tecnicoAsignado ? (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-[13px] font-bold text-green-600 flex-shrink-0">
                    {ticket.tecnicoAsignado.nombreCompleto[0]}
                  </div>
                  <div>
                    <p className="text-[13px] font-medium text-gray-900">{ticket.tecnicoAsignado.nombreCompleto}</p>
                    <p className="text-[11px] text-gray-400">{ticket.tecnicoAsignado.email}</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-gray-400">
                  <User className="h-3.5 w-3.5" />
                  <span className="text-[13px]">Sin asignar</span>
                </div>
              )}

              {mostrarAsignar && tecnicos && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <select
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500"
                    defaultValue=""
                    onChange={e => e.target.value && asignarMutation.mutate(e.target.value)}
                  >
                    <option value="">Seleccionar técnico...</option>
                    {tecnicos.map(t => (
                      <option key={t.id} value={t.id}>{t.nombreCompleto}</option>
                    ))}
                  </select>
                </div>
              )}

              {puedeTomarTicket && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <button
                    onClick={() => tomarMutation.mutate()}
                    disabled={tomarMutation.isPending}
                    className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg text-[13px] font-medium transition disabled:opacity-50"
                  >
                    <UserCheck className="h-4 w-4" />
                    {tomarMutation.isPending ? 'Tomando...' : 'Tomar este ticket'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({
  icon: Icon, label, value, valueClass
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon className="h-3.5 w-3.5 text-gray-300 mt-0.5 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-[11px] text-gray-400 mb-0.5 uppercase tracking-wide font-medium">{label}</p>
        <p className={`text-[13px] truncate ${valueClass ?? 'text-gray-700'}`}>{value}</p>
      </div>
    </div>
  );
}
