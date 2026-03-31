import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Award, CheckCircle, Clock, Medal, Star, TrendingUp, Trophy } from 'lucide-react';
import { gamificacionApi, type RankingItem } from '../api/gamificacion';
import { TokenIcon } from '../lib/iconTokens';

type Periodo = 'semana' | 'mes' | 'total';

const PERIOD_LABELS: Record<Periodo, string> = {
  semana: 'Esta semana',
  mes: 'Este mes',
  total: 'Historico',
};

const PODIUM_CONFIG = [
  { tone: 'from-amber-400 to-amber-600', text: 'text-amber-700', badge: Trophy },
  { tone: 'from-slate-300 to-slate-500', text: 'text-slate-700', badge: Medal },
  { tone: 'from-orange-300 to-orange-500', text: 'text-orange-700', badge: Award },
] as const;

function PodiumCard({ item, rank }: { item: RankingItem; rank: 0 | 1 | 2 }) {
  const config = PODIUM_CONFIG[rank];
  const avatarSize = rank === 0 ? 'h-16 w-16 text-2xl' : 'h-12 w-12 text-lg';
  const cardOrder = rank === 0 ? 'order-2' : rank === 1 ? 'order-1' : 'order-3';
  const barHeight = rank === 0 ? 'h-32' : rank === 1 ? 'h-24' : 'h-20';
  const Badge = config.badge;

  return (
    <div className={`flex flex-col items-center ${cardOrder}`}>
      <div className={`mb-3 flex ${avatarSize} items-center justify-center rounded-full bg-[linear-gradient(180deg,#eff6ff,#dbeafe)] font-bold text-blue-700 shadow-sm`}>
        {item.nombreCompleto.charAt(0).toUpperCase()}
      </div>
      <p className="max-w-[120px] truncate text-center text-sm font-semibold text-slate-900">{item.nombreCompleto}</p>
      <p className="mb-3 text-xs text-slate-500">{item.puntos} pts</p>
      <div className={`flex w-28 flex-col items-center justify-end rounded-t-[1.25rem] bg-gradient-to-b ${config.tone} ${barHeight}`}>
        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full border border-white/35 bg-white/20 text-white backdrop-blur-sm">
          <Badge size={20} />
        </div>
      </div>
    </div>
  );
}

function StatBadge({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="flex items-center gap-1.5 text-xs text-slate-500">
      <Icon size={12} className={color} />
      <span className="font-medium text-slate-700">{value}</span>
      <span>{label}</span>
    </div>
  );
}

