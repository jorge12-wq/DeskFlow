import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Plus, Clock, Inbox, CheckSquare, AlertTriangle,
  LayoutGrid, List, ChevronDown, RefreshCw,
  ArrowRight, Calendar, Zap, Check, X
} from 'lucide-react';
import { ticketsApi } from '../api/tickets';
import { aprobacionesApi } from '../api/aprobaciones';
import { useAuthStore } from '../store/authStore';
import { formatDistanceToNow } from '../utils/date';
import type { TicketListItem } from '../types';

// ── Avatar de iniciales ──────────────────────────────────────
function Avatar({ nombre, size = 'sm' }: { nombre: string; size?: 'sm' | 'md' }) {
  const initials = nombre.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();
  const colors = ['bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-orange-500', 'bg-pink-500', 'bg-teal-500'];
  const color = colors[nombre.charCodeAt(0) % colors.length];
  const sz = size === 'sm' ? 'h-6 w-6 text-xs' : 'h-8 w-8 text-sm';
  return (
    <div className={`${sz} ${color} rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0`}>
      {initials}
    </div>
  );
}

// ── Barra de SLA ─────────────────────────────────────────────
function SlaBar({ label, fecha, completada, fechaInicio }: { label: string; fecha?: string | null; completada?: boolean; fechaInicio?: string }) {
  if (!fecha && !completada) {
    return (
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-gray-400 w-14">{label}</span>
        <div className="flex-1 h-1 bg-gray-100 rounded-full" />
        <span className="text-xs text-gray-300">—</span>
      </div>
    );
  }
  if (completada) {
    return (
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-gray-400 w-14">{label}</span>
        <div className="flex-1 h-1 bg-green-400 rounded-full" />
        <CheckSquare className="h-3 w-3 text-green-500" />
      </div>
    );
  }
  const limite = new Date(fecha!);
  const ahora = new Date();
  const diff = limite.getTime() - ahora.getTime();
  const vencido = diff < 0;
  const ventana = fechaInicio ? limite.getTime() - new Date(fechaInicio).getTime() : 2 * 3600000;
  const pct = vencido ? 100 : Math.max(5, 100 - (diff / ventana) * 100);
  const color = vencido ? 'bg-red-500' : pct > 70 ? 'bg-orange-400' : 'bg-blue-400';

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs text-gray-400 w-14">{label}</span>
      <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full`} style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
      {vencido
        ? <AlertTriangle className="h-3 w-3 text-red-500" />
        : <Clock className="h-3 w-3 text-gray-400" />
      }
    </div>
  );
}

// ── Tarjeta de ticket estilo InvGate ─────────────────────────
function TicketCard({ ticket }: { ticket: TicketListItem }) {
  const navigate = useNavigate();
  const esAprobacion = ticket.estado === 'Pendiente de Aprobación';
  const esEscalado   = ticket.estado === 'Escalado';

  return (
    <div
      onClick={() => navigate(`/tickets/${ticket.id}`)}
      className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md hover:border-blue-200 transition-all cursor-pointer group"
    >
      {/* Fila superior: prioridad + tipo + tiempo */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className="text-xs px-2 py-0.5 rounded-full font-semibold flex items-center gap-1"
            style={{ backgroundColor: ticket.prioridadColor + '20', color: ticket.prioridadColor }}
          >
            <ChevronDown className="h-3 w-3" />
            {ticket.prioridad}
          </span>
          {esAprobacion && (
            <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-purple-100 text-purple-700">
              APROBACIÓN
            </span>
          )}
          {esEscalado && (
            <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-red-100 text-red-700">
              ESCALADO
            </span>
          )}
          {!esAprobacion && !esEscalado && ticket.tecnicoAsignado && (
            <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-blue-100 text-blue-700">
              AGENTE
            </span>
          )}
          {!ticket.tecnicoAsignado && !esAprobacion && (
            <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-gray-100 text-gray-600">
              SIN ASIGNAR
            </span>
          )}
        </div>
        <span className="text-xs text-gray-400">{formatDistanceToNow(ticket.fechaCreacion)}</span>
      </div>

      {/* Título */}
      <h3 className="font-semibold text-gray-900 text-sm mb-1 line-clamp-2 group-hover:text-blue-600 transition-colors">
        {ticket.asunto}
      </h3>

      {/* Ruta de categoría */}
      <p className="text-xs text-gray-400 mb-3 truncate">
        {ticket.categoria}{ticket.subcategoria ? ` » ${ticket.subcategoria}` : ''}
      </p>

      {/* Barras SLA */}
      <div className="space-y-1.5 mb-3">
        <SlaBar
          label="F. Resp."
          fecha={ticket.fechaCreacion ? new Date(new Date(ticket.fechaCreacion).getTime() + 2 * 3600000).toISOString() : undefined}
          completada={!!ticket.fechaAsignacion}
        />
        <SlaBar label="Res." fecha={ticket.fechaLimiteSLA} fechaInicio={ticket.fechaCreacion} />
      </div>

      {/* Pie: agente + número */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-50">
        <div className="flex items-center gap-2 min-w-0">
          <Avatar nombre={ticket.tecnicoAsignado || ticket.usuarioCreador} />
          <span className="text-xs text-gray-600 truncate">
            {ticket.tecnicoAsignado || ticket.usuarioCreador}
          </span>
        </div>
        <span className="text-xs font-mono text-gray-400 flex-shrink-0 ml-2">{ticket.numero}</span>
      </div>
    </div>
  );
}

// ── Tarjeta de stat ──────────────────────────────────────────
function StatCard({
  count, label, active, onClick, color
}: {
  count: number; label: string; active: boolean;
  onClick: () => void; color: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 min-w-0 flex flex-col items-center gap-1 py-3 px-2 rounded-xl border-2 transition-all ${
        active
          ? `border-current ${color}`
          : 'border-transparent bg-white hover:bg-gray-50'
      }`}
    >
      <span className={`text-2xl font-bold ${active ? '' : 'text-gray-900'}`}>{count}</span>
      <span className={`text-xs font-medium text-center leading-tight ${active ? '' : 'text-gray-500'}`}>
        {label}
      </span>
    </button>
  );
}

