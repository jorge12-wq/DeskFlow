import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Edit3, PauseCircle, Plus, ToggleLeft, ToggleRight, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import apiClient from '../../api/client';
import { helpdesksApi } from '../../api/helpdesks';
import { TokenIcon, WAIT_REASON_ICON_OPTIONS } from '../../lib/iconTokens';

interface MotivoItem {
  id: string;
  nombre: string;
  descripcion?: string;
  icono: string;
  helpDeskId?: string;
  helpDesk?: string;
  activo: boolean;
  orden: number;
}

const api = {
  getAll: () => apiClient.get<MotivoItem[]>('/admin/motivos-espera').then(r => r.data),
  create: (d: object) => apiClient.post('/admin/motivos-espera', d),
  update: (id: string, d: object) => apiClient.put(`/admin/motivos-espera/${id}`, d),
  toggle: (id: string) => apiClient.patch(`/admin/motivos-espera/${id}/toggle`),
  delete: (id: string) => apiClient.delete(`/admin/motivos-espera/${id}`),
};

const SUGERENCIAS = [
  { icono: 'user-round', label: 'Esperando respuesta del cliente' },
  { icono: 'building2', label: 'Esperando al proveedor' },
  { icono: 'monitor', label: 'Esperando equipo o hardware' },
  { icono: 'lock', label: 'Esperando acceso remoto' },
  { icono: 'calendar', label: 'Esperando reunion tecnica' },
  { icono: 'badge-check', label: 'Esperando aprobacion de cambio' },
  { icono: 'refresh-cw', label: 'Esperando actualizacion del sistema' },
  { icono: 'file-text', label: 'Esperando documentacion' },
  { icono: 'coins', label: 'Esperando presupuesto' },
  { icono: 'package', label: 'Esperando entrega o instalacion' },
  { icono: 'key-round', label: 'Esperando licencia' },
  { icono: 'users', label: 'Esperando reunion de seguimiento' },
];

const FORM_VACIO = { nombre: '', descripcion: '', icono: 'clock3', helpDeskId: '', orden: 0 };

