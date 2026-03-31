import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus, Edit3, Trash2, Building2, MapPin, ToggleLeft, ToggleRight, Users, Link2 } from 'lucide-react';
import apiClient from '../../api/client';

// ── Types ─────────────────────────────────────────────────────────
interface SucursalItem {
  id: string; nombre: string; direccion?: string; activo: boolean; usuariosCount: number;
}
interface AreaItem {
  id: string; nombre: string; descripcion?: string; activo: boolean;
  helpDeskId?: string; helpDesk?: string; usuariosCount: number;
}
interface HelpDeskOption { id: string; nombre: string; }

// ── API helpers ───────────────────────────────────────────────────
const api = {
  getSucursales:  () => apiClient.get<SucursalItem[]>('/organizacion/sucursales').then(r => r.data),
  createSucursal: (d: { nombre: string; direccion?: string }) => apiClient.post('/organizacion/sucursales', d),
  updateSucursal: (id: string, d: { nombre: string; direccion?: string }) => apiClient.put(`/organizacion/sucursales/${id}`, d),
  toggleSucursal: (id: string) => apiClient.patch(`/organizacion/sucursales/${id}/toggle`),
  deleteSucursal: (id: string) => apiClient.delete(`/organizacion/sucursales/${id}`),

  getAreas:  () => apiClient.get<AreaItem[]>('/organizacion/areas').then(r => r.data),
  createArea: (d: { nombre: string; descripcion?: string; helpDeskId?: string }) => apiClient.post('/organizacion/areas', d),
  updateArea: (id: string, d: { nombre: string; descripcion?: string; helpDeskId?: string }) => apiClient.put(`/organizacion/areas/${id}`, d),
  toggleArea: (id: string) => apiClient.patch(`/organizacion/areas/${id}/toggle`),
  deleteArea: (id: string) => apiClient.delete(`/organizacion/areas/${id}`),

  getHelpDesks: () => apiClient.get<HelpDeskOption[]>('/helpdesks').then(r => r.data),
};

