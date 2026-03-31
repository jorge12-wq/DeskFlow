import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Clock, Plus, Trash2, Save, Timer, Calendar } from 'lucide-react';
import apiClient from '../../api/client';
import { catalogosApi } from '../../api/dashboard';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Horario {
  horaInicio: string;
  horaFin: string;
  lunes: boolean; martes: boolean; miercoles: boolean;
  jueves: boolean; viernes: boolean; sabado: boolean; domingo: boolean;
  zonaHoraria: string;
}

interface SLAConfigItem {
  id: string;
  prioridad: string;
  prioridadId: string;
  prioridadColor: string;
  categoria: string | null;
  categoriaId: string | null;
  tiempoRespuesta: number;
  tiempoResolucion: number;
}

interface ZonaHoraria { id: string; nombre: string; }

// ── API ───────────────────────────────────────────────────────────────────────

const api = {
  getHorario:           () => apiClient.get<Horario>('/admin/sla/horario').then(r => r.data),
  saveHorario:          (d: Horario) => apiClient.put('/admin/sla/horario', d),
  getConfiguraciones:   () => apiClient.get<SLAConfigItem[]>('/admin/sla/configuraciones').then(r => r.data),
  createConfiguracion:  (d: object) => apiClient.post('/admin/sla/configuraciones', d),
  updateConfiguracion:  (id: string, d: object) => apiClient.put(`/admin/sla/configuraciones/${id}`, d),
  deleteConfiguracion:  (id: string) => apiClient.delete(`/admin/sla/configuraciones/${id}`),
  getZonasHorarias:     () => apiClient.get<ZonaHoraria[]>('/admin/sla/zonas-horarias').then(r => r.data),
};

const DIAS = [
  { key: 'lunes',     label: 'Lun' },
  { key: 'martes',    label: 'Mar' },
  { key: 'miercoles', label: 'Mié' },
  { key: 'jueves',    label: 'Jue' },
  { key: 'viernes',   label: 'Vie' },
  { key: 'sabado',    label: 'Sáb' },
  { key: 'domingo',   label: 'Dom' },
] as const;

// ── Tab: Horario Laboral ──────────────────────────────────────────────────────

