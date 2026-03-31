import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { AlertCircle, ArrowLeft, CheckCircle, Clock, Plus, Ticket, Users } from 'lucide-react';
import { helpdesksApi } from '../api/helpdesks';
import { ticketsApi } from '../api/tickets';
import { useAuthStore } from '../store/authStore';
import { TokenIcon } from '../lib/iconTokens';

export default function HelpDeskPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { usuario } = useAuthStore();

  const { data: hd, isLoading } = useQuery({
    queryKey: ['helpdesk', id],
    queryFn: () => helpdesksApi.getById(id!),
    enabled: !!id,
  });

  const { data: ticketsData } = useQuery({
    queryKey: ['tickets', { helpDeskId: id, pageSize: 10 }],
    queryFn: () => ticketsApi.getAll({ helpDeskId: id, pageSize: 10 }),
    enabled: !!id,
  });

  if (isLoading) return <div className="p-6 text-slate-400">Cargando...</div>;
  if (!hd) return <div className="p-6 text-red-500">Help Desk no encontrado</div>;

  const esStaff = ['Administrador', 'Supervisor', 'Agente'].includes(usuario?.rol ?? '');

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <section className="df-panel rounded-[1.8rem] px-6 py-7 sm:px-8">
        <div className="flex flex-wrap items-start gap-4">
          <button
            onClick={() => navigate('/esm')}
            className="mt-1 rounded-2xl border border-slate-200 bg-white/80 p-2.5 text-slate-500 shadow-sm transition hover:border-slate-300 hover:bg-white"
          >
            <ArrowLeft size={18} />
          </button>

          <div
            className="df-icon-tile h-16 w-16 rounded-[1.4rem]"
            style={{ backgroundColor: hd.color + '12', borderColor: hd.color + '24' }}
          >
            <TokenIcon token={hd.icono} fallback="building2" className="text-slate-700" size={28} />
          </div>

          <div className="min-w-0 flex-1">
            <p className="df-kicker mb-2">Help Desk</p>
            <h1 className="df-title text-3xl font-semibold text-slate-950">{hd.nombre}</h1>
            {hd.descripcion && <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">{hd.descripcion}</p>}
          </div>

          <button
            onClick={() => navigate(`/tickets/nuevo?helpDeskId=${id}`)}
            className="inline-flex items-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#1d4ed8,#0f172a)] px-4 py-3 text-sm font-semibold text-white shadow-[0_20px_40px_-24px_rgba(29,78,216,0.65)] transition hover:-translate-y-[1px]"
          >
            <Plus size={15} />
            Nueva solicitud
          </button>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: 'Tickets abiertos', value: hd.ticketsAbiertos, icon: Ticket, tone: 'bg-blue-50 text-blue-700 border-blue-100' },
          { label: 'Tickets hoy', value: hd.ticketsHoy, icon: Clock, tone: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
          { label: 'Agentes', value: hd.agentes.length, icon: Users, tone: 'bg-violet-50 text-violet-700 border-violet-100' },
          {
            label: 'Responsables',
            value: hd.agentes.filter(a => a.esResponsable).length,
            icon: CheckCircle,
            tone: 'bg-amber-50 text-amber-700 border-amber-100',
          },
        ].map(stat => (
          <div key={stat.label} className={`rounded-[1.4rem] border p-4 ${stat.tone}`}>
            <div className="mb-4 inline-flex rounded-2xl bg-white/70 p-2">
              <stat.icon size={18} />
            </div>
            <div className="text-3xl font-semibold">{stat.value}</div>
            <div className="mt-1 text-xs font-semibold uppercase tracking-[0.16em] opacity-75">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="df-card rounded-[1.6rem] p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
              <Ticket size={16} className="text-blue-600" />
              Tickets recientes
            </h2>
            <button onClick={() => navigate('/tickets')} className="text-xs font-semibold text-blue-700 hover:text-blue-800">
              Ver todos
            </button>
          </div>
          {!ticketsData?.items.length ? (
            <div className="py-10 text-center text-slate-400">
              <Ticket size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">No hay tickets aun</p>
            </div>
          ) : (
            <div className="space-y-2">
              {ticketsData.items.slice(0, 8).map(t => (
                <button
                  key={t.id}
                  onClick={() => navigate(`/tickets/${t.id}`)}
                  className="flex w-full items-center gap-3 rounded-2xl border border-transparent px-3 py-3 text-left transition hover:border-slate-200 hover:bg-slate-50"
                >
                  <span className="w-20 shrink-0 font-mono text-xs text-slate-400">{t.numero}</span>
                  <span className="flex-1 truncate text-sm text-slate-700">{t.asunto}</span>
                  <span
                    className="shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold"
                    style={{ backgroundColor: t.estadoColor + '18', color: t.estadoColor }}
                  >
                    {t.estado}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="df-card rounded-[1.6rem] p-5">
          <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-slate-900">
            <Users size={16} className="text-blue-600" />
            Equipo
          </h2>
          {hd.agentes.length === 0 ? (
            <div className="py-10 text-center text-slate-400">
              <Users size={28} className="mx-auto mb-2 opacity-30" />
              <p className="text-xs">Sin agentes asignados</p>
              {esStaff && (
                <button
                  onClick={() => navigate(`/admin/helpdesks/${id}`)}
                  className="mt-3 text-xs font-semibold text-blue-700 hover:text-blue-800"
                >
                  Asignar agentes
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-2.5">
              {hd.agentes.map(a => (
                <div key={a.usuarioId} className="flex items-center gap-3 rounded-2xl border border-slate-200 px-3 py-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[linear-gradient(180deg,#dbeafe,#bfdbfe)] text-xs font-bold text-blue-700 shrink-0">
                    {a.nombreCompleto.split(' ').map(n => n[0]).slice(0, 2).join('')}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-slate-800">{a.nombreCompleto}</div>
                    <div className="text-xs text-slate-400">{a.rol}</div>
                  </div>
                  {a.esResponsable && (
                    <span title="Responsable">
                      <AlertCircle size={14} className="shrink-0 text-amber-500" />
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
