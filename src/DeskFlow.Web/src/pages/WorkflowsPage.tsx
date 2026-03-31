import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Workflow, Plus, Search, Trash2, Edit3, CheckCircle, XCircle, Clock } from 'lucide-react';
import { workflowsApi } from '../api/workflows';
import { toast } from 'sonner';

const TIPO_COLOR: Record<string, string> = {
  General:  'bg-gray-100 text-gray-700',
  Servicio: 'bg-blue-100 text-blue-700',
  Cambio:   'bg-purple-100 text-purple-700',
};

export default function WorkflowsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ nombre: '', descripcion: '', tipo: 'General' });

  const { data: workflows = [], isLoading } = useQuery({
    queryKey: ['workflows'],
    queryFn: workflowsApi.getAll,
  });

  const createMutation = useMutation({
    mutationFn: () => workflowsApi.create(form),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
      navigate(`/workflows/${data.id}`);
    },
    onError: () => toast.error('Error al crear el workflow'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => workflowsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
      toast.success('Workflow eliminado');
    },
  });

  const filtered = workflows.filter(w =>
    w.nombre.toLowerCase().includes(search.toLowerCase()) ||
    (w.descripcion ?? '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Workflow className="text-indigo-500" size={24} />
            Workflow Builder
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Diseñá flujos visuales para servicios, cambios y procesos de ITSM
          </p>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
        >
          <Plus size={16} /> Nuevo Workflow
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Workflows', value: workflows.length, color: 'bg-gray-100 text-gray-700' },
          { label: 'Activos', value: workflows.filter(w => w.activo).length, color: 'bg-green-50 text-green-700' },
          { label: 'Nodos totales', value: workflows.reduce((s, w) => s + w.cantidadNodos, 0), color: 'bg-indigo-50 text-indigo-700' },
        ].map(s => (
          <div key={s.label} className={`rounded-xl p-4 ${s.color}`}>
            <div className="text-2xl font-bold">{s.value}</div>
            <div className="text-sm mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative w-72">
        <Search className="absolute left-3 top-2.5 text-gray-400" size={14} />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar workflows..."
          className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full"
        />
      </div>

      {/* List */}
      {isLoading ? (
        <div className="text-center py-12 text-gray-400">Cargando...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <Workflow size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">No hay workflows aún</p>
          <button onClick={() => setCreating(true)} className="mt-4 text-sm text-indigo-600 hover:text-indigo-700 font-medium">
            Crear el primer workflow
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {filtered.map(w => (
            <div
              key={w.id}
              className="bg-white border border-gray-200 rounded-xl p-4 hover:border-indigo-300 hover:shadow-sm transition-all flex items-center gap-4 cursor-pointer"
              onClick={() => navigate(`/workflows/${w.id}`)}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-900">{w.nombre}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TIPO_COLOR[w.tipo] ?? 'bg-gray-100 text-gray-600'}`}>
                    {w.tipo}
                  </span>
                  {w.activo
                    ? <CheckCircle size={14} className="text-green-500" />
                    : <XCircle size={14} className="text-gray-400" />
                  }
                </div>
                {w.descripcion && <p className="text-sm text-gray-500 mt-0.5 truncate">{w.descripcion}</p>}
                <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                  <span>{w.cantidadNodos} nodos</span>
                  {w.servicioNombre && <span>· {w.servicioNombre}</span>}
                  {w.creadoPorNombre && <span>· {w.creadoPorNombre}</span>}
                  <span className="flex items-center gap-1">
                    <Clock size={10} />
                    {new Date(w.fechaCreacion).toLocaleDateString('es-AR')}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={e => { e.stopPropagation(); navigate(`/workflows/${w.id}`); }}
                  className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                  title="Editar"
                >
                  <Edit3 size={14} />
                </button>
                <button
                  onClick={e => {
                    e.stopPropagation();
                    if (confirm(`¿Eliminar "${w.nombre}"?`)) deleteMutation.mutate(w.id);
                  }}
                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                  title="Eliminar"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create modal */}
      {creating && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl space-y-4">
            <h2 className="text-lg font-bold text-gray-900">Nuevo Workflow</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
              <input
                value={form.nombre}
                onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                autoFocus
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Ej: Solicitud de Laptop"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
              <textarea
                value={form.descripcion}
                onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                rows={2}
                placeholder="Para qué sirve este workflow..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
              <select
                value={form.tipo}
                onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="General">General</option>
                <option value="Servicio">Catálogo de Servicios</option>
                <option value="Cambio">Change Management</option>
              </select>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => createMutation.mutate()}
                disabled={!form.nombre.trim() || createMutation.isPending}
                className="flex-1 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                {createMutation.isPending ? 'Creando...' : 'Crear y abrir editor'}
              </button>
              <button
                onClick={() => setCreating(false)}
                className="px-4 py-2 text-gray-600 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
