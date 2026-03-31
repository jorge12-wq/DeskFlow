import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LayoutDashboard, Settings, Eye, EyeOff, GripVertical, Save, RotateCcw, Star } from 'lucide-react';
import { gamificacionApi, type WidgetConfig } from '../api/gamificacion';

// Mini widget previews
function WidgetPreview({ tipo }: { tipo: string }) {
  const previews: Record<string, React.ReactNode> = {
    stats_resumen: (
      <div className="grid grid-cols-2 gap-1 p-2">
        {['Abiertos', 'Cerrados', 'Pendientes', 'En progreso'].map(l => (
          <div key={l} className="bg-gray-100 rounded p-1 text-center">
            <div className="font-bold text-gray-700 text-xs">—</div>
            <div className="text-gray-400 text-[10px]">{l}</div>
          </div>
        ))}
      </div>
    ),
    tickets_por_estado: (
      <div className="p-2 space-y-1">
        {['Abierto', 'En progreso', 'Cerrado'].map((s, i) => (
          <div key={s} className="flex items-center gap-1">
            <div className="h-2 rounded-full bg-blue-400" style={{ width: `${[60, 30, 80][i]}%` }} />
            <span className="text-[10px] text-gray-400">{s}</span>
          </div>
        ))}
      </div>
    ),
    tickets_por_prioridad: (
      <div className="p-2 space-y-1">
        {[['Crítica', '#EF4444'], ['Alta', '#F59E0B'], ['Media', '#3B82F6'], ['Baja', '#10B981']].map(([l, c]) => (
          <div key={l} className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: c as string }} />
            <div className="flex-1 h-2 rounded-full bg-gray-100">
              <div className="h-2 rounded-full" style={{ width: '40%', backgroundColor: c as string }} />
            </div>
          </div>
        ))}
      </div>
    ),
    tendencia_semanal: (
      <div className="p-2 flex items-end gap-1 h-12">
        {[4, 7, 5, 9, 6, 8, 5].map((v, i) => (
          <div key={i} className="flex-1 bg-blue-400 rounded-sm" style={{ height: `${v * 8}px` }} />
        ))}
      </div>
    ),
    sla_cumplimiento: (
      <div className="p-2 flex items-center justify-center">
        <div className="relative w-16 h-16">
          <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
            <circle cx="18" cy="18" r="15.9" fill="none" stroke="#E5E7EB" strokeWidth="3" />
            <circle cx="18" cy="18" r="15.9" fill="none" stroke="#3B82F6" strokeWidth="3"
              strokeDasharray="85 15" strokeLinecap="round" />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-gray-700">85%</span>
        </div>
      </div>
    ),
    top_agentes: (
      <div className="p-2 space-y-1">
        {['Agente A', 'Agente B', 'Agente C'].map((a, i) => (
          <div key={a} className="flex items-center gap-1 text-[10px] text-gray-500">
            <span className="font-bold">{i + 1}.</span>
            <span>{a}</span>
            <span className="ml-auto">{[42, 38, 31][i]} tickets</span>
          </div>
        ))}
      </div>
    ),
    tickets_por_categoria: (
      <div className="p-2 space-y-1">
        {['Hardware', 'Software', 'Red'].map((c, i) => (
          <div key={c} className="flex items-center gap-1">
            <div className="h-2 rounded-full bg-purple-400" style={{ width: `${[70, 45, 30][i]}%` }} />
            <span className="text-[10px] text-gray-400">{c}</span>
          </div>
        ))}
      </div>
    ),
    csat_promedio: (
      <div className="p-2 flex flex-col items-center justify-center">
        <div className="text-2xl font-bold text-amber-500">4.3</div>
        <div className="flex gap-0.5 text-amber-400 text-xs">
          {[0, 1, 2, 3].map(i => <Star key={i} className="h-3 w-3 fill-current" />)}
          <Star className="h-3 w-3" />
        </div>
        <div className="text-[10px] text-gray-400">promedio CSAT</div>
      </div>
    ),
  };

  return (
    <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden min-h-[80px]">
      {previews[tipo] ?? <div className="p-3 text-xs text-gray-400 text-center">Vista previa no disponible</div>}
    </div>
  );
}

