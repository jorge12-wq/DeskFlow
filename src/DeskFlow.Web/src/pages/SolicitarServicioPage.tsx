import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, CheckCircle2, Clock, ListChecks, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { catalogoApi } from '../api/catalogo';
import { TokenIcon } from '../lib/iconTokens';

function formatTiempoEntrega(horas?: number): string {
  if (!horas) return 'Variable';
  if (horas < 24) return `${horas}h`;
  const dias = Math.floor(horas / 24);
  return `${dias} dia${dias !== 1 ? 's' : ''}`;
}

function CampoDinamico({
  campo,
  valor,
  onChange,
}: {
  campo: { id: string; nombre: string; etiqueta: string; tipoCampo: string; placeholder?: string; requerido: boolean; opciones: string[] };
  valor: string;
  onChange: (v: string) => void;
}) {
  const inputClass = 'w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm';

  switch (campo.tipoCampo) {
    case 'textarea':
      return (
        <textarea
          rows={4}
          value={valor}
          onChange={e => onChange(e.target.value)}
          placeholder={campo.placeholder ?? ''}
          required={campo.requerido}
          className={`${inputClass} resize-none`}
        />
      );
    case 'numero':
      return <input type="number" value={valor} onChange={e => onChange(e.target.value)} placeholder={campo.placeholder ?? ''} required={campo.requerido} className={inputClass} />;
    case 'fecha':
      return <input type="date" value={valor} onChange={e => onChange(e.target.value)} required={campo.requerido} className={inputClass} />;
    case 'email':
      return <input type="email" value={valor} onChange={e => onChange(e.target.value)} placeholder={campo.placeholder ?? ''} required={campo.requerido} className={inputClass} />;
    case 'select':
      return (
        <select value={valor} onChange={e => onChange(e.target.value)} required={campo.requerido} className={inputClass}>
          <option value="">Selecciona una opcion...</option>
          {campo.opciones.map(op => (
            <option key={op} value={op}>
              {op}
            </option>
          ))}
        </select>
      );
    case 'multiselect':
      return (
        <div className="space-y-2 rounded-2xl border border-slate-200 bg-white px-4 py-3">
          {campo.opciones.map(op => {
            const valores = valor ? valor.split(',') : [];
            const checked = valores.includes(op);
            return (
              <label key={op} className="flex cursor-pointer items-center gap-3 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => {
                    const next = checked ? valores.filter(v => v !== op) : [...valores, op];
                    onChange(next.join(','));
                  }}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600"
                />
                <span>{op}</span>
              </label>
            );
          })}
        </div>
      );
    case 'checkbox':
      return (
        <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={valor === 'true'}
            onChange={e => onChange(e.target.checked ? 'true' : 'false')}
            className="h-4 w-4 rounded border-slate-300 text-blue-600"
          />
          <span>Aplicar esta opcion</span>
        </label>
      );
    default:
      return <input type="text" value={valor} onChange={e => onChange(e.target.value)} placeholder={campo.placeholder ?? ''} required={campo.requerido} className={inputClass} />;
  }
}

