import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Building2, ChevronDown, ChevronUp, Edit3, EyeOff, Plus, Ticket, Trash2, UserMinus, UserPlus, Users } from 'lucide-react';
import { toast } from 'sonner';
import { helpdesksApi, type HelpDeskDetalle } from '../../api/helpdesks';
import apiClient from '../../api/client';
import { HELPDESK_ICON_OPTIONS, TokenIcon } from '../../lib/iconTokens';

const COLORES = ['#2563EB', '#0F766E', '#F59E0B', '#7C3AED', '#DC2626', '#EC4899', '#0891B2', '#65A30D'];

interface Usuario {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  rol: string;
}

const FORM_INICIAL = { nombre: '', descripcion: '', icono: 'building2', color: '#2563EB', esPublico: true, orden: 0 };

export default function HelpDesksAdminPage() {
  const queryClient = useQueryClient();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<HelpDeskDetalle | null>(null);
  const [form, setForm] = useState(FORM_INICIAL);

  const { data: helpdesks = [], isLoading } = useQuery({ queryKey: ['helpdesks'], queryFn: helpdesksApi.getAll });
  const { data: usuarios = [] } = useQuery<Usuario[]>({
    queryKey: ['usuarios-lista'],
    queryFn: () => apiClient.get('/usuarios').then(r => r.data),
  });

  const staff = usuarios.filter(u => ['Administrador', 'Supervisor', 'Agente'].includes(u.rol));

  const resetForm = () => {
    setForm(FORM_INICIAL);
    setEditing(null);
    setShowForm(false);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (editing) return helpdesksApi.update(editing.id, { ...form, activo: editing.activo });
      return helpdesksApi.create(form);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['helpdesks'] });
      toast.success(editing ? 'Help Desk actualizado' : 'Help Desk creado');
      resetForm();
    },
    onError: () => toast.error('Error al guardar'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => helpdesksApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['helpdesks'] });
      toast.success('Help Desk eliminado');
    },
  });

  const asignarMutation = useMutation({
    mutationFn: ({ hd, uid, resp }: { hd: string; uid: string; resp: boolean }) => helpdesksApi.asignarAgente(hd, uid, resp),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['helpdesks'] }),
  });

  const removerMutation = useMutation({
    mutationFn: ({ hd, uid }: { hd: string; uid: string }) => helpdesksApi.removerAgente(hd, uid),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['helpdesks'] }),
  });

  const startEdit = (hd: HelpDeskDetalle) => {
    setEditing(hd);
    setForm({
      nombre: hd.nombre,
      descripcion: hd.descripcion ?? '',
      icono: hd.icono ?? 'building2',
      color: hd.color,
      esPublico: hd.esPublico,
      orden: hd.orden,
    });
    setShowForm(true);
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <section className="df-panel rounded-[1.75rem] px-6 py-7 sm:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="df-icon-tile h-16 w-16 rounded-[1.4rem]">
              <Building2 className="text-blue-700" size={28} />
            </div>
            <div>
              <p className="df-kicker mb-2">Administracion</p>
              <h1 className="df-title text-3xl font-semibold text-slate-950">Gestion de Help Desks</h1>
              <p className="mt-2 text-sm text-slate-500">Define areas de atencion, visibilidad, iconografia y responsables operativos.</p>
            </div>
          </div>

          <button
            onClick={() => {
              setEditing(null);
              setForm(FORM_INICIAL);
              setShowForm(true);
            }}
            className="inline-flex items-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#1d4ed8,#0f172a)] px-4 py-3 text-sm font-semibold text-white shadow-[0_20px_40px_-24px_rgba(29,78,216,0.65)] transition hover:-translate-y-[1px]"
          >
            <Plus size={15} />
            Nuevo Help Desk
          </button>
        </div>
      </section>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-[1.8rem] border border-white/60 bg-white p-6 shadow-[0_40px_120px_-48px_rgba(15,23,42,0.5)]">
            <h2 className="df-title text-xl font-semibold text-slate-950">{editing ? 'Editar Help Desk' : 'Nuevo Help Desk'}</h2>

            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Nombre</label>
                <input value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm" placeholder="Ej: IT Help Desk" />
              </div>

              <div className="md:col-span-2">
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Descripcion</label>
                <textarea
                  value={form.descripcion}
                  onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
                  rows={3}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm resize-none"
                  placeholder="Describe que solicitudes atiende este help desk"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Identidad visual</label>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
                  {HELPDESK_ICON_OPTIONS.map(option => (
                    <button
                      key={option.value}
                      onClick={() => setForm(f => ({ ...f, icono: option.value }))}
                      className={`rounded-2xl border p-3 transition ${form.icono === option.value ? 'border-blue-500 bg-blue-50 shadow-sm' : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'}`}
                    >
                      <div className="df-icon-tile mx-auto mb-2 h-11 w-11 rounded-2xl">
                        <option.icon className={form.icono === option.value ? 'text-blue-700' : 'text-slate-600'} size={18} />
                      </div>
                      <span className="block text-[11px] font-medium text-slate-600">{option.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Color</label>
                <div className="flex flex-wrap gap-2">
                  {COLORES.map(color => (
                    <button
                      key={color}
                      onClick={() => setForm(f => ({ ...f, color }))}
                      className={`h-10 w-10 rounded-full transition ${form.color === color ? 'scale-110 ring-2 ring-slate-400 ring-offset-2' : ''}`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Orden</label>
                <input type="number" value={form.orden} onChange={e => setForm(f => ({ ...f, orden: +e.target.value }))} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm" />
              </div>

              <label className="md:col-span-2 flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-700">
                <input type="checkbox" checked={form.esPublico} onChange={e => setForm(f => ({ ...f, esPublico: e.target.checked }))} className="h-4 w-4 rounded border-slate-300 text-blue-600" />
                Visible en el portal de servicios
              </label>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button onClick={resetForm} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50">
                Cancelar
              </button>
              <button
                onClick={() => saveMutation.mutate()}
                disabled={!form.nombre.trim() || saveMutation.isPending}
                className="rounded-2xl bg-[linear-gradient(135deg,#1d4ed8,#0f172a)] px-5 py-3 text-sm font-semibold text-white shadow-[0_20px_40px_-24px_rgba(29,78,216,0.65)] transition disabled:opacity-50"
              >
                {saveMutation.isPending ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="py-10 text-center text-slate-400">Cargando...</div>
      ) : (
        <div className="space-y-4">
          {helpdesks.map(hd => {
            const isOpen = expanded === hd.id;
            return (
              <div key={hd.id} className="df-card overflow-hidden rounded-[1.6rem]">
                <div className="flex items-center gap-4 p-5">
                  <div className="df-icon-tile h-14 w-14 rounded-2xl" style={{ backgroundColor: hd.color + '12', borderColor: hd.color + '24' }}>
                    <TokenIcon token={hd.icono} fallback="building2" className="text-slate-700" size={24} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-slate-900">{hd.nombre}</span>
                      {!hd.activo && <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-500">Inactivo</span>}
                      {!hd.esPublico && (
                        <span title="No publico">
                          <EyeOff size={13} className="text-slate-400" />
                        </span>
                      )}
                    </div>
                    {hd.descripcion && <p className="mt-1 truncate text-xs text-slate-500">{hd.descripcion}</p>}
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <Ticket size={10} />
                        {hd.ticketsAbiertos} tickets
                      </span>
                      <span className="flex items-center gap-1">
                        <Users size={10} />
                        {hd.cantidadAgentes} agentes
                      </span>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      onClick={() => helpdesksApi.getById(hd.id).then(data => startEdit(data!))}
                      className="rounded-xl p-2 text-slate-400 transition hover:bg-blue-50 hover:text-blue-700"
                      title="Editar"
                    >
                      <Edit3 size={14} />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Eliminar "${hd.nombre}"?`)) deleteMutation.mutate(hd.id);
                      }}
                      className="rounded-xl p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                      title="Eliminar"
                    >
                      <Trash2 size={14} />
                    </button>
                    <button onClick={() => setExpanded(isOpen ? null : hd.id)} className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700">
                      {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                  </div>
                </div>

                {isOpen && (
                  <AgentPanel
                    helpDeskId={hd.id}
                    staff={staff}
                    onAsignar={(uid, resp) => asignarMutation.mutate({ hd: hd.id, uid, resp })}
                    onRemover={uid => removerMutation.mutate({ hd: hd.id, uid })}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function AgentPanel({
  helpDeskId,
  staff,
  onAsignar,
  onRemover,
}: {
  helpDeskId: string;
  staff: Usuario[];
  onAsignar: (uid: string, resp: boolean) => void;
  onRemover: (uid: string) => void;
}) {
  const { data: hd } = useQuery({
    queryKey: ['helpdesk', helpDeskId],
    queryFn: () => helpdesksApi.getById(helpDeskId),
  });

  const asignados = hd?.agentes ?? [];
  const asignadosIds = new Set(asignados.map(a => a.usuarioId));
  const disponibles = staff.filter(u => !asignadosIds.has(u.id));
  const [seleccionado, setSeleccionado] = useState('');

  return (
    <div className="border-t border-slate-100 bg-slate-50/70 p-5">
      <h3 className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
        <Users size={12} />
        Agentes asignados
      </h3>

      {asignados.length === 0 ? (
        <p className="mb-4 text-xs text-slate-400">Sin agentes asignados aun</p>
      ) : (
        <div className="mb-4 space-y-2">
          {asignados.map(a => (
            <div key={a.usuarioId} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[linear-gradient(180deg,#dbeafe,#bfdbfe)] text-xs font-bold text-blue-700">
                {a.nombreCompleto.split(' ').map(n => n[0]).slice(0, 2).join('')}
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-sm font-medium text-slate-800">{a.nombreCompleto}</span>
                <span className="ml-2 text-xs text-slate-400">{a.rol}</span>
              </div>
              {a.esResponsable && <span className="rounded-full bg-amber-100 px-2 py-1 text-[11px] font-semibold text-amber-700">Responsable</span>}
              <button onClick={() => onRemover(a.usuarioId)} className="rounded-xl p-2 text-slate-300 transition hover:bg-red-50 hover:text-red-500">
                <UserMinus size={13} />
              </button>
            </div>
          ))}
        </div>
      )}

      {disponibles.length > 0 && (
        <div className="flex flex-col gap-2 sm:flex-row">
          <select value={seleccionado} onChange={e => setSeleccionado(e.target.value)} className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm">
            <option value="">Agregar agente...</option>
            {disponibles.map(u => (
              <option key={u.id} value={u.id}>
                {u.nombre} {u.apellido} ({u.rol})
              </option>
            ))}
          </select>
          <button
            onClick={() => {
              if (seleccionado) {
                onAsignar(seleccionado, false);
                setSeleccionado('');
              }
            }}
            disabled={!seleccionado}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:opacity-40"
          >
            <UserPlus size={13} />
            Asignar
          </button>
        </div>
      )}
    </div>
  );
}