export default function DashboardPersonalizadoPage() {
  const qc = useQueryClient();
  const [editMode, setEditMode] = useState(false);
  const [widgets, setWidgets] = useState<WidgetConfig[]>([]);
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  const { data: savedWidgets, isLoading } = useQuery({
    queryKey: ['mis-widgets'],
    queryFn: gamificacionApi.getMisWidgets,
  });

  useEffect(() => {
    if (savedWidgets) setWidgets(savedWidgets);
  }, [savedWidgets]);

  const { mutate: saveWidgets, isPending: saving } = useMutation({
    mutationFn: gamificacionApi.saveWidgets,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['mis-widgets'] });
      setEditMode(false);
    },
  });

  const toggleVisible = (id: string) => {
    setWidgets(ws => ws.map(w => w.id === id ? { ...w, visible: !w.visible } : w));
  };

  const handleDragStart = (idx: number) => setDragIdx(idx);
  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (dragIdx === null || dragIdx === idx) return;
    const updated = [...widgets];
    const [moved] = updated.splice(dragIdx, 1);
    updated.splice(idx, 0, moved);
    const reordered = updated.map((w, i) => ({ ...w, orden: i + 1 }));
    setWidgets(reordered);
    setDragIdx(idx);
  };
  const handleDragEnd = () => setDragIdx(null);

  const reset = () => {
    if (savedWidgets) setWidgets(savedWidgets);
    setEditMode(false);
  };

  const visibleWidgets = widgets.filter(w => w.visible).sort((a, b) => a.orden - b.orden);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
            <LayoutDashboard size={20} className="text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Mi Dashboard</h1>
            <p className="text-sm text-gray-500">Panel personalizable</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {editMode ? (
            <>
              <button onClick={reset}
                className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">
                <RotateCcw size={14} />
                Cancelar
              </button>
              <button onClick={() => saveWidgets(widgets)} disabled={saving}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50">
                <Save size={14} />
                {saving ? 'Guardando…' : 'Guardar'}
              </button>
            </>
          ) : (
            <button onClick={() => setEditMode(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">
              <Settings size={14} />
              Personalizar
            </button>
          )}
        </div>
      </div>

      {/* Edit mode — widget configurator */}
      {editMode && (
        <div className="bg-white rounded-2xl border border-blue-200 p-6 shadow-sm">
          <p className="text-sm font-semibold text-gray-700 mb-4">
            Arrastrá para reordenar · Hacé clic en el ojo para ocultar/mostrar
          </p>
          <div className="space-y-2">
            {widgets.sort((a, b) => a.orden - b.orden).map((w, idx) => (
              <div
                key={w.id}
                draggable
                onDragStart={() => handleDragStart(idx)}
                onDragOver={(e) => handleDragOver(e, idx)}
                onDragEnd={handleDragEnd}
                className={`flex items-center gap-3 p-3 rounded-xl border cursor-grab active:cursor-grabbing transition-all ${
                  dragIdx === idx ? 'border-blue-300 bg-blue-50 scale-[0.98]' : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <GripVertical size={16} className="text-gray-400 flex-shrink-0" />
                <span className="text-sm flex-1 font-medium text-gray-700">{w.titulo}</span>
                <button onClick={() => toggleVisible(w.id)}
                  className={`p-1 rounded-lg transition-colors ${w.visible ? 'text-blue-600 hover:bg-blue-50' : 'text-gray-400 hover:bg-gray-50'}`}>
                  {w.visible ? <Eye size={16} /> : <EyeOff size={16} />}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dashboard widgets grid */}
      {visibleWidgets.length === 0 ? (
        <div className="text-center py-16 text-gray-400 border-2 border-dashed border-gray-200 rounded-2xl">
          <EyeOff size={40} className="mx-auto mb-3 opacity-30" />
          <p>Todos los widgets están ocultos</p>
          <button onClick={() => setEditMode(true)} className="mt-2 text-sm text-blue-600 hover:underline">
            Configurar dashboard
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {visibleWidgets.map(w => (
            <div key={w.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-700">{w.titulo}</h3>
                {editMode && (
                  <button onClick={() => toggleVisible(w.id)} className="text-gray-400 hover:text-gray-600">
                    <EyeOff size={14} />
                  </button>
                )}
              </div>
              <WidgetPreview tipo={w.tipo} />
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-gray-400 text-center">
        Los datos en tiempo real se cargan desde el dashboard principal. Las vistas previas son ilustrativas.
      </p>
    </div>
  );
}
