import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight, Clock, Layers, Search, ShieldCheck } from 'lucide-react';
import { catalogoApi } from '../api/catalogo';
import { useAuthStore } from '../store/authStore';
import { TokenIcon } from '../lib/iconTokens';

function formatTiempoEntrega(horas?: number): string {
  if (!horas) return 'Variable';
  if (horas < 24) return `${horas}h`;
  const dias = Math.floor(horas / 24);
  return `${dias} dia${dias !== 1 ? 's' : ''}`;
}

export default function CatalogoPage() {
  const navigate = useNavigate();
  const { usuario } = useAuthStore();
  const [depActivo, setDepActivo] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState('');

  const esStaff = !['Usuario'].includes(usuario?.rol ?? '');

  const { data: departamentos, isLoading: loadingDeps } = useQuery({
    queryKey: ['catalogo-departamentos'],
    queryFn: catalogoApi.getDepartamentos,
  });

  const { data: servicios, isLoading: loadingServicios } = useQuery({
    queryKey: ['catalogo-servicios', depActivo],
    queryFn: () => catalogoApi.getServicios(depActivo ?? undefined, !esStaff),
  });

  const serviciosFiltrados = (servicios ?? []).filter(s =>
    !busqueda ||
    s.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    s.descripcion?.toLowerCase().includes(busqueda.toLowerCase()),
  );

  const isLoading = loadingDeps || loadingServicios;

  return (
    <div className="space-y-8">
      <section className="df-panel rounded-[1.8rem] px-6 py-7 sm:px-8">
        <p className="df-kicker mb-3">Portal de solicitudes</p>
        <h1 className="df-title text-3xl font-semibold text-slate-950">Catalogo de Servicios</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
          Encuentra el servicio adecuado, revisa tiempos estimados y envia tu solicitud con una experiencia mas clara y profesional.
        </p>
      </section>

      <div className="relative max-w-lg">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          placeholder="Buscar servicio..."
          className="w-full rounded-2xl border border-slate-200 bg-white/90 py-3 pl-11 pr-4 text-sm text-slate-900 shadow-sm"
        />
      </div>

      {!busqueda && (
        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={() => setDepActivo(null)}
            className={`flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium transition-all ${
              depActivo === null
                ? 'bg-slate-950 text-white shadow-lg shadow-slate-900/10'
                : 'border border-slate-200 bg-white/85 text-slate-600 hover:border-slate-300 hover:bg-white'
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            Todos
            <span className={`rounded-full px-1.5 py-0.5 text-xs ${depActivo === null ? 'bg-white/15 text-white' : 'bg-slate-100 text-slate-500'}`}>
              {servicios?.length ?? 0}
            </span>
          </button>
          {departamentos?.map(dep => (
            <button
              key={dep.id}
              onClick={() => setDepActivo(dep.id)}
              className={`flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium transition-all ${
                depActivo === dep.id
                  ? 'text-white shadow-lg'
                  : 'border border-slate-200 bg-white/85 text-slate-600 hover:border-slate-300 hover:bg-white'
              }`}
              style={depActivo === dep.id ? { backgroundColor: dep.color ?? '#2563eb' } : undefined}
            >
              <span className="df-icon-tile h-8 w-8 rounded-full">
                <TokenIcon token={dep.icono} fallback="building2" className="text-slate-600" size={16} />
              </span>
              {dep.nombre}
              <span className={`rounded-full px-1.5 py-0.5 text-xs ${depActivo === dep.id ? 'bg-white/15 text-white' : 'bg-slate-100 text-slate-500'}`}>
                {dep.cantidadServicios}
              </span>
            </button>
          ))}
        </div>
      )}

      {isLoading ? (
        <div className="flex h-48 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600" />
        </div>
      ) : serviciosFiltrados.length === 0 ? (
        <div className="df-panel rounded-[1.6rem] py-16 text-center text-slate-400">
          <Layers className="mx-auto mb-3 h-12 w-12 opacity-30" />
          <p className="font-medium">No se encontraron servicios</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {serviciosFiltrados.map(servicio => (
            <button
              key={servicio.id}
              onClick={() => navigate(`/catalogo/servicios/${servicio.id}`)}
              className="df-card group rounded-[1.6rem] p-5 text-left transition-all duration-200 hover:-translate-y-1 hover:border-blue-200 hover:shadow-[0_30px_60px_-38px_rgba(37,99,235,0.35)]"
            >
              <div className="mb-5 flex items-start justify-between gap-3">
                <div
                  className="df-icon-tile h-14 w-14 rounded-2xl shadow-sm"
                  style={{ backgroundColor: (servicio.color ?? '#2563eb') + '10' }}
                >
                  <TokenIcon token={servicio.icono} fallback="settings2" className="text-slate-700" size={24} />
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span
                    className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
                    style={{ backgroundColor: (servicio.departamentoColor ?? '#64748b') + '15', color: servicio.departamentoColor ?? '#64748b' }}
                  >
                    {servicio.departamento}
                  </span>
                  {servicio.requiereAprobacion && (
                    <span className="flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700">
                      <ShieldCheck className="h-3 w-3" />
                      Requiere aprobacion
                    </span>
                  )}
                </div>
              </div>

              <h3 className="mb-2 text-base font-semibold text-slate-900 transition-colors group-hover:text-blue-700">
                {servicio.nombre}
              </h3>

              {servicio.descripcion && (
                <p className="mb-5 line-clamp-2 text-sm leading-6 text-slate-500">
                  {servicio.descripcion}
                </p>
              )}

              <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <Clock className="h-3.5 w-3.5" />
                  <span>Entrega: {formatTiempoEntrega(servicio.tiempoEntregaHoras)}</span>
                </div>
                <span className="flex items-center gap-1 text-xs font-semibold text-blue-700 opacity-0 transition-opacity group-hover:opacity-100">
                  Solicitar <ChevronRight className="h-3.5 w-3.5" />
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
