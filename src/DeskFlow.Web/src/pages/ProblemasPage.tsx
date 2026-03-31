import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Plus, Search, Bug, ChevronRight, Link } from 'lucide-react';
import { problemasApi } from '../api/problemas';
import { useAuthStore } from '../store/authStore';
import type { ProblemaListItem } from '../types';

const ROLES_STAFF = ['Administrador', 'Supervisor', 'Agente'];

export default function ProblemasPage() {
  const navigate = useNavigate();
  const { usuario } = useAuthStore();
  const [tab, setTab] = useState<'todos' | 'errores'>('todos');
  const [search, setSearch] = useState('');

  const esStaff = ROLES_STAFF.includes(usuario?.rol ?? '');

  const { data: problemas = [], isLoading } = useQuery({
    queryKey: ['problemas', tab],
    queryFn: () => problemasApi.getAll(tab === 'errores' ? { soloErroresConocidos: true } : undefined),
    refetchInterval: 30000,
  });

  const filtrados = problemas.filter(p =>
    p.titulo.toLowerCase().includes(search.toLowerCase()) ||
    p.numero.toLowerCase().includes(search.toLowerCase())
  );

  const enInvestigacion = problemas.filter(p => p.estadoNombre === 'En Investigación').length;
  const erroresConocidos = problemas.filter(p => p.esErrorConocido).length;
  const resueltos = problemas.filter(p => p.estadoNombre === 'Resuelto' || p.estadoNombre === 'Cerrado').length;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <AlertTriangle className="text-orange-500" size={24} />
            Problem Management
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Identificá, analizá y resolvé causas raíz que afectan múltiples incidentes
          </p>
        </div>
        {esStaff && (
          <button
            onClick={() => navigate('/problemas/nuevo')}
            className="flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium"
          >
            <Plus size={16} />
            Nuevo Problema
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total', value: problemas.length, bg: 'bg-gray-100', text: 'text-gray-700' },
          { label: 'En Investigación', value: enInvestigacion, bg: 'bg-blue-50', text: 'text-blue-700' },
          { label: 'Errores Conocidos', value: erroresConocidos, bg: 'bg-yellow-50', text: 'text-yellow-700' },
          { label: 'Resueltos', value: resueltos, bg: 'bg-green-50', text: 'text-green-700' },
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
            ['todos', 'Todos los problemas'],
            ['errores', 'Errores Conocidos'],
          ] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                tab === key ? 'bg-white shadow text-gray-900' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {label}
              {key === 'errores' && erroresConocidos > 0 && (
                <span className="ml-2 bg-yellow-100 text-yellow-700 text-xs px-1.5 py-0.5 rounded-full">
                  {erroresConocidos}
                </span>
              )}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={14} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar problemas..."
            className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 w-64"
          />
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="text-center py-12 text-gray-400">Cargando...</div>
      ) : filtrados.length === 0 ? (
        <div className="text-center py-12">
          <Bug size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">No hay problemas registrados</p>
          {tab === 'errores' && (
            <p className="text-sm text-gray-400 mt-1">Los errores conocidos aparecerán aquí</p>
          )}
          {esStaff && tab === 'todos' && (
            <button
              onClick={() => navigate('/problemas/nuevo')}
              className="mt-4 text-sm text-orange-600 hover:text-orange-700 font-medium"
            >
              Crear el primer problema
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filtrados.map(p => (
            <ProblemaRow key={p.id} problema={p} onClick={() => navigate(`/problemas/${p.id}`)} />
          ))}
        </div>
      )}
    </div>
  );
}

function ProblemaRow({ problema: p, onClick }: { problema: ProblemaListItem; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className="bg-white border border-gray-200 rounded-xl p-4 hover:border-orange-300 hover:shadow-sm cursor-pointer transition-all flex items-center gap-4"
    >
      <span
        className="text-xs font-semibold px-2.5 py-1 rounded-full text-white shrink-0"
        style={{ backgroundColor: p.estadoColor }}
      >
        {p.estadoNombre}
      </span>

      <span className="text-xs text-gray-400 font-mono shrink-0 w-24">{p.numero}</span>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-900 truncate">{p.titulo}</span>
          {p.esErrorConocido && (
            <span className="shrink-0 bg-yellow-100 text-yellow-700 text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
              <Bug size={10} /> Error Conocido
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-500">
          {p.categoriaNombre && <span>{p.categoriaNombre}</span>}
          {p.responsableNombre && <span>· {p.responsableNombre}</span>}
          <span>· {new Date(p.fechaCreacion).toLocaleDateString('es-AR')}</span>
        </div>
      </div>

      <div className="flex items-center gap-1 text-sm text-gray-500 shrink-0">
        <Link size={13} />
        <span>{p.incidentesCount} incidente{p.incidentesCount !== 1 ? 's' : ''}</span>
      </div>

      <span
        className="text-xs font-medium px-2 py-0.5 rounded-full text-white shrink-0"
        style={{ backgroundColor: p.prioridadColor }}
      >
        {p.prioridadNombre}
      </span>

      <ChevronRight size={16} className="text-gray-400 shrink-0" />
    </div>
  );
}
