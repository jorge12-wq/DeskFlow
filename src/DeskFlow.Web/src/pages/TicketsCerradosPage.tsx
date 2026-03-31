import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Archive, Search, CheckCircle, Clock, CalendarRange, Filter } from 'lucide-react';
import { ticketsApi } from '../api/tickets';
import { catalogosApi } from '../api/dashboard';
import { useAuthStore } from '../store/authStore';
import type { TicketFilter } from '../types';
import { formatDistanceToNow } from '../utils/date';

const ROLES_ADMIN_SUP = ['Administrador', 'Supervisor'];

export default function TicketsCerradosPage() {
  const navigate = useNavigate();
  const { usuario } = useAuthStore();
  const esAdminOSup = ROLES_ADMIN_SUP.includes(usuario?.rol ?? '');
  const esAgente = usuario?.rol === 'Agente';

  const [filter, setFilter] = useState<TicketFilter>({
    page: 1,
    pageSize: 20,
    soloFinales: true,
    ordenarPor: 'FechaCreacion',
    direccion: 'desc',
  });
  const [busqueda, setBusqueda] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['tickets-cerrados', filter],
    queryFn: () => ticketsApi.getAll(filter),
  });

  const { data: prioridades } = useQuery({
    queryKey: ['prioridades'],
    queryFn: catalogosApi.getPrioridades,
  });

  const { data: categorias } = useQuery({
    queryKey: ['categorias'],
    queryFn: catalogosApi.getCategorias,
  });

  const { data: areas } = useQuery({
    queryKey: ['areas'],
    queryFn: catalogosApi.getAreas,
    enabled: esAdminOSup,
  });

  // Stats from current results
  const items = data?.items ?? [];
  const total = data?.total ?? 0;

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const inicioSemana = new Date(hoy);
  inicioSemana.setDate(hoy.getDate() - hoy.getDay());

  const cerradosHoy = items.filter(t => {
    const fecha = t.fechaCierre ?? t.fechaResolucion;
    return fecha && new Date(fecha) >= hoy;
  }).length;

  const cerradosSemana = items.filter(t => {
    const fecha = t.fechaCierre ?? t.fechaResolucion;
    return fecha && new Date(fecha) >= inicioSemana;
  }).length;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setFilter(f => ({ ...f, busqueda: busqueda || undefined, page: 1 }));
  };

  const setF = (partial: Partial<TicketFilter>) =>
    setFilter(f => ({ ...f, ...partial, page: 1 }));

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Archive className="text-gray-500" size={22} /> Tickets Cerrados
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {esAgente ? 'Tickets cerrados de tu área' : esAdminOSup ? 'Todos los tickets cerrados' : 'Tus tickets cerrados'}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
            <Archive size={18} className="text-gray-500" />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{total}</div>
            <div className="text-xs text-gray-500">Total cerrados</div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
            <CheckCircle size={18} className="text-emerald-500" />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{cerradosHoy}</div>
            <div className="text-xs text-gray-500">Cerrados hoy</div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
            <CalendarRange size={18} className="text-blue-500" />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{cerradosSemana}</div>
            <div className="text-xs text-gray-500">Esta semana</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <Filter size={14} /> Filtros
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <form onSubmit={handleSearch} className="flex gap-2 sm:col-span-2 lg:col-span-2">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
                placeholder="Buscar por número, asunto..."
                className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <button type="submit" className="px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 transition">
              Buscar
            </button>
          </form>

          {/* Prioridad */}
          <select
            value={filter.prioridadId ?? ''}
            onChange={e => setF({ prioridadId: e.target.value || undefined })}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          >
            <option value="">Todas las prioridades</option>
            {prioridades?.map(p => (
              <option key={p.id} value={p.id}>{p.nombre}</option>
            ))}
          </select>

          {/* Categoría */}
          <select
            value={filter.categoriaId ?? ''}
            onChange={e => setF({ categoriaId: e.target.value || undefined })}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          >
            <option value="">Todas las categorías</option>
            {categorias?.map(c => (
              <option key={c.id} value={c.id}>{c.nombre}</option>
            ))}
          </select>

          {/* Área — solo admin/supervisor */}
          {esAdminOSup && (
            <select
              value={filter.areaId ?? ''}
              onChange={e => setF({ areaId: e.target.value || undefined })}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="">Todas las áreas</option>
              {areas?.filter(a => a.helpDeskId).map(a => (
                <option key={a.id} value={a.id}>{a.nombre}</option>
              ))}
            </select>
          )}

          {/* Fecha desde */}
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500 whitespace-nowrap">Desde</label>
            <input
              type="date"
              value={filter.fechaDesde ?? ''}
              onChange={e => setF({ fechaDesde: e.target.value || undefined })}
              className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Fecha hasta */}
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500 whitespace-nowrap">Hasta</label>
            <input
              type="date"
              value={filter.fechaHasta ?? ''}
              onChange={e => setF({ fechaHasta: e.target.value || undefined })}
              className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Limpiar */}
          <button
            onClick={() => {
              setBusqueda('');
              setFilter({ page: 1, pageSize: 20, soloFinales: true, ordenarPor: 'FechaCreacion', direccion: 'desc' });
            }}
            className="px-3 py-2 text-gray-500 border border-gray-200 rounded-lg text-sm hover:bg-gray-50 transition"
          >
            Limpiar filtros
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="text-center py-12 text-gray-400 text-sm">Cargando...</div>
        ) : items.length === 0 ? (
          <div className="text-center py-12">
            <Archive size={36} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">No hay tickets cerrados</p>
            <p className="text-gray-400 text-sm mt-1">Los tickets finalizados aparecerán aquí</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Número</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Asunto</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Categoría</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Solicitante</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Técnico</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Estado</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Prioridad</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden xl:table-cell">Cerrado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {items.map(t => {
                    const fechaCierre = t.fechaCierre ?? t.fechaResolucion;
                    return (
                      <tr
                        key={t.id}
                        onClick={() => navigate(`/tickets/${t.id}`)}
                        className="hover:bg-gray-50 cursor-pointer transition"
                      >
                        <td className="px-4 py-3">
                          <span className="font-mono text-xs text-gray-400">{t.numero}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-gray-800 font-medium line-clamp-1">{t.asunto}</span>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <span className="text-gray-500 text-xs">{t.categoria}</span>
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell">
                          <span className="text-gray-600 text-xs">{t.usuarioCreador}</span>
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell">
                          <span className="text-gray-600 text-xs">{t.tecnicoAsignado ?? '—'}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium"
                            style={{ backgroundColor: t.estadoColor + '20', color: t.estadoColor }}
                          >
                            <CheckCircle size={10} /> {t.estado}
                          </span>
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell">
                          <span
                            className="text-xs px-2 py-0.5 rounded-full font-medium"
                            style={{ backgroundColor: t.prioridadColor + '20', color: t.prioridadColor }}
                          >
                            {t.prioridad}
                          </span>
                        </td>
                        <td className="px-4 py-3 hidden xl:table-cell">
                          {fechaCierre ? (
                            <div className="flex items-center gap-1 text-xs text-gray-400">
                              <Clock size={10} />
                              {formatDistanceToNow(fechaCierre)}
                            </div>
                          ) : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {data && data.totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                <span className="text-xs text-gray-400">
                  Mostrando {(filter.page! - 1) * filter.pageSize! + 1}–{Math.min(filter.page! * filter.pageSize!, data.total)} de {data.total}
                </span>
                <div className="flex gap-1">
                  <button
                    disabled={filter.page === 1}
                    onClick={() => setFilter(f => ({ ...f, page: (f.page ?? 1) - 1 }))}
                    className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 transition"
                  >
                    Anterior
                  </button>
                  <button
                    disabled={filter.page === data.totalPages}
                    onClick={() => setFilter(f => ({ ...f, page: (f.page ?? 1) + 1 }))}
                    className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 transition"
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