export default function RankingPage() {
  const [periodo, setPeriodo] = useState<Periodo>('mes');

  const { data: ranking = [], isLoading } = useQuery({
    queryKey: ['ranking', periodo],
    queryFn: () => gamificacionApi.getRanking(periodo),
  });

  const top3 = ranking.slice(0, 3);

  return (
    <div className="space-y-6">
      <section className="df-panel rounded-[1.75rem] px-6 py-7 sm:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="df-icon-tile h-16 w-16 rounded-[1.4rem] bg-[linear-gradient(180deg,#fef3c7,#fde68a)]">
              <Trophy size={28} className="text-amber-600" />
            </div>
            <div>
              <p className="df-kicker mb-2">Rendimiento del equipo</p>
              <h1 className="df-title text-3xl font-semibold text-slate-950">Ranking de Agentes</h1>
              <p className="mt-2 text-sm text-slate-500">Visualiza a los agentes destacados con una lectura mas limpia y ejecutiva.</p>
            </div>
          </div>

          <div className="flex rounded-2xl border border-slate-200 bg-white p-1 shadow-sm">
            {(Object.keys(PERIOD_LABELS) as Periodo[]).map(p => (
              <button
                key={p}
                onClick={() => setPeriodo(p)}
                className={`rounded-xl px-3.5 py-2 text-sm font-semibold transition-all ${
                  periodo === p ? 'bg-slate-950 text-white' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {PERIOD_LABELS[p]}
              </button>
            ))}
          </div>
        </div>
      </section>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600" />
        </div>
      ) : ranking.length === 0 ? (
        <div className="df-panel rounded-[1.6rem] py-16 text-center text-slate-400">
          <Trophy size={48} className="mx-auto mb-3 opacity-30" />
          <p>No hay datos de ranking para este periodo</p>
        </div>
      ) : (
        <>
          {top3.length > 0 && (
            <section className="df-card rounded-[1.7rem] p-8">
              <h2 className="df-kicker mb-8 text-center">Top 3 del periodo</h2>
              <div className="flex items-end justify-center gap-6">{top3.map((item, i) => <PodiumCard key={item.usuarioId} item={item} rank={i as 0 | 1 | 2} />)}</div>
            </section>
          )}

          <section className="df-card overflow-hidden rounded-[1.7rem]">
            <div className="border-b border-slate-100 px-6 py-4">
              <h2 className="text-base font-semibold text-slate-900">Clasificacion completa</h2>
            </div>
            <div className="divide-y divide-slate-100">
              {ranking.map(item => (
                <div
                  key={item.usuarioId}
                  className={`flex items-center gap-4 px-6 py-4 transition-colors hover:bg-slate-50 ${item.posicion <= 3 ? 'bg-amber-50/40' : ''}`}
                >
                  <div className="w-9 text-center">
                    {item.posicion <= 3 ? (
                      <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-white">
                        {item.posicion === 1 ? <Trophy size={14} /> : item.posicion === 2 ? <Medal size={14} /> : <Award size={14} />}
                      </div>
                    ) : (
                      <span className="text-sm font-bold text-slate-400">{item.posicion}</span>
                    )}
                  </div>

                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(180deg,#eff6ff,#dbeafe)] text-sm font-bold text-blue-700">
                    {item.nombreCompleto.charAt(0).toUpperCase()}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-slate-900">{item.nombreCompleto}</p>
                    <p className="text-xs text-slate-400">{item.rol}</p>
                  </div>

                  <div className="hidden items-center gap-4 text-sm md:flex">
                    <StatBadge label="resueltos" value={item.ticketsResueltos} icon={CheckCircle} color="text-emerald-500" />
                    <StatBadge label="SLA" value={`${item.porcentajeSLA}%`} icon={TrendingUp} color="text-blue-500" />
                    {item.promedioCsat !== null && <StatBadge label="CSAT" value={item.promedioCsat.toFixed(1)} icon={Star} color="text-amber-500" />}
                    <StatBadge label="h prom." value={item.tiempoPromedioHoras} icon={Clock} color="text-violet-500" />
                  </div>

                  {item.logros.length > 0 && (
                    <div className="hidden items-center gap-1 lg:flex">
                      {item.logros.slice(0, 3).map((l, i) => (
                        <span key={i} title={l.nombre} className="df-icon-tile h-8 w-8 rounded-xl">
                          <TokenIcon token={l.icono} fallback="award" className="text-amber-600" size={15} />
                        </span>
                      ))}
                      {item.logros.length > 3 && <span className="text-xs text-slate-400">+{item.logros.length - 3}</span>}
                    </div>
                  )}

                  <div className="shrink-0 text-right">
                    <p className="font-bold text-slate-900">{item.puntos}</p>
                    <p className="text-xs text-slate-400">puntos</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="df-panel rounded-[1.5rem] px-5 py-4">
            <p className="df-kicker mb-3">Criterios de puntuacion</p>
            <div className="flex flex-wrap gap-4 text-sm text-slate-600">
              <span>
                <strong className="text-slate-900">+10</strong> por ticket resuelto
              </span>
              <span>
                <strong className="text-slate-900">+5</strong> por ticket dentro de SLA
              </span>
              <span>
                <strong className="text-slate-900">+CSAT x 8</strong> por encuesta positiva
              </span>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