// ── Sucursales Tab ────────────────────────────────────────────────
function SucursalesTab() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<SucursalItem | null>(null);
  const [form, setForm] = useState({ nombre: '', direccion: '' });

  const { data: sucursales = [], isLoading } = useQuery({ queryKey: ['org-sucursales'], queryFn: api.getSucursales });

  const openCreate = () => { setEditing(null); setForm({ nombre: '', direccion: '' }); setShowForm(true); };
  const openEdit = (s: SucursalItem) => { setEditing(s); setForm({ nombre: s.nombre, direccion: s.direccion ?? '' }); setShowForm(true); };

  const saveMutation = useMutation({
    mutationFn: () => editing
      ? api.updateSucursal(editing.id, { nombre: form.nombre, direccion: form.direccion || undefined })
      : api.createSucursal({ nombre: form.nombre, direccion: form.direccion || undefined }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['org-sucursales'] });
      qc.invalidateQueries({ queryKey: ['sucursales'] });
      toast.success(editing ? 'Sucursal actualizada' : 'Sucursal creada');
      setShowForm(false); setEditing(null);
    },
    onError: () => toast.error('Error al guardar'),
  });

  const toggleMutation = useMutation({
    mutationFn: (id: string) => api.toggleSucursal(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['org-sucursales'] }); qc.invalidateQueries({ queryKey: ['sucursales'] }); },
    onError: () => toast.error('Error'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteSucursal(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['org-sucursales'] }); qc.invalidateQueries({ queryKey: ['sucursales'] }); toast.success('Sucursal eliminada'); },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'No se puede eliminar'),
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500">Oficinas o puntos de atención de la organización</p>
        <button onClick={openCreate} className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition">
          <Plus className="h-4 w-4" /> Nueva Sucursal
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3">
          <h3 className="font-semibold text-gray-800">{editing ? 'Editar Sucursal' : 'Nueva Sucursal'}</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Nombre *</label>
              <input value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ej: Casa Central" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Dirección</label>
              <input value={form.direccion} onChange={e => setForm(f => ({ ...f, direccion: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ej: Av. Corrientes 1234" />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => { setShowForm(false); setEditing(null); }} className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50">Cancelar</button>
            <button onClick={() => saveMutation.mutate()} disabled={!form.nombre.trim() || saveMutation.isPending}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium">
              {saveMutation.isPending ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </div>
      )}

      {/* List */}
      {isLoading ? (
        <div className="text-center py-8 text-gray-400 text-sm">Cargando...</div>
      ) : sucursales.length === 0 ? (
        <div className="text-center py-8 text-gray-400 text-sm">No hay sucursales creadas</div>
      ) : (
        <div className="divide-y divide-gray-100 border border-gray-200 rounded-xl overflow-hidden">
          {sucursales.map(s => (
            <div key={s.id} className={`flex items-center gap-3 px-4 py-3 bg-white ${!s.activo ? 'opacity-50' : ''}`}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-800 text-sm">{s.nombre}</span>
                  {!s.activo && <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">Inactiva</span>}
                </div>
                {s.direccion && <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5"><MapPin className="h-3 w-3" />{s.direccion}</p>}
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-400">
                <Users className="h-3.5 w-3.5" />{s.usuariosCount}
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => openEdit(s)} className="p-1.5 hover:bg-gray-100 rounded-lg transition" title="Editar">
                  <Edit3 className="h-4 w-4 text-gray-500" />
                </button>
                <button onClick={() => toggleMutation.mutate(s.id)} className="p-1.5 hover:bg-gray-100 rounded-lg transition" title={s.activo ? 'Desactivar' : 'Activar'}>
                  {s.activo ? <ToggleRight className="h-4 w-4 text-green-500" /> : <ToggleLeft className="h-4 w-4 text-gray-400" />}
                </button>
                <button onClick={() => { if (confirm(`¿Eliminar "${s.nombre}"?`)) deleteMutation.mutate(s.id); }}
                  className="p-1.5 hover:bg-red-50 rounded-lg transition" title="Eliminar">
                  <Trash2 className="h-4 w-4 text-red-400" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Áreas Tab ─────────────────────────────────────────────────────
function AreasTab() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<AreaItem | null>(null);
  const [form, setForm] = useState({ nombre: '', descripcion: '', helpDeskId: '' });

  const { data: areas = [], isLoading } = useQuery({ queryKey: ['org-areas'], queryFn: api.getAreas });
  const { data: helpdesks = [] } = useQuery({ queryKey: ['helpdesks'], queryFn: api.getHelpDesks });

  const openCreate = () => { setEditing(null); setForm({ nombre: '', descripcion: '', helpDeskId: '' }); setShowForm(true); };
  const openEdit = (a: AreaItem) => { setEditing(a); setForm({ nombre: a.nombre, descripcion: a.descripcion ?? '', helpDeskId: a.helpDeskId ?? '' }); setShowForm(true); };

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = { nombre: form.nombre, descripcion: form.descripcion || undefined, helpDeskId: form.helpDeskId || undefined };
      return editing ? api.updateArea(editing.id, payload) : api.createArea(payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['org-areas'] });
      qc.invalidateQueries({ queryKey: ['areas'] });
      toast.success(editing ? 'Área actualizada' : 'Área creada');
      setShowForm(false); setEditing(null);
    },
    onError: () => toast.error('Error al guardar'),
  });

  const toggleMutation = useMutation({
    mutationFn: (id: string) => api.toggleArea(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['org-areas'] }); qc.invalidateQueries({ queryKey: ['areas'] }); },
    onError: () => toast.error('Error'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteArea(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['org-areas'] }); qc.invalidateQueries({ queryKey: ['areas'] }); toast.success('Área eliminada'); },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'No se puede eliminar'),
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500">Departamentos o áreas funcionales. Vinculándolas a un Help Desk, los agentes de esa área solo verán sus tickets.</p>
        <button onClick={openCreate} className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition">
          <Plus className="h-4 w-4" /> Nueva Área
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3">
          <h3 className="font-semibold text-gray-800">{editing ? 'Editar Área' : 'Nueva Área'}</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Nombre *</label>
              <input value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ej: Tecnología / IT" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Portal de Help Desk vinculado</label>
              <select value={form.helpDeskId} onChange={e => setForm(f => ({ ...f, helpDeskId: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Sin portal (área interna)</option>
                {helpdesks.map(h => <option key={h.id} value={h.id}>{h.nombre}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Descripción</label>
              <input value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ej: Soporte técnico, hardware, software e infraestructura" />
            </div>
          </div>
          {form.helpDeskId && (
            <p className="text-xs text-blue-700 bg-blue-100 px-3 py-2 rounded-lg">
              Los agentes asignados a esta área solo verán los tickets del portal seleccionado.
            </p>
          )}
          <div className="flex gap-2 justify-end">
            <button onClick={() => { setShowForm(false); setEditing(null); }} className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50">Cancelar</button>
            <button onClick={() => saveMutation.mutate()} disabled={!form.nombre.trim() || saveMutation.isPending}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium">
              {saveMutation.isPending ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </div>
      )}

      {/* List */}
      {isLoading ? (
        <div className="text-center py-8 text-gray-400 text-sm">Cargando...</div>
      ) : areas.length === 0 ? (
        <div className="text-center py-8 text-gray-400 text-sm">No hay áreas creadas</div>
      ) : (
        <div className="divide-y divide-gray-100 border border-gray-200 rounded-xl overflow-hidden">
          {areas.map(a => (
            <div key={a.id} className={`flex items-center gap-3 px-4 py-3 bg-white ${!a.activo ? 'opacity-50' : ''}`}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-gray-800 text-sm">{a.nombre}</span>
                  {!a.activo && <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">Inactiva</span>}
                  {a.helpDesk && (
                    <span className="text-xs bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded flex items-center gap-1">
                      <Link2 className="h-3 w-3" />{a.helpDesk}
                    </span>
                  )}
                </div>
                {a.descripcion && <p className="text-xs text-gray-500 mt-0.5">{a.descripcion}</p>}
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-400">
                <Users className="h-3.5 w-3.5" />{a.usuariosCount}
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => openEdit(a)} className="p-1.5 hover:bg-gray-100 rounded-lg transition" title="Editar">
                  <Edit3 className="h-4 w-4 text-gray-500" />
                </button>
                <button onClick={() => toggleMutation.mutate(a.id)} className="p-1.5 hover:bg-gray-100 rounded-lg transition" title={a.activo ? 'Desactivar' : 'Activar'}>
                  {a.activo ? <ToggleRight className="h-4 w-4 text-green-500" /> : <ToggleLeft className="h-4 w-4 text-gray-400" />}
                </button>
                <button onClick={() => { if (confirm(`¿Eliminar "${a.nombre}"?`)) deleteMutation.mutate(a.id); }}
                  className="p-1.5 hover:bg-red-50 rounded-lg transition" title="Eliminar">
                  <Trash2 className="h-4 w-4 text-red-400" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────
export default function OrganizacionPage() {
  const [tab, setTab] = useState<'sucursales' | 'areas'>('sucursales');

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Organización</h1>
        <p className="text-sm text-gray-500 mt-0.5">Administrá las sucursales y áreas de la empresa</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        <button
          onClick={() => setTab('sucursales')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition ${
            tab === 'sucursales' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Building2 className="h-4 w-4" /> Sucursales
        </button>
        <button
          onClick={() => setTab('areas')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition ${
            tab === 'areas' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <MapPin className="h-4 w-4" /> Áreas
        </button>
      </div>

      {/* Tab content */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        {tab === 'sucursales' ? <SucursalesTab /> : <AreasTab />}
      </div>
    </div>
  );
}