export default function MotivosEsperaPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<MotivoItem | null>(null);
  const [form, setForm] = useState(FORM_VACIO);

  const { data: motivos = [], isLoading } = useQuery({ queryKey: ['admin-motivos-espera'], queryFn: api.getAll });
  const { data: helpdesks = [] } = useQuery({ queryKey: ['helpdesks'], queryFn: helpdesksApi.getAll });

  const resetForm = () => {
    setForm(FORM_VACIO);
    setEditing(null);
    setShowForm(false);
  };

  const openEdit = (m: MotivoItem) => {
    setEditing(m);
    setForm({
      nombre: m.nombre,
      descripcion: m.descripcion ?? '',
      icono: m.icono,
      helpDeskId: m.helpDeskId ?? '',
      orden: m.orden,
    });
    setShowForm(true);
  };

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = {
        nombre: form.nombre,
        descripcion: form.descripcion || null,
        icono: form.icono,
        helpDeskId: form.helpDeskId || null,
        orden: form.orden,
      };
      return editing ? api.update(editing.id, payload) : api.create(payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-motivos-espera'] });
      resetForm();
      toast.success(editing ? 'Motivo actualizado' : 'Motivo creado');
    },
    onError: () => toast.error('Error al guardar'),
  });

  const toggleMutation = useMutation({
    mutationFn: (id: string) => api.toggle(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-motivos-espera'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-motivos-espera'] });
      toast.success('Motivo eliminado');
    },
  });

  const activos = motivos.filter(m => m.activo);
  const inactivos = motivos.filter(m => !m.activo);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <section className="df-panel rounded-[1.75rem] px-6 py-7 sm:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="df-icon-tile h-16 w-16 rounded-[1.4rem]">
              <PauseCircle className="text-amber-600" size={28} />
            </div>
            <div>
              <p className="df-kicker mb-2">Configuracion SLA</p>
              <h1 className="df-title text-3xl font-semibold text-slate-950">Motivos de Espera</h1>
              <p className="mt-2 text-sm text-slate-500">Define razones claras para pausar tickets y suspender el conteo operativo del SLA.</p>
            </div>
          </div>
          <button
            onClick={() => {
              setEditing(null);
              setForm(FORM_VACIO);
              setShowForm(true);
            }}
            className="inline-flex items-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#1d4ed8,#0f172a)] px-4 py-3 text-sm font-semibold text-white shadow-[0_20px_40px_-24px_rgba(29,78,216,0.65)] transition hover:-translate-y-[1px]"
          >
            <Plus size={15} />
            Nuevo motivo
          </button>
        </div>
      </section>

      {showForm && (
        <section className="df-card rounded-[1.75rem] p-6">
          <h2 className="df-title text-xl font-semibold text-slate-950">{editing ? 'Editar motivo' : 'Nuevo motivo de espera'}</h2>

          {!editing && (
            <div className="mt-5">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Sugerencias rapidas</p>
              <div className="flex flex-wrap gap-2">
                {SUGERENCIAS.map(s => (
                  <button
                    key={s.label}
                    onClick={() => setForm(f => ({ ...f, nombre: s.label, icono: s.icono }))}
                    className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
                  >
                    <TokenIcon token={s.icono} fallback="clock3" className="text-slate-500" size={14} />
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Nombre</label>
              <input value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm" placeholder="Ej: Esperando respuesta del cliente" />
            </div>

            <div className="md:col-span-2">
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Descripcion</label>
              <input value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm" placeholder="Detalle adicional para el equipo operativo" />
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Iconografia</label>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
                {WAIT_REASON_ICON_OPTIONS.map(option => (
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
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Help Desk</label>
              <select value={form.helpDeskId} onChange={e => setForm(f => ({ ...f, helpDeskId: e.target.value }))} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm">
                <option value="">Global para todos los Help Desks</option>
                {helpdesks.map(hd => (
                  <option key={hd.id} value={hd.id}>
                    {hd.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Orden</label>
              <input type="number" min={0} value={form.orden} onChange={e => setForm(f => ({ ...f, orden: +e.target.value }))} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm" />
            </div>
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
        </section>
      )}

      {isLoading ? (
        <div className="py-10 text-center text-slate-400 text-sm">Cargando...</div>
      ) : motivos.length === 0 ? (
        <div className="df-panel rounded-[1.6rem] py-14 text-center">
          <PauseCircle size={40} className="mx-auto mb-3 text-slate-300" />
          <p className="font-medium text-slate-500">Sin motivos de espera configurados</p>
          <p className="mt-1 text-sm text-slate-400">Crea razones claras para pausar tickets de forma controlada</p>
        </div>
      ) : (
        <div className="space-y-5">
          {activos.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Activos ({activos.length})</h3>
              {activos.map(m => (
                <MotivoRow key={m.id} motivo={m} onEdit={openEdit} onToggle={toggleMutation.mutate} onDelete={deleteMutation.mutate} />
              ))}
            </div>
          )}
          {inactivos.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Inactivos ({inactivos.length})</h3>
              {inactivos.map(m => (
                <MotivoRow key={m.id} motivo={m} onEdit={openEdit} onToggle={toggleMutation.mutate} onDelete={deleteMutation.mutate} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function MotivoRow({
  motivo,
  onEdit,
  onToggle,
  onDelete,
}: {
  motivo: MotivoItem;
  onEdit: (m: MotivoItem) => void;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className={`df-card flex items-center gap-4 rounded-[1.5rem] px-4 py-4 transition ${motivo.activo ? '' : 'opacity-65'}`}>
      <div className="df-icon-tile h-12 w-12 rounded-2xl">
        <TokenIcon token={motivo.icono} fallback="clock3" className="text-slate-700" size={20} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-slate-900">{motivo.nombre}</span>
          {motivo.helpDesk ? (
            <span className="rounded-full bg-blue-50 px-2 py-1 text-[11px] font-semibold text-blue-700">{motivo.helpDesk}</span>
          ) : (
            <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-500">Global</span>
          )}
        </div>
        {motivo.descripcion && <p className="mt-1 truncate text-xs text-slate-500">{motivo.descripcion}</p>}
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <button onClick={() => onEdit(motivo)} className="rounded-xl p-2 text-slate-400 transition hover:bg-blue-50 hover:text-blue-700" title="Editar">
          <Edit3 size={14} />
        </button>
        <button onClick={() => onToggle(motivo.id)} className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700" title={motivo.activo ? 'Desactivar' : 'Activar'}>
          {motivo.activo ? <ToggleRight size={16} className="text-emerald-500" /> : <ToggleLeft size={16} />}
        </button>
        <button
          onClick={() => {
            if (confirm(`Eliminar "${motivo.nombre}"?`)) onDelete(motivo.id);
          }}
          className="rounded-xl p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
          title="Eliminar"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}
