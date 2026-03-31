import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Tag } from 'lucide-react';
import { etiquetasApi } from '../../api/usuarios';
import { toast } from 'sonner';

export default function EtiquetasPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [nombre, setNombre] = useState('');
  const [color, setColor] = useState('#6366f1');

  const { data: etiquetas, isLoading } = useQuery({
    queryKey: ['etiquetas'],
    queryFn: etiquetasApi.getAll,
  });

  const createMutation = useMutation({
    mutationFn: () => etiquetasApi.create({ nombre, color }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['etiquetas'] });
      setNombre('');
      setColor('#6366f1');
      setShowForm(false);
      toast.success('Etiqueta creada');
    },
    onError: () => toast.error('Error al crear la etiqueta'),
  });

  const deleteMutation = useMutation({
    mutationFn: etiquetasApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['etiquetas'] });
      toast.success('Etiqueta eliminada');
    },
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Etiquetas</h1>
          <p className="text-gray-500 text-sm mt-1">Etiquetas para clasificar tickets</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
        >
          <Plus className="h-4 w-4" />
          Nueva etiqueta
        </button>
      </div>

      {showForm && (
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h3 className="font-medium text-gray-900 mb-4">Nueva etiqueta</h3>
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <label className="block text-xs text-gray-500 mb-1">Nombre</label>
              <input value={nombre} onChange={e => setNombre(e.target.value)}
                placeholder="Nombre de la etiqueta"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Color</label>
              <input type="color" value={color} onChange={e => setColor(e.target.value)}
                className="h-9 w-14 border border-gray-300 rounded-lg cursor-pointer" />
            </div>
            <button onClick={() => nombre && createMutation.mutate()} disabled={!nombre || createMutation.isPending}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition">
              Crear
            </button>
          </div>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl p-5">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
          </div>
        ) : (
          <div className="flex flex-wrap gap-3">
            {etiquetas?.map(e => (
              <div key={e.id} className="flex items-center gap-2 px-3 py-2 rounded-full border"
                style={{ borderColor: e.color + '40', backgroundColor: e.color + '15' }}>
                <Tag className="h-3.5 w-3.5" style={{ color: e.color }} />
                <span className="text-sm font-medium" style={{ color: e.color }}>{e.nombre}</span>
                <button onClick={() => deleteMutation.mutate(e.id)}
                  className="text-gray-400 hover:text-red-500 text-xs ml-1 transition">×</button>
              </div>
            ))}
            {!etiquetas?.length && <p className="text-gray-400 text-sm">No hay etiquetas configuradas</p>}
          </div>
        )}
      </div>
    </div>
  );
}
