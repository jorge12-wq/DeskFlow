import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { GitMerge, Plus, Search, Calendar, List, Clock, ChevronRight, AlertCircle } from 'lucide-react';
import { cambiosApi } from '../api/cambios';
import { useAuthStore } from '../store/authStore';
import type { CambioListItem, CambioCalendarioItem } from '../types';

const ROLES_STAFF = ['Administrador', 'Supervisor', 'Agente'];

const RIESGO_COLOR: Record<string, string> = {
  'Bajo': 'bg-green-100 text-green-700',
  'Medio': 'bg-yellow-100 text-yellow-700',
  'Alto': 'bg-orange-100 text-orange-700',
  'Crítico': 'bg-red-100 text-red-700',
};

export default function CambiosPage() {
  const navigate = useNavigate();
  const { usuario } = useAuthStore();
  const [vista, setVista] = useState<'lista' | 'calendario'>('lista');
  const [tab, setTab] = useState<'todos' | 'pendiente-cab' | 'en-impl' | 'cerrados'>('todos');
  const [search, setSearch] = useState('');

  const esStaff = ROLES_STAFF.includes(usuario?.rol ?? '');

  const estadoFiltro: Record<string, string | undefined> = {
    'todos': undefined,
    'pendiente-cab': 'Enviado a CAB',
    'en-impl': 'En Implementación',
    'cerrados': 'Cerrado',
  };

  const { data: cambios = [], isLoading } = useQuery({
    queryKey: ['cambios', tab],
    queryFn: () => cambiosApi.getAll({ estado: estadoFiltro[tab] }),
    refetchInterval: 30000,
  });

  const now = new Date();
  const { data: calendario = [] } = useQuery({
    queryKey: ['cambios-calendario'],
    queryFn: () => cambiosApi.getCalendario(
      new Date(now.getFullYear(), now.getMonth(), 1).toISOString(),
      new Date(now.getFullYear(), now.getMonth() + 3, 0).toISOString(),
    ),
    enabled: vista === 'calendario',
  });

  const filtrados = cambios.filter(c =>
    c.titulo.toLowerCase().includes(search.toLowerCase()) ||
    c.numero.toLowerCase().includes(search.toLowerCase())
  );

  const pendienteCAB = cambios.filter(c => c.aprobadoresPendientes > 0).length;
  const enImpl = cambios.filter(c => c.estadoNombre === 'En Implementación').length;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <GitMerge className="text-purple-500" size={24} />
            Change Management
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Gestioná los RFC, aprobaciones CAB y el calendario de implementaciones
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button onClick={() => setVista('lista')}
              className={`p-1.5 rounded-md transition-colors ${vista === 'lista' ? 'bg-white shadow' : 'text-gray-500 hover:text-gray-700'}`}>
              <List size={16} />
            </button>
            <button onClick={() => setVista('calendario')}
              className={`p-1.5 rounded-md transition-colors ${vista === 'calendario' ? 'bg-white shadow' : 'text-gray-500 hover:text-gray-700'}`}>
              <Calendar size={16} />
            </button>
          </div>
          {esStaff && (
            <button
              onClick={() => navigate('/cambios/nuevo')}
              className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
            >
              <Plus size={16} /> Nuevo RFC
            </button>
          )}
        </div>
      </div>

      {vista === 'lista' && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Total RFCs', value: cambios.length, bg: 'bg-gray-100', text: 'text-gray-700' },
              { label: 'Pendientes CAB', value: pendienteCAB, bg: 'bg-blue-50', text: 'text-blue-700' },
              { label: 'En Implementación', value: enImpl, bg: 'bg-purple-50', text: 'text-purple-700' },
              { label: 'Cerrados', value: cambios.filter(c => c.estadoEsFinal).length, bg: 'bg-gray-50', text: 'text-gray-600' },
            ].map(s => (
              <div key={s.label} className={`rounded-xl p-4 ${s.bg}`}>
                <div className={`text-2xl font-bold ${s.text}`}>{s.value}</div>
                <div className={`text-sm mt-1 ${s.text}`}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Tabs + Search */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
              {([
                ['todos', 'Todos'],
                ['pendiente-cab', 'Pendiente CAB'],
                ['en-impl', 'En Implementación'],
                ['cerrados', 'Cerrados'],
              ] as const).map(([key, label]) => (
                <button key={key} onClick={() => setTab(key)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    tab === key ? 'bg-white shadow text-gray-900' : 'text-gray-600 hover:text-gray-900'
                  }`}>
                  {label}
                  {key === 'pendiente-cab' && pendienteCAB > 0 && (
                    <span className="ml-1.5 bg-blue-100 text-blue-700 text-xs px-1.5 py-0.5 rounded-full">{pendienteCAB}</span>
                  )}
                </button>
              ))}
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-gray-400" size={14} />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar cambios..."
                className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 w-60"
              />
            </div>
          </div>

          {/* List */}
          {isLoading ? (
            <div className="text-center py-12 text-gray-400">Cargando...</div>
          ) : filtrados.length === 0 ? (
            <div className="text-center py-12">
              <GitMerge size={48} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500 font-medium">No hay RFCs registrados</p>
              {esStaff && (
                <button onClick={() => navigate('/cambios/nuevo')}
                  className="mt-4 text-sm text-purple-600 hover:text-purple-700 font-medium">
                  Crear el primer RFC
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {filtrados.map(c => (
                <CambioRow key={c.id} cambio={c} onClick={() => navigate(`/cambios/${c.id}`)} />
              ))}
            </div>
          )}
        </>
      )}

      {vista === 'calendario' && (
        <CalendarioView items={calendario} onClickItem={id => navigate(`/cambios/${id}`)} />
      )}
    </div>
  );
}

function CambioRow({ cambio: c, onClick }: { cambio: CambioListItem; onClick: () => void }) {
  return (
    <div onClick={onClick}
      className="bg-white border border-gray-200 rounded-xl p-4 hover:border-purple-300 hover:shadow-sm cursor-pointer transition-all flex items-center gap-4">
      {/* Tipo badge */}
      <span className="text-xs font-semibold px-2.5 py-1 rounded-full text-white shrink-0"
        style={{ backgroundColor: c.tipoColor }}>{c.tipoNombre}</span>

      {/* Estado */}
      <span className="text-xs font-semibold px-2 py-0.5 rounded-full text-white shrink-0"
        style={{ backgroundColor: c.estadoColor }}>{c.estadoNombre}</span>

      <span className="text-xs text-gray-400 font-mono shrink-0 w-24">{c.numero}</span>

      <div className="flex-1 min-w-0">
        <div className="font-medium text-gray-900 truncate">{c.titulo}</div>
        <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-500">
          <span>{c.solicitanteNombre}</span>
          {c.implementadorNombre && <span>· Impl: {c.implementadorNombre}</span>}
          {c.fechaInicioPlaneado && (
            <span className="flex items-center gap-1">
              <Clock size={10} />
              {new Date(c.fechaInicioPlaneado).toLocaleDateString('es-AR')}
            </span>
          )}
        </div>
      </div>

      {c.aprobadoresPendientes > 0 && (
        <span className="shrink-0 bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
          <AlertCircle size={10} /> {c.aprobadoresPendientes} voto{c.aprobadoresPendientes !== 1 ? 's' : ''} pendiente{c.aprobadoresPendientes !== 1 ? 's' : ''}
        </span>
      )}

      <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${RIESGO_COLOR[c.riesgo] ?? 'bg-gray-100 text-gray-600'}`}>
        {c.riesgo}
      </span>

      <ChevronRight size={16} className="text-gray-400 shrink-0" />
    </div>
  );
}

function CalendarioView({ items, onClickItem }: { items: CambioCalendarioItem[]; onClickItem: (id: string) => void }) {
  if (items.length === 0) {
    return (
      <div className="text-center py-16">
        <Calendar size={48} className="mx-auto text-gray-300 mb-3" />
        <p className="text-gray-500 font-medium">No hay cambios planeados en los próximos 3 meses</p>
      </div>
    );
  }

  // Group by week
  const grouped = items.reduce((acc, item) => {
    if (!item.fechaInicioPlaneado) return acc;
    const d = new Date(item.fechaInicioPlaneado);
    const week = `${d.getFullYear()}-W${getWeekNumber(d)}`;
    if (!acc[week]) acc[week] = { label: getWeekLabel(d), items: [] };
    acc[week].items.push(item);
    return acc;
  }, {} as Record<string, { label: string; items: CambioCalendarioItem[] }>);

  return (
    <div className="space-y-6">
      {Object.entries(grouped).map(([week, { label, items: weekItems }]) => (
        <div key={week}>
          <div className="flex items-center gap-3 mb-3">
            <div className="text-sm font-semibold text-gray-500">{label}</div>
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400">{weekItems.length} cambio{weekItems.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="space-y-2">
            {weekItems.map(item => (
              <div key={item.id} onClick={() => onClickItem(item.id)}
                className="bg-white border border-gray-200 rounded-xl p-4 hover:border-purple-300 hover:shadow-sm cursor-pointer transition-all flex items-center gap-4">
                <div className="w-12 text-center shrink-0">
                  <div className="text-lg font-bold text-gray-700">
                    {new Date(item.fechaInicioPlaneado!).getDate()}
                  </div>
                  <div className="text-xs text-gray-400">
                    {new Date(item.fechaInicioPlaneado!).toLocaleString('es-AR', { month: 'short' })}
                  </div>
                </div>
                <div className="w-px h-10 bg-gray-200 shrink-0" />
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full text-white shrink-0"
                  style={{ backgroundColor: item.tipoColor }}>{item.tipoNombre}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 truncate">{item.titulo}</div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {item.numero}
                    {item.implementadorNombre && ` · ${item.implementadorNombre}`}
                    {item.fechaFinPlaneado && ` · hasta ${new Date(item.fechaFinPlaneado).toLocaleDateString('es-AR')}`}
                  </div>
                </div>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${RIESGO_COLOR[item.riesgo] ?? 'bg-gray-100 text-gray-600'}`}>
                  {item.riesgo}
                </span>
                <span className="text-xs text-white px-2 py-0.5 rounded-full shrink-0"
                  style={{ backgroundColor: item.estadoColor }}>{item.estadoNombre}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function getWeekNumber(d: Date) {
  const oneJan = new Date(d.getFullYear(), 0, 1);
  return Math.ceil(((d.getTime() - oneJan.getTime()) / 86400000 + oneJan.getDay() + 1) / 7);
}

function getWeekLabel(d: Date) {
  const start = new Date(d);
  start.setDate(d.getDate() - d.getDay() + 1);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return `Semana del ${start.toLocaleDateString('es-AR', { day: 'numeric', month: 'long' })} al ${end.toLocaleDateString('es-AR', { day: 'numeric', month: 'long' })}`;
}
