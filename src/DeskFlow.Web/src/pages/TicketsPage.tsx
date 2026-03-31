import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Plus, Search, Filter, AlertTriangle, Info, Inbox, ClipboardList } from 'lucide-react';
import { ticketsApi } from '../api/tickets';
import { catalogosApi } from '../api/dashboard';
import { useAuthStore } from '../store/authStore';
import type { TicketFilter } from '../types';
import { formatDistanceToNow } from '../utils/date';

const rolContexto: Record<string, { label: string; desc: string; color: string }> = {
  Usuario:       { label: 'Mis tickets',        desc: 'Tickets que creaste',                     color: 'bg-blue-50 border-blue-200 text-blue-700' },
  Agente:        { label: 'Cola de trabajo',     desc: 'Tickets de mis áreas y mis asignados',    color: 'bg-green-50 border-green-200 text-green-700' },
  Supervisor:    { label: 'Todos los tickets',  desc: 'Vista completa del equipo',               color: 'bg-purple-50 border-purple-200 text-purple-700' },
  Administrador: { label: 'Todos los tickets',  desc: 'Vista completa del sistema',              color: 'bg-gray-50 border-gray-200 text-gray-700' },
  Aprobador:     { label: 'Tickets a aprobar',  desc: 'Tickets con solicitud de aprobación',     color: 'bg-amber-50 border-amber-200 text-amber-700' },
  Observador:    { label: 'Vista general',       desc: 'Acceso de solo lectura',                  color: 'bg-slate-50 border-slate-200 text-slate-700' },
};

type TabTecnico = 'cola' | 'mis';

