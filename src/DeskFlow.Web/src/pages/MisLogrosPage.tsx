import { useQuery } from '@tanstack/react-query';
import { Award, CheckCircle, Lock, Star, Trophy } from 'lucide-react';
import { gamificacionApi, type LogroDto } from '../api/gamificacion';
import { TokenIcon } from '../lib/iconTokens';

function LogroCard({ logro }: { logro: LogroDto }) {
  const fecha = logro.fechaObtenido
    ? new Date(logro.fechaObtenido).toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : null;

  return (
    <div
      className={`relative rounded-[1.5rem] border p-5 transition-all ${
        logro.obtenido
          ? 'df-card border-amber-200 hover:-translate-y-[2px] hover:shadow-[0_24px_48px_-34px_rgba(245,158,11,0.35)]'
          : 'border-slate-200 bg-slate-50/80 opacity-75'
      }`}
    >
      <div className="absolute right-4 top-4">
        {logro.obtenido ? <CheckCircle size={16} className="text-emerald-500" /> : <Lock size={14} className="text-slate-400" />}
      </div>

      <div className={`df-icon-tile mb-4 h-16 w-16 rounded-[1.25rem] ${logro.obtenido ? 'bg-amber-50' : 'bg-slate-100'}`}>
        <TokenIcon token={logro.icono} fallback="award" className={logro.obtenido ? 'text-amber-600' : 'text-slate-400'} size={28} />
      </div>

      <h3 className="mb-1 font-semibold text-slate-900">{logro.nombre}</h3>
      <p className="mb-4 line-clamp-2 text-xs leading-5 text-slate-500">{logro.descripcion}</p>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-700">
          <Star size={12} className="fill-amber-400 text-amber-400" />
          {logro.puntosRecompensa} pts
        </div>
        {fecha && <span className="text-xs text-slate-400">{fecha}</span>}
      </div>

      {!logro.obtenido && (
        <div className="mt-4 border-t border-slate-200 pt-4">
          <p className="text-xs italic text-slate-400">{logro.criterio}</p>
        </div>
      )}
    </div>
  );
}

export default function MisLogrosPage() {
  const { data: logros = [], isLoading } = useQuery({
    queryKey: ['mis-logros'],
    queryFn: gamificacionApi.getMisLogros,
  });

  const obtenidos = logros.filter(l => l.obtenido);
  const pendientes = logros.filter(l => !l.obtenido);
  const puntosTotal = obtenidos.reduce((s, l) => s + l.puntosRecompensa, 0);
  const progreso = logros.length > 0 ? Math.round((obtenidos.length / logros.length) * 100) : 0;

  return (
    <div className="space-y-6">
      <section className="df-panel rounded-[1.75rem] px-6 py-7 sm:px-8">
        <div className="flex flex-wrap items-center gap-4">
          <div className="df-icon-tile h-16 w-16 rounded-[1.4rem] bg-[linear-gradient(180deg,#fef3c7,#fde68a)]">
            <Award size={28} className="text-amber-600" />
          </div>
          <div>
            <p className="df-kicker mb-2">Reconocimiento</p>
            <h1 className="df-title text-3xl font-semibold text-slate-950">Mis Logros</h1>
            <p className="mt-2 text-sm text-slate-500">Insignias, progreso personal y puntos acumulados dentro de la plataforma.</p>
          </div>
        </div>
      </section>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-amber-500" />
        </div>
      ) : (
        <>
          <section className="overflow-hidden rounded-[1.8rem] bg-[linear-gradient(135deg,#f59e0b,#b45309)] px-6 py-6 text-white shadow-[0_30px_60px_-38px_rgba(180,83,9,0.5)]">
            <div className="flex flex-wrap items-center justify-between gap-6">
              <div>
                <p className="text-sm text-amber-100">Logros obtenidos</p>
                <p className="mt-2 text-4xl font-semibold">
                  {obtenidos.length}
                  <span className="ml-2 text-xl font-normal text-amber-200">/ {logros.length}</span>
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-amber-100">Puntos acumulados</p>
                <p className="mt-2 text-4xl font-semibold">{puntosTotal}</p>
              </div>
              <div className="rounded-full border border-white/25 bg-white/12 p-4">
                <Trophy className="h-8 w-8 text-white" />
              </div>
            </div>

            <div className="mt-5 h-2 rounded-full bg-amber-300/30">
              <div className="h-2 rounded-full bg-white" style={{ width: `${progreso}%` }} />
            </div>
            <p className="mt-2 text-xs text-amber-100">{progreso}% completado</p>
          </section>

          {obtenidos.length > 0 && (
            <section>
              <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
                <CheckCircle size={14} className="text-emerald-500" />
                Obtenidos ({obtenidos.length})
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {obtenidos.map(l => (
                  <LogroCard key={l.id} logro={l} />
                ))}
              </div>
            </section>
          )}

          {pendientes.length > 0 && (
            <section>
              <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
                <Lock size={14} className="text-slate-400" />
                Por desbloquear ({pendientes.length})
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {pendientes.map(l => (
                  <LogroCard key={l.id} logro={l} />
                ))}
              </div>
            </section>
          )}

          {logros.length === 0 && (
            <div className="df-panel rounded-[1.6rem] py-16 text-center text-slate-400">
              <Award size={48} className="mx-auto mb-3 opacity-30" />
              <p>No hay logros configurados todavia</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
