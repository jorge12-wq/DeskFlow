import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Layers, ChevronDown, Plus, Edit3, Trash2, Check, X, Power } from 'lucide-react';
import { toast } from 'sonner';
import apiClient from '../../api/client';

interface Subcategoria { id: string; nombre: string; descripcion?: string; activo: boolean; }
interface Categoria { id: string; nombre: string; descripcion?: string; icono?: string; activo: boolean; subcategorias: Subcategoria[]; }

const api = {
  getCategorias: () => apiClient.get<Categoria[]>('/admin/categorias').then(r => r.data),
  createCategoria: (d: { nombre: string; descripcion?: string; icono?: string }) =>
    apiClient.post<Categoria>('/admin/categorias', d).then(r => r.data),
  updateCategoria: (id: string, d: { nombre: string; descripcion?: string; icono?: string }) =>
    apiClient.put<Categoria>(`/admin/categorias/${id}`, d).then(r => r.data),
  toggleCategoria: (id: string) =>
    apiClient.patch(`/admin/categorias/${id}/toggle`).then(r => r.data),
  deleteCategoria: (id: string) =>
    apiClient.delete(`/admin/categorias/${id}`),
  createSub: (catId: string, d: { nombre: string; descripcion?: string }) =>
    apiClient.post<Subcategoria>(`/admin/categorias/${catId}/subcategorias`, d).then(r => r.data),
  updateSub: (catId: string, subId: string, d: { nombre: string; descripcion?: string }) =>
    apiClient.put<Subcategoria>(`/admin/categorias/${catId}/subcategorias/${subId}`, d).then(r => r.data),
  toggleSub: (catId: string, subId: string) =>
    apiClient.patch(`/admin/categorias/${catId}/subcategorias/${subId}/toggle`).then(r => r.data),
  deleteSub: (catId: string, subId: string) =>
    apiClient.delete(`/admin/categorias/${catId}/subcategorias/${subId}`),
};