export default function TicketsPage() {
  const navigate = useNavigate();
  const { usuario } = useAuthStore();
  const [filter, setFilter] = useState<TicketFilter>({ page: 1, pageSize: 20 });
  const [busqueda, setBusqueda] = useState('');
  const [tabTecnico, setTabTecnico] = useState<TabTecnico>('cola');
  const ctx = rolContexto[usuario?.rol ?? ''];
  const esAgente = usuario?.rol === 'Agente';

  const filterEfectivo: TicketFilter = esAgente
    ? tabTecnico === 'cola'
      ? { ...filter, soloSinAsignar: true, tecnicoId: undefined }
      : { ...filter, tecnicoId: usuario?.id, soloSinAsignar: undefined }
    : filter;

  const { data, isLoading } = useQuery({
    queryKey: ['tickets', filterEfectivo],
    queryFn: () => ticketsApi.getAll(filterEfectivo),
  });

  const { data: estados } = useQuery({
    queryKey: ['estados'],
    queryFn: catalogosApi.getEstados,
  });

  const { data: prioridades } = useQuery({
    queryKey: ['prioridades'],
    queryFn: catalogosApi.getPrioridades,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setFilter(f => ({ ...f, busqueda, page: 1 }));
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">Tickets</h1>
          <p className="text-gray-500 text-[13px] mt-0.5">{data?.total ?? 0} tickets · {ctx?.label ?? 'Vista general'}</p>
        </div>
        <button
          onClick={() => navigate('/tickets/nuevo')}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-2 rounded-lg transition text-[13px] font-medium shadow-sm"
        >
          <Plus className="h-4 w-4" />
          Nuevo Ticket
        </button>
      </div>

      {/* Role context banner */}
      {ctx && (
        <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-[13px] ${ctx.color}`}>
          <Info className="h-3.5 w-3.5 flex-shrink-0" />
          <span><strong>{ctx.label}</strong> — {ctx.desc}</span>
        </div>
      )}

      {/* Tabs para Técnico */}
      {esAgente && (
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => { setTabTecnico('cola'); setFilter(f => ({ ...f, page: 1 })); }}
            className={`flex items-center gap-2 px-4 py-2.5 text-[13px] font-medium border-b-2 transition ${
              tabTecnico === 'cola'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Inbox className="h-3.5 w-3.5" />
            Cola de tickets
          </button>
          <button
            onClick={() => { setTabTecnico('mis'); setFilter(f => ({ ...f, page: 1 })); }}
            className={`flex items-center gap-2 px-4 py-2.5 text-[13px] font-medium border-b-2 transition ${
              tabTecnico === 'mis'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <ClipboardList className="h-3.5 w-3.5" />
            Mis tickets
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 flex flex-wrap gap-2.5 items-center">
        <form onSubmit={handleSearch} className="flex-1 min-w-48 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <input
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              placeholder="Buscar por número o asunto..."
              className="w-full pl-9 pr-4 py-1.5 border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white transition"
            />
          </div>
          <button type="submit" className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg transition">
            <Search className="h-3.5 w-3.5 text-gray-500" />
          </button>
        </form>

        <select
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 text-gray-700"
          value={filter.estadoId || ''}
          onChange={e => setFilter(f => ({ ...f, estadoId: e.target.value || undefined, page: 1 }))}
        >
          <option value="">Todos los estados</option>
          {estados?.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
        </select>

        <select
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 text-gray-700"
          value={filter.prioridadId || ''}
          onChange={e => setFilter(f => ({ ...f, prioridadId: e.target.value || undefined, page: 1 }))}
        >
          <option value="">Todas las prioridades</option>
          {prioridades?.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
        </select>

        {(filter.estadoId || filter.prioridadId || filter.busqueda) && (
          <button
            onClick={() => { setFilter({ page: 1, pageSize: 20 }); setBusqueda(''); }}
            className="text-[12px] text-gray-500 hover:text-gray-700 flex items-center gap-1 px-2 py-1.5 hover:bg-gray-100 rounded-lg transition"
          >
            <Filter className="h-3.5 w-3.5" /> Limpiar filtros
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600" />
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/70">
                <th className="text-left text-[11px] font-semibold text-gray-400 px-4 py-2.5 uppercase tracking-wider">Ticket</th>
                <th className="text-left text-[11px] font-semibold text-gray-400 px-4 py-2.5 uppercase tracking-wider">Asunto</th>
                <th className="text-left text-[11px] font-semibold text-gray-400 px-4 py-2.5 uppercase tracking-wider hidden md:table-cell">Prioridad</th>
                <th className="text-left text-[11px] font-semibold text-gray-400 px-4 py-2.5 uppercase tracking-wider">Estado</th>
                <th className="text-left text-[11px] font-semibold text-gray-400 px-4 py-2.5 uppercase tracking-wider hidden lg:table-cell">Técnico</th>
                <th className="text-left text-[11px] font-semibold text-gray-400 px-4 py-2.5 uppercase tracking-wider hidden lg:table-cell">Creado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data?.items.map(ticket => (
                <tr key={ticket.id} className="hover:bg-blue-50/40 transition cursor-pointer group"
                  onClick={() => navigate(`/tickets/${ticket.id}`)}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {ticket.slaVencido && <AlertTriangle className="h-3.5 w-3.5 text-red-500 flex-shrink-0" />}
                      <span className="text-[13px] font-semibold text-blue-600 font-mono group-hover:text-blue-700">{ticket.numero}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 max-w-0">
                    <p className="text-[13px] text-gray-800 truncate font-medium">{ticket.asunto}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5 truncate">{ticket.categoria}</p>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span
                      className="text-[11px] px-2 py-0.5 rounded-full font-semibold"
                      style={{ backgroundColor: ticket.prioridadColor + '20', color: ticket.prioridadColor }}
                    >
                      {ticket.prioridad}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="text-[11px] px-2 py-0.5 rounded-full font-semibold"
                      style={{ backgroundColor: ticket.estadoColor + '20', color: ticket.estadoColor }}
                    >
                      {ticket.estado}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <span className="text-[13px] text-gray-600">{ticket.tecnicoAsignado || <span className="text-gray-400 italic">Sin asignar</span>}</span>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <span className="text-[12px] text-gray-400">{formatDistanceToNow(ticket.fechaCreacion)}</span>
                  </td>
                </tr>
              ))}
              {!data?.items.length && (
                <tr>
                  <td colSpan={6} className="text-center text-gray-400 py-14 text-[13px]">
                    No hay tickets para mostrar
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50/50">
            <p className="text-[12px] text-gray-500">
              Mostrando {((filter.page! - 1) * filter.pageSize!) + 1}–{Math.min(filter.page! * filter.pageSize!, data.total)} de {data.total}
            </p>
            <div className="flex gap-1">
              <button
                disabled={filter.page === 1}
                onClick={() => setFilter(f => ({ ...f, page: (f.page || 1) - 1 }))}
                className="px-3 py-1.5 text-[12px] border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-white transition font-medium text-gray-600"
              >Anterior</button>
              <button
                disabled={filter.page === data.totalPages}
                onClick={() => setFilter(f => ({ ...f, page: (f.page || 1) + 1 }))}
                className="px-3 py-1.5 text-[12px] border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-white transition font-medium text-gray-600"
              >Siguiente</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