function HorarioTab() {
  const qc = useQueryClient();

  const { data: horarioOriginal, isLoading } = useQuery({
    queryKey: ['sla-horario'],
    queryFn: api.getHorario,
  });

  const { data: zonas = [] } = useQuery({
    queryKey: ['zonas-horarias'],
    queryFn: api.getZonasHorarias,
  });

  const [form, setForm] = useState<Horario | null>(null);
  const current = form ?? horarioOriginal ?? {
    horaInicio: '08:00', horaFin: '18:00',
    lunes: true, martes: true, miercoles: true, jueves: true, viernes: true,
    sabado: false, domingo: false, zonaHoraria: 'UTC',
  };

  const setDay = (key: string, val: boolean) =>
    setForm(f => ({ ...(f ?? current), [key]: val }));

  const saveMutation = useMutation({
    mutationFn: () => api.saveHorario(form ?? current),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sla-horario'] });
      setForm(null);
      toast.success('Horario laboral guardado');
    },
    onError: () => toast.error('Error al guardar el horario'),
  });

  if (isLoading) return <div className="py-12 text-center text-gray-400 text-sm">Cargando...</div>;

  const horasMostradas = () => {
    const inicio = current.horaInicio;
    const fin = current.horaFin;
    if (!inicio || !fin) return '';
    const [h1] = inicio.split(':').map(Number);
    const [h2] = fin.split(':').map(Number);
    return `${h2 - h1} hs laborables por día`;
  };

  return (
    <div className="space-y-6 max-w-xl">
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-700">
        <strong>¿Cómo funciona?</strong> El SLA sólo corre durante el horario laboral configurado.
        Si un ticket se crea a las 17:30 hs con un SLA de 4 horas, vence a las 9:30 hs del día siguiente
        (contando sólo las horas de trabajo).
      </div>

      {/* Zona horaria */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Zona horaria</label>
        <select
          value={current.zonaHoraria}
          onChange={e => setForm(f => ({ ...(f ?? current), zonaHoraria: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
        >
          {zonas.map(z => <option key={z.id} value={z.id}>{z.nombre}</option>)}
        </select>
      </div>

      {/* Horario */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Hora de inicio</label>
          <input
            type="time"
            value={current.horaInicio}
            onChange={e => setForm(f => ({ ...(f ?? current), horaInicio: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Hora de fin</label>
          <input
            type="time"
            value={current.horaFin}
            onChange={e => setForm(f => ({ ...(f ?? current), horaFin: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>
      {horasMostradas() && (
        <p className="text-xs text-gray-500 -mt-3 flex items-center gap-1">
          <Clock size={11} /> {horasMostradas()}
        </p>
      )}

      {/* Días laborables */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Días laborables</label>
        <div className="flex gap-2 flex-wrap">
          {DIAS.map(({ key, label }) => {
            const activo = current[key as keyof Horario] as boolean;
            return (
              <button
                key={key}
                onClick={() => setDay(key, !activo)}
                className={`w-12 h-12 rounded-xl text-sm font-semibold transition border-2
                  ${activo
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white text-gray-400 border-gray-200 hover:border-indigo-300'}`}
              >
                {label}
              </button>
            );
          })}
        </div>
        <p className="text-xs text-gray-400 mt-1">
          {DIAS.filter(d => (current[d.key as keyof Horario] as boolean)).map(d => d.label).join(', ') || 'Ningún día seleccionado'}
        </p>
      </div>

      <button
        onClick={() => saveMutation.mutate()}
        disabled={saveMutation.isPending}
        className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition"
      >
        <Save size={15} /> {saveMutation.isPending ? 'Guardando...' : 'Guardar horario'}
      </button>
    </div>
  );
}

// ── Tab: Configuraciones SLA ──────────────────────────────────────────────────

function ConfiguracionesTab() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<SLAConfigItem | null>(null);
  const [form, setForm] = useState({ prioridadId: '', categoriaId: '', tiempoRespuesta: 4, tiempoResolucion: 8 });

  const { data: configs = [], isLoading } = useQuery({ queryKey: ['sla-configs'], queryFn: api.getConfiguraciones });
  const { data: prioridades = [] } = useQuery({ queryKey: ['prioridades'], queryFn: catalogosApi.getPrioridades });
  const { data: categorias = [] } = useQuery({ queryKey: ['categorias'], queryFn: catalogosApi.getCategorias });

  const resetForm = () => {
    setForm({ prioridadId: '', categoriaId: '', tiempoRespuesta: 4, tiempoResolucion: 8 });
    setEditing(null);
    setShowForm(false);
  };

  const openCreate = () => { resetForm(); setShowForm(true); };
  const openEdit = (c: SLAConfigItem) => {
    setEditing(c);
    setForm({
      prioridadId: c.prioridadId,
      categoriaId: c.categoriaId ?? '',
      tiempoRespuesta: c.tiempoRespuesta,
      tiempoResolucion: c.tiempoResolucion,
    });
    setShowForm(true);
  };

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = {
        prioridadId: form.prioridadId,
        categoriaId: form.categoriaId || null,
        tiempoRespuesta: form.tiempoRespuesta,
        tiempoResolucion: form.tiempoResolucion,
      };
      return editing
        ? api.updateConfiguracion(editing.id, payload)
        : api.createConfiguracion(payload);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sla-configs'] }); resetForm(); toast.success('Configuración guardada'); },
    onError: (err: any) => toast.error(err?.response?.data || 'Error al guardar'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteConfiguracion(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sla-configs'] }); toast.success('Eliminado'); },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          Configurá tiempos de respuesta y resolución por prioridad (y opcionalmente por categoría).
          Si existe una regla específica para prioridad+categoría, tiene precedencia.
        </p>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition flex-shrink-0 ml-4"
        >
          <Plus size={14} /> Nueva regla
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 space-y-4">
          <h3 className="text-sm font-semibold text-gray-800">{editing ? 'Editar regla' : 'Nueva regla SLA'}</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Prioridad *</label>
              <select
                value={form.prioridadId}
                onChange={e => setForm(f => ({ ...f, prioridadId: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="">Seleccionar...</option>
                {prioridades.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Categoría (opcional)</label>
              <select
                value={form.categoriaId}
                onChange={e => setForm(f => ({ ...f, categoriaId: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="">Todas las categorías</option>
                {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Tiempo de respuesta (horas)</label>
              <input
                type="number" min={1} max={999}
                value={form.tiempoRespuesta}
                onChange={e => setForm(f => ({ ...f, tiempoRespuesta: +e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Tiempo de resolución (horas)</label>
              <input
                type="number" min={1} max={999}
                value={form.tiempoResolucion}
                onChange={e => setForm(f => ({ ...f, tiempoResolucion: +e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => saveMutation.mutate()}
              disabled={!form.prioridadId || saveMutation.isPending}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition"
            >
              {saveMutation.isPending ? 'Guardando...' : 'Guardar'}
            </button>
            <button onClick={resetForm} className="px-4 py-2 text-gray-500 border border-gray-200 rounded-lg text-sm hover:bg-gray-50 transition">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      {isLoading ? (
        <div className="py-8 text-center text-gray-400 text-sm">Cargando...</div>
      ) : configs.length === 0 ? (
        <div className="py-12 text-center">
          <Timer size={32} className="mx-auto text-gray-300 mb-2" />
          <p className="text-gray-500 text-sm">No hay reglas SLA configuradas</p>
          <p className="text-gray-400 text-xs mt-1">Se usarán los tiempos definidos en cada prioridad como fallback</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Prioridad</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Categoría</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Respuesta</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Resolución</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {configs.map(c => (
                <tr key={c.id} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3">
                    <span
                      className="text-xs font-semibold px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: c.prioridadColor + '20', color: c.prioridadColor }}
                    >
                      {c.prioridad}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-xs">
                    {c.categoria ?? <span className="text-gray-400 italic">Todas</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1 text-gray-700">
                      <Clock size={12} className="text-gray-400" /> {c.tiempoRespuesta}h
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1 text-gray-700">
                      <Timer size={12} className="text-gray-400" /> {c.tiempoResolucion}h
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEdit(c)}
                        className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition text-xs"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => { if (confirm('¿Eliminar esta regla?')) deleteMutation.mutate(c.id); }}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

type Tab = 'horario' | 'configuraciones';

export default function SLAConfigPage() {
  const [tab, setTab] = useState<Tab>('horario');

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Clock className="text-indigo-500" size={22} /> Configuración de SLA
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Definí el horario laboral de tu empresa y los tiempos de resolución por prioridad.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {([
          { key: 'horario',         label: 'Horario Laboral', icon: Calendar },
          { key: 'configuraciones', label: 'Reglas SLA',       icon: Timer    },
        ] as const).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition -mb-px
              ${tab === key
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {tab === 'horario'         && <HorarioTab />}
      {tab === 'configuraciones' && <ConfiguracionesTab />}
    </div>
  );
}