export default function CategoriesPage() {
  const qc = useQueryClient();
  const { data: categorias = [], isLoading } = useQuery({ queryKey: ['admin-categorias'], queryFn: api.getCategorias, staleTime: 0 });
  const [expanded, setExpanded] = useState<string | null>(null);

  // ── Categoría form state ─────────────────────────────────────
  const [nuevaCat, setNuevaCat] = useState(false);
  const [editCatId, setEditCatId] = useState<string | null>(null);
  const [catNombre, setCatNombre] = useState('');
  const [catDesc, setCatDesc] = useState('');

  // ── Subcategoría form state ──────────────────────────────────
  const [nuevaSub, setNuevaSub] = useState<string | null>(null); // catId
  const [editSubId, setEditSubId] = useState<string | null>(null);
  const [editSubCatId, setEditSubCatId] = useState<string | null>(null);
  const [subNombre, setSubNombre] = useState('');

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['admin-categorias'] });
    qc.invalidateQueries({ queryKey: ['categorias'] });
  };

  const createCatMut = useMutation({
    mutationFn: () => api.createCategoria({ nombre: catNombre.trim(), descripcion: catDesc.trim() || undefined }),
    onSuccess: () => { invalidate(); setNuevaCat(false); setCatNombre(''); setCatDesc(''); toast.success('Categoría creada'); },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Error al crear la categoría'),
  });

  const updateCatMut = useMutation({
    mutationFn: (id: string) => api.updateCategoria(id, { nombre: catNombre.trim(), descripcion: catDesc.trim() || undefined }),
    onSuccess: () => { invalidate(); setEditCatId(null); toast.success('Categoría actualizada'); },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Error al actualizar'),
  });

  const toggleCatMut = useMutation({
    mutationFn: api.toggleCategoria,
    onSuccess: () => { invalidate(); },
    onError: () => toast.error('Error al cambiar estado'),
  });

  const deleteCatMut = useMutation({
    mutationFn: api.deleteCategoria,
    onSuccess: () => { invalidate(); toast.success('Categoría eliminada'); },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Error al eliminar'),
  });

  const createSubMut = useMutation({
    mutationFn: (catId: string) => api.createSub(catId, { nombre: subNombre.trim() }),
    onSuccess: () => { invalidate(); setNuevaSub(null); setSubNombre(''); toast.success('Subcategoría agregada'); },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Error al agregar'),
  });

  const updateSubMut = useMutation({
    mutationFn: ({ catId, subId }: { catId: string; subId: string }) => api.updateSub(catId, subId, { nombre: subNombre.trim() }),
    onSuccess: () => { invalidate(); setEditSubId(null); setEditSubCatId(null); toast.success('Subcategoría actualizada'); },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Error al actualizar'),
  });

  const toggleSubMut = useMutation({
    mutationFn: ({ catId, subId }: { catId: string; subId: string }) => api.toggleSub(catId, subId),
    onSuccess: () => { invalidate(); },
    onError: () => toast.error('Error al cambiar estado'),
  });

  const deleteSubMut = useMutation({
    mutationFn: ({ catId, subId }: { catId: string; subId: string }) => api.deleteSub(catId, subId),
    onSuccess: () => { invalidate(); toast.success('Subcategoría eliminada'); },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Error al eliminar'),
  });

  const startEditCat = (cat: Categoria) => {
    setEditCatId(cat.id);
    setCatNombre(cat.nombre);
    setCatDesc(cat.descripcion ?? '');
    setNuevaCat(false);
  };

  const startEditSub = (catId: string, sub: Subcategoria) => {
    setEditSubId(sub.id);
    setEditSubCatId(catId);
    setSubNombre(sub.nombre);
    setNuevaSub(null);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Categorías</h1>
          <p className="text-gray-500 text-sm mt-1">{categorias.length} categorías configuradas</p>
        </div>
        <button
          onClick={() => { setNuevaCat(true); setCatNombre(''); setCatDesc(''); setEditCatId(null); }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition"
        >
          <Plus className="h-4 w-4" /> Nueva categoría
        </button>
      </div>

      {/* Nueva categoría form */}
      {nuevaCat && (
        <div className="bg-white border border-blue-200 rounded-xl p-4 space-y-3">
          <h3 className="text-sm font-semibold text-gray-800">Nueva categoría</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Nombre *</label>
              <input value={catNombre} onChange={e => setCatNombre(e.target.value)} placeholder="Ej: Recursos Humanos"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Descripción</label>
              <input value={catDesc} onChange={e => setCatDesc(e.target.value)} placeholder="Descripción opcional"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setNuevaCat(false)} className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 flex items-center gap-1">
              <X className="h-3.5 w-3.5" /> Cancelar
            </button>
            <button onClick={() => createCatMut.mutate()} disabled={!catNombre.trim() || createCatMut.isPending}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium flex items-center gap-1">
              <Check className="h-3.5 w-3.5" /> Guardar
            </button>
          </div>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {categorias.map(cat => (
              <div key={cat.id}>
                {/* Categoría row */}
                {editCatId === cat.id ? (
                  <div className="px-5 py-3 bg-blue-50 space-y-2">
                    <div className="grid grid-cols-2 gap-3">
                      <input value={catNombre} onChange={e => setCatNombre(e.target.value)} placeholder="Nombre"
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      <input value={catDesc} onChange={e => setCatDesc(e.target.value)} placeholder="Descripción"
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => setEditCatId(null)} className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 flex items-center gap-1">
                        <X className="h-3.5 w-3.5" /> Cancelar
                      </button>
                      <button onClick={() => updateCatMut.mutate(cat.id)} disabled={!catNombre.trim() || updateCatMut.isPending}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium flex items-center gap-1">
                        <Check className="h-3.5 w-3.5" /> Guardar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between px-5 py-3 hover:bg-gray-50">
                    <button className="flex items-center gap-3 flex-1 text-left" onClick={() => setExpanded(expanded === cat.id ? null : cat.id)}>
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${cat.activo ? 'bg-blue-100' : 'bg-gray-100'}`}>
                        <Layers className={`h-4 w-4 ${cat.activo ? 'text-blue-600' : 'text-gray-400'}`} />
                      </div>
                      <div>
                        <p className={`font-medium ${cat.activo ? 'text-gray-900' : 'text-gray-400'}`}>{cat.nombre}</p>
                        <p className="text-xs text-gray-500">{cat.subcategorias.length} subcategorías{cat.descripcion ? ` · ${cat.descripcion}` : ''}</p>
                      </div>
                      <ChevronDown className={`h-4 w-4 text-gray-400 ml-2 transition-transform ${expanded === cat.id ? 'rotate-180' : ''}`} />
                    </button>
                    <div className="flex items-center gap-1 ml-3 flex-shrink-0">
                      <button onClick={() => startEditCat(cat)} className="p-1.5 text-gray-400 hover:text-blue-600 rounded-md hover:bg-blue-50" title="Editar">
                        <Edit3 className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => toggleCatMut.mutate(cat.id)} className="p-1.5 text-gray-400 hover:text-amber-600 rounded-md hover:bg-amber-50" title={cat.activo ? 'Desactivar' : 'Activar'}>
                        <Power className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => { if (confirm(`¿Eliminar "${cat.nombre}"?`)) deleteCatMut.mutate(cat.id); }}
                        className="p-1.5 text-gray-400 hover:text-red-600 rounded-md hover:bg-red-50" title="Eliminar">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Subcategorías panel */}
                {expanded === cat.id && (
                  <div className="bg-gray-50 px-5 py-3 space-y-1 border-t border-gray-100">
                    {cat.subcategorias.map(sub => (
                      <div key={sub.id}>
                        {editSubId === sub.id && editSubCatId === cat.id ? (
                          <div className="flex items-center gap-2 pl-10 py-1">
                            <input value={subNombre} onChange={e => setSubNombre(e.target.value)} placeholder="Nombre"
                              className="flex-1 px-2 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                            <button onClick={() => setEditSubId(null)} className="p-1 text-gray-400 hover:text-gray-600"><X className="h-3.5 w-3.5" /></button>
                            <button onClick={() => updateSubMut.mutate({ catId: cat.id, subId: sub.id })} disabled={!subNombre.trim()}
                              className="p-1 text-blue-600 hover:text-blue-700 disabled:opacity-40"><Check className="h-3.5 w-3.5" /></button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between py-1.5 pl-10 group">
                            <div className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full flex-shrink-0" />
                              <span className={`text-sm ${sub.activo ? 'text-gray-700' : 'text-gray-400 line-through'}`}>{sub.nombre}</span>
                            </div>
                            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => startEditSub(cat.id, sub)} className="p-1 text-gray-400 hover:text-blue-600 rounded-md hover:bg-blue-50">
                                <Edit3 className="h-3 w-3" />
                              </button>
                              <button onClick={() => toggleSubMut.mutate({ catId: cat.id, subId: sub.id })} className="p-1 text-gray-400 hover:text-amber-600 rounded-md hover:bg-amber-50">
                                <Power className="h-3 w-3" />
                              </button>
                              <button onClick={() => { if (confirm(`¿Eliminar "${sub.nombre}"?`)) deleteSubMut.mutate({ catId: cat.id, subId: sub.id }); }}
                                className="p-1 text-gray-400 hover:text-red-600 rounded-md hover:bg-red-50">
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}

                    {/* Nueva subcategoría form */}
                    {nuevaSub === cat.id ? (
                      <div className="flex items-center gap-2 pl-10 py-1.5">
                        <span className="w-1.5 h-1.5 bg-blue-400 rounded-full flex-shrink-0" />
                        <input
                          value={subNombre} onChange={e => setSubNombre(e.target.value)}
                          placeholder="Nombre de la subcategoría" autoFocus
                          onKeyDown={e => e.key === 'Enter' && subNombre.trim() && createSubMut.mutate(cat.id)}
                          className="flex-1 px-2 py-1 border border-blue-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button onClick={() => { setNuevaSub(null); setSubNombre(''); }} className="p-1 text-gray-400 hover:text-gray-600"><X className="h-3.5 w-3.5" /></button>
                        <button onClick={() => createSubMut.mutate(cat.id)} disabled={!subNombre.trim() || createSubMut.isPending}
                          className="p-1 text-blue-600 hover:text-blue-700 disabled:opacity-40"><Check className="h-3.5 w-3.5" /></button>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setNuevaSub(cat.id); setSubNombre(''); setEditSubId(null); }}
                        className="flex items-center gap-2 pl-10 py-1.5 text-xs text-blue-600 hover:text-blue-700 font-medium"
                      >
                        <Plus className="h-3 w-3" /> Agregar subcategoría
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
            {!categorias.length && (
              <p className="text-center text-gray-400 py-12 text-sm">No hay categorías configuradas</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
