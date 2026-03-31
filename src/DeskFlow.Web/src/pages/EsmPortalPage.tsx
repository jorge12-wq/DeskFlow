import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Building2, ChevronRight, Plus, Search, Ticket, Users } from 'lucide-react';
import { helpdesksApi } from '../api/helpdesks';
import { useAuthStore } from '../store/authStore';
import { TokenIcon } from '../lib/iconTokens';

export default function EsmPortalPage() {
  const navigate = useNavigate();
  const { usuario } = useAuthStore();
  const [search, setSearch] = useState('');

  const { data: helpdesks = [], isLoading } = useQuery({
    queryKey: ['helpdesks'],
    queryFn: helpdesksApi.getAll,
  });

  const esAdmin = ['Administrador', 'Supervisor'].includes(usuario?.rol ?? '');

  const visibles = helpdesks.filter(hd =>
    hd.activo &&
    hd.esPublico &&
    (hd.nombre.toLowerCase().includes(search.toLowerCase()) ||
      (hd.descripcion ?? '').toLowerCase().includes(search.toLowerCase())),
  );

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <section className="df-panel rounded-[1.8rem] px-6 py-8 text-center sm:px-8">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-[1.4rem] bg-[linear-gradient(180deg,#1d4ed8,#0f172a)] text-white shadow-[0_18px_40px_-22px_rgba(29,78,216,0.7)]">
          <Building2 size={28} />
        </div>
        <p className="df-kicker mb-3">Enterprise Service Management</p>
        <h1 className="df-title text-3xl font-semibold text-slate-950">Portal de Servicios</h1>
        <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-slate-500">
          Selecciona el area correcta para canalizar solicitudes, incidentes y requerimientos internos.
        </p>

        <div className="relative mx-auto mt-6 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar help desk..."
            className="w-full rounded-2xl border border-slate-200 bg-white/90 py-3 pl-12 pr-4 text-sm shadow-sm"
          />
        </div>
      </section>

      {esAdmin && (
        <div className="flex justify-end">
          <button
            onClick={() => navigate('/admin/helpdesks')}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
          >
            <Plus size={14} />
            Gestionar Help Desks
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="df-card h-52 animate-pulse rounded-[1.6rem] p-6" />
          ))}
        </div>
      ) : visibles.length === 0 ? (
        <div className="df-panel rounded-[1.6rem] py-20 text-center">
          <Building2 size={48} className="mx-auto mb-3 text-slate-300" />
          <p className="font-medium text-slate-500">No se encontraron help desks</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {visibles.map(hd => (
            <button
              key={hd.id}
              onClick={() => navigate(`/esm/${hd.id}`)}
              className="df-card group flex flex-col gap-5 rounded-[1.7rem] p-6 text-left transition-all duration-200 hover:-translate-y-1 hover:border-blue-200 hover:shadow-[0_30px_60px_-38px_rgba(37,99,235,0.35)]"
            >
              <div className="flex items-center justify-between">
                <div
                  className="df-icon-tile h-14 w-14 rounded-2xl"
                  style={{ backgroundColor: hd.color + '12', borderColor: hd.color + '24' }}
                >
                  <TokenIcon token={hd.icono} fallback="building2" className="text-slate-700" size={24} />
                </div>
                <ChevronRight
                  size={18}
                  className="text-slate-300 transition-all group-hover:translate-x-1 group-hover:text-blue-500"
                />
              </div>

              <div>
                <h3 className="text-lg font-semibold text-slate-900 transition-colors group-hover:text-blue-700">
                  {hd.nombre}
                </h3>
                {hd.descripcion && (
                  <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-500">{hd.descripcion}</p>
                )}
              </div>

              <div className="mt-auto flex items-center gap-4 border-t border-slate-100 pt-4 text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <Ticket size={12} />
                  {hd.ticketsAbiertos} abiertos
                </span>
                <span className="flex items-center gap-1">
                  <Users size={12} />
                  {hd.cantidadAgentes} agentes
                </span>
                <span
                  className="ml-auto rounded-full px-2 py-1 text-[11px] font-semibold"
                  style={{ backgroundColor: hd.color + '14', color: hd.color }}
                >
                  Activo
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