export default function SolicitarServicioPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [respuestas, setRespuestas] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [ticketCreado, setTicketCreado] = useState<{ id: string; numero: string } | null>(null);

  const { data: servicio, isLoading } = useQuery({
    queryKey: ['servicio', id],
    queryFn: () => catalogoApi.getServicio(id!),
    enabled: !!id,
  });

  const mutation = useMutation({
    mutationFn: () => catalogoApi.solicitarServicio(id!, respuestas),
    onSuccess: (ticket: any) => {
      setTicketCreado({ id: ticket.id, numero: ticket.numero });
      setSubmitted(true);
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      queryClient.invalidateQueries({ queryKey: ['mi-trabajo'] });
    },
    onError: () => toast.error('Error al enviar la solicitud. Intenta de nuevo.'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!servicio) return <div className="py-16 text-center text-slate-400">Servicio no encontrado</div>;

  if (submitted && ticketCreado) {
    return (
      <div className="mx-auto max-w-2xl space-y-6 py-10 text-center">
        <div className="df-panel rounded-[1.8rem] px-8 py-10">
          <div className="mx-auto mb-5 flex h-18 w-18 items-center justify-center rounded-full bg-green-50 text-green-600">
            <CheckCircle2 className="h-10 w-10" />
          </div>
          <p className="df-kicker mb-3">Solicitud registrada</p>
          <h2 className="df-title text-3xl font-semibold text-slate-950">Solicitud enviada correctamente</h2>
          <p className="mt-2 text-sm text-slate-500">Tu requerimiento fue registrado con el numero</p>
          <p className="mt-3 font-mono text-3xl font-bold text-blue-700">{ticketCreado.numero}</p>

          {servicio.requiereAprobacion && (
            <div className="mx-auto mt-6 flex max-w-md items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
              <ShieldCheck className="h-4 w-4 shrink-0" />
              Esta solicitud requiere aprobacion antes de ser procesada.
            </div>
          )}

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <button
              onClick={() => navigate(`/tickets/${ticketCreado.id}`)}
              className="rounded-2xl bg-[linear-gradient(135deg,#1d4ed8,#0f172a)] px-5 py-3 text-sm font-semibold text-white shadow-[0_20px_40px_-24px_rgba(29,78,216,0.65)] transition hover:-translate-y-[1px]"
            >
              Ver solicitud
            </button>
            <button
              onClick={() => navigate('/catalogo')}
              className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
            >
              Volver al catalogo
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <button
        onClick={() => navigate('/catalogo')}
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver al catalogo
      </button>

      <section className="df-panel rounded-[1.8rem] px-6 py-7 sm:px-8">
        <div className="flex flex-wrap items-start gap-4">
          <div className="df-icon-tile h-16 w-16 rounded-[1.4rem]" style={{ backgroundColor: (servicio.color ?? '#2563eb') + '12' }}>
            <TokenIcon token={servicio.icono} fallback="settings2" className="text-slate-700" size={28} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span
                className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
                style={{ backgroundColor: (servicio.departamentoColor ?? '#64748b') + '18', color: servicio.departamentoColor ?? '#64748b' }}
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
            <h1 className="df-title text-3xl font-semibold text-slate-950">{servicio.nombre}</h1>
            {servicio.descripcion && <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">{servicio.descripcion}</p>}
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-5 border-t border-slate-100 pt-5">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Clock className="h-4 w-4" />
            Tiempo estimado: <strong className="text-slate-800">{formatTiempoEntrega(servicio.tiempoEntregaHoras)}</strong>
          </div>
          {servicio.plantillas.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <ListChecks className="h-4 w-4" />
              <strong className="text-slate-800">{servicio.plantillas.length}</strong> tareas automaticas
            </div>
          )}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_320px]">
        <form onSubmit={handleSubmit} className="df-card rounded-[1.7rem] p-6 space-y-5">
          <div>
            <p className="df-kicker mb-2">Formulario</p>
            <h2 className="df-title text-xl font-semibold text-slate-950">Completa la solicitud</h2>
          </div>

          {servicio.campos.length === 0 ? (
            <p className="text-sm text-slate-400">Este servicio no requiere informacion adicional.</p>
          ) : (
            servicio.campos.map(campo => (
              <div key={campo.id}>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  {campo.etiqueta}
                  {campo.requerido && <span className="ml-1 text-red-500">*</span>}
                </label>
                <CampoDinamico
                  campo={campo}
                  valor={respuestas[campo.nombre] ?? ''}
                  onChange={v => setRespuestas(prev => ({ ...prev, [campo.nombre]: v }))}
                />
              </div>
            ))
          )}

          <div className="flex flex-wrap gap-3 border-t border-slate-100 pt-5">
            <button
              type="submit"
              disabled={mutation.isPending}
              className="rounded-2xl bg-[linear-gradient(135deg,#1d4ed8,#0f172a)] px-5 py-3 text-sm font-semibold text-white shadow-[0_20px_40px_-24px_rgba(29,78,216,0.65)] transition hover:-translate-y-[1px] disabled:opacity-50"
            >
              {mutation.isPending ? 'Enviando...' : 'Enviar solicitud'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/catalogo')}
              className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
            >
              Cancelar
            </button>
          </div>
        </form>

        {servicio.plantillas.length > 0 && (
          <aside className="df-panel rounded-[1.7rem] p-6">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-900">
              <ListChecks className="h-4 w-4 text-blue-600" />
              Flujo operativo inicial
            </h3>
            <ol className="space-y-3">
              {servicio.plantillas.map((p, i) => (
                <li key={p.id} className="flex items-start gap-3 text-sm text-slate-600">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                    {i + 1}
                  </span>
                  <div>
                    <p className="font-medium text-slate-800">{p.titulo}</p>
                    {p.descripcion && <p className="mt-1 text-xs leading-5 text-slate-500">{p.descripcion}</p>}
                  </div>
                </li>
              ))}
            </ol>
          </aside>
        )}
      </div>
    </div>
  );
}