// ── Panel derecho: Acciones pendientes ───────────────────────
function PanelAcciones() {
  const navigate = useNavigate();
  const { data: pendientes } = useQuery({
    queryKey: ['aprobaciones-pendientes'],
    queryFn: aprobacionesApi.getPendientes,
    refetchInterval: 30000,
  });

  if (!pendientes?.length) return null;

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <span className="bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
            {pendientes.length}
          </span>
          <span className="text-sm font-semibold text-gray-900">Acciones pendientes</span>
        </div>
        <button
          onClick={() => navigate('/aprobaciones')}
          className="text-xs text-blue-600 hover:underline flex items-center gap-1"
        >
          Ver todas <ArrowRight className="h-3 w-3" />
        </button>
      </div>
      <div className="divide-y divide-gray-50">
        {pendientes.slice(0, 4).map(ap => (
          <div key={ap.id} className="px-4 py-3 hover:bg-gray-50 transition">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-gray-800 truncate">{ap.asuntoTicket}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-purple-600 font-medium">Aprobación en {ap.numeroTicket}</span>
              <span className="text-xs text-gray-400">{formatDistanceToNow(ap.fechaCreacion)}</span>
            </div>
            <div className="flex gap-2 mt-2">
              <button
                onClick={e => { e.stopPropagation(); navigate('/aprobaciones'); }}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-green-50 py-1 text-xs font-medium text-green-700 transition hover:bg-green-100"
              >
                <Check className="h-3 w-3" />
                Aceptar
              </button>
              <button
                onClick={e => { e.stopPropagation(); navigate('/aprobaciones'); }}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-red-50 py-1 text-xs font-medium text-red-700 transition hover:bg-red-100"
              >
                <X className="h-3 w-3" />
                Rechazar
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Panel derecho: Vencimientos ──────────────────────────────
function PanelVencimientos({ tickets }: { tickets: TicketListItem[] }) {
  const navigate = useNavigate();
  const ahora = new Date();
  const en24h = new Date(ahora.getTime() + 24 * 3600000);

  const proximos = tickets.filter(t =>
    t.fechaLimiteSLA &&
    new Date(t.fechaLimiteSLA) <= en24h &&
    new Date(t.fechaLimiteSLA) >= ahora
  );

  if (!proximos.length) return null;

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <span className="bg-orange-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
            {proximos.length}
          </span>
          <span className="text-sm font-semibold text-gray-900">Vencimientos</span>
        </div>
        <Calendar className="h-4 w-4 text-gray-400" />
      </div>
      <div className="divide-y divide-gray-50">
        {proximos.slice(0, 4).map(t => {
          const diff = new Date(t.fechaLimiteSLA!).getTime() - ahora.getTime();
          const horas = Math.floor(diff / 3600000);
          const mins = Math.floor((diff % 3600000) / 60000);
          return (
            <div
              key={t.id}
              onClick={() => navigate(`/tickets/${t.id}`)}
              className="px-4 py-3 hover:bg-gray-50 transition cursor-pointer"
            >
              <p className="text-xs font-medium text-gray-800 truncate mb-1">{t.asunto}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">{t.numero}</span>
                <span className={`text-xs font-semibold ${horas < 2 ? 'text-red-600' : 'text-orange-500'}`}>
                  en {horas}h {mins}m
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Página principal ─────────────────────────────────────────
type FiltroActivo = 'todos' | 'esperando' | 'asignados' | 'sinAsignar' | 'aprobaciones';
type Vista = 'tarjetas' | 'lista';

export default function MiTrabajoPage() {
  const navigate = useNavigate();
  const { usuario } = useAuthStore();
  const [filtroActivo, setFiltroActivo] = useState<FiltroActivo>('todos');
  const [vista, setVista] = useState<Vista>('tarjetas');

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['mi-trabajo'],
    queryFn: ticketsApi.getMiTrabajo,
    refetchInterval: 30000,
    staleTime: 0,
  });

  const esStaff = !['Usuario'].includes(usuario?.rol ?? '');

  const ticketsFiltrados = (data?.ticketsRecientes ?? []).filter(t => {
    switch (filtroActivo) {
      case 'esperando':    return t.usuarioCreadorId === usuario?.id;
      case 'asignados':   return t.tecnicoAsignadoId === usuario?.id;
      case 'sinAsignar':  return !t.tecnicoAsignadoId;
      case 'aprobaciones': return t.estado === 'Pendiente de Aprobación';
      default: return true;
    }
  });

  const stats = [
    {
      key: 'esperando' as FiltroActivo,
      count: data?.esperandoPorMi ?? 0,
      label: 'Esperando\npor mí',
      color: 'text-blue-600 bg-blue-50 border-blue-300',
    },
    {
      key: 'asignados' as FiltroActivo,
      count: data?.asignadosAMi ?? 0,
      label: 'Asignados\na mí',
      color: 'text-green-600 bg-green-50 border-green-300',
    },
    {
      key: 'aprobaciones' as FiltroActivo,
      count: data?.aprobacionesPendientes ?? 0,
      label: 'Aprobaciones',
      color: 'text-purple-600 bg-purple-50 border-purple-300',
    },
    ...(esStaff ? [{
      key: 'sinAsignar' as FiltroActivo,
      count: data?.sinAsignar ?? 0,
      label: 'Sin asignar',
      color: 'text-gray-600 bg-gray-100 border-gray-300',
    }] : []),
  ];

  return (
    <div className="flex gap-5 h-full">
      {/* ── Contenido principal ─────────────────────────────── */}
      <div className="flex-1 min-w-0 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">Mi Trabajo</h1>
            <p className="text-[13px] text-gray-500 mt-0.5">
              Hola, {usuario?.nombre} — {new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => refetch()}
              className={`p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition ${isFetching ? 'animate-spin' : ''}`}
            >
              <RefreshCw className="h-4 w-4" />
            </button>
            <button
              onClick={() => navigate('/tickets/nuevo')}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-2 rounded-lg transition text-[13px] font-medium shadow-sm"
            >
              <Plus className="h-4 w-4" />
              Nueva Solicitud
            </button>
          </div>
        </div>

        {/* Barra de stats */}
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-2 flex gap-1">
          <StatCard
            count={data?.totalActivos ?? 0}
            label="Total activos"
            active={filtroActivo === 'todos'}
            onClick={() => setFiltroActivo('todos')}
            color="text-gray-700 bg-white border-gray-300"
          />
          {stats.map(s => (
            <StatCard
              key={s.key}
              count={s.count}
              label={s.label}
              active={filtroActivo === s.key}
              onClick={() => setFiltroActivo(s.key)}
              color={s.color}
            />
          ))}
          {/* Vencimientos — solo informativo */}
          <div className="flex-1 min-w-0 flex flex-col items-center gap-1 py-3 px-2 rounded-xl border-2 border-transparent">
            <div className="flex items-center gap-1">
              <span className="text-2xl font-bold text-orange-500">{data?.vencimientosProximos ?? 0}</span>
              {(data?.vencimientosProximos ?? 0) > 0 && <Zap className="h-4 w-4 text-orange-400" />}
            </div>
            <span className="text-xs font-medium text-gray-500 text-center leading-tight">Vencen en 24h</span>
          </div>
        </div>

        {/* Toolbar: toggle vista */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">
            {ticketsFiltrados.length} ticket{ticketsFiltrados.length !== 1 ? 's' : ''}
          </span>
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setVista('tarjetas')}
              className={`p-1.5 rounded-md transition ${vista === 'tarjetas' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setVista('lista')}
              className={`p-1.5 rounded-md transition ${vista === 'lista' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Contenido */}
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : ticketsFiltrados.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center">
            <CheckSquare className="h-12 w-12 text-green-300 mb-3" />
            <p className="text-gray-500 font-medium">¡Todo al día!</p>
            <p className="text-gray-400 text-sm mt-1">No hay tickets en esta categoría</p>
          </div>
        ) : vista === 'tarjetas' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {ticketsFiltrados.map(t => <TicketCard key={t.id} ticket={t} />)}
          </div>
        ) : (
          /* Vista lista compacta */
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">TICKET</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">ASUNTO</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-4 py-3 hidden md:table-cell">PRIORIDAD</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">ESTADO</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-4 py-3 hidden lg:table-cell">AGENTE</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-4 py-3 hidden lg:table-cell">SLA</th>
                </tr>
              </thead>
              <tbody>
                {ticketsFiltrados.map(ticket => (
                  <tr
                    key={ticket.id}
                    onClick={() => navigate(`/tickets/${ticket.id}`)}
                    className="border-b border-gray-50 hover:bg-gray-50 transition cursor-pointer"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {ticket.slaVencido && <AlertTriangle className="h-3.5 w-3.5 text-red-500 flex-shrink-0" />}
                        <span className="text-sm font-medium text-blue-600 font-mono">{ticket.numero}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-gray-900 truncate max-w-xs">{ticket.asunto}</p>
                      <p className="text-xs text-gray-400">{ticket.categoria}{ticket.subcategoria ? ` » ${ticket.subcategoria}` : ''}</p>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span
                        className="text-xs px-2 py-1 rounded-full font-medium"
                        style={{ backgroundColor: ticket.prioridadColor + '20', color: ticket.prioridadColor }}
                      >
                        {ticket.prioridad}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="text-xs px-2 py-1 rounded-full font-medium"
                        style={{ backgroundColor: ticket.estadoColor + '20', color: ticket.estadoColor }}
                      >
                        {ticket.estado}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      {ticket.tecnicoAsignado ? (
                        <div className="flex items-center gap-2">
                          <Avatar nombre={ticket.tecnicoAsignado} />
                          <span className="text-xs text-gray-600 truncate max-w-28">{ticket.tecnicoAsignado}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400 italic">Sin asignar</span>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      {ticket.fechaLimiteSLA ? (
                        <span className={`text-xs font-medium ${ticket.slaVencido ? 'text-red-600' : 'text-gray-600'}`}>
                          {formatDistanceToNow(ticket.fechaLimiteSLA)}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-300">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Panel derecho ────────────────────────────────────── */}
      <div className="w-72 flex-shrink-0 space-y-4 hidden xl:block">
        <PanelAcciones />
        <PanelVencimientos tickets={data?.ticketsRecientes ?? []} />

        {/* Acceso rápido */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Acceso rápido</p>
          {[
            { label: 'Cola de asignación', path: '/cola-asignacion', icon: Inbox, color: 'text-blue-600', roles: ['Agente','Supervisor','Administrador'] },
            { label: 'Aprobaciones',       path: '/aprobaciones',    icon: CheckSquare, color: 'text-purple-600', roles: ['Administrador','Supervisor','Aprobador'] },
            { label: 'Mis tickets',        path: '/tickets',         icon: List, color: 'text-gray-600', roles: [] },
          ].filter(item => item.roles.length === 0 || item.roles.includes(usuario?.rol ?? '')).map(item => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition text-left"
            >
              <item.icon className={`h-4 w-4 ${item.color}`} />
              <span className="text-sm text-gray-700">{item.label}</span>
              <ArrowRight className="h-3.5 w-3.5 text-gray-300 ml-auto" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
