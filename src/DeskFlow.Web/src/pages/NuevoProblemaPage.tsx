import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import { problemasApi } from '../api/problemas';
import { catalogosApi } from '../api/dashboard';

export default function NuevoProblemaPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const ticketOrigenId = searchParams.get('ticketId') ?? undefined;

  const [form, setForm] = useState({
    titulo: '',
    descripcion: '',
    prioridadId: '',
    categoriaId: '',
  });

  const { data: prioridades = [] } = useQuery({
    queryKey: ['prioridades'],
    queryFn: catalogosApi.getPrioridades,
  });

  const { data: categorias = [] } = useQuery({
    queryKey: ['categorias'],
    queryFn: catalogosApi.getCategorias,
  });

  const crearMutation = useMutation({
    mutationFn: () => problemasApi.create({
      titulo: form.titulo,
      descripcion: form.descripcion,
      prioridadId: form.prioridadId,
      categoriaId: form.categoriaId || undefined,
      ticketOrigenId,
    }),
    onSuccess: data => navigate(`/problemas/${data.id}`),
  });

  const valid = form.titulo.trim() && form.descripcion.trim() && form.prioridadId;

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <button
        onClick={() => navigate('/problemas')}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6"
      >
        <ArrowLeft size={14} /> Volver a problemas
      </button>

      <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-5">
        <div className="flex items-center gap-2">
          <AlertTriangle className="text-orange-500" size={20} />
          <h1 className="text-lg font-bold text-gray-900">Nuevo Problema</h1>
        </div>

        {ticketOrigenId && (
          <div className="bg-blue-50 text-blue-700 text-sm px-4 py-2 rounded-lg border border-blue-200">
            Se vinculará automáticamente al ticket origen
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
          <input
            value={form.titulo}
            onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            placeholder="Descripción breve del problema"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Descripción *</label>
          <textarea
            value={form.descripcion}
            onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
            rows={4}
            placeholder="Describí el problema en detalle: síntomas, impacto, frecuencia..."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Prioridad *</label>
            <select
              value={form.prioridadId}
              onChange={e => setForm(f => ({ ...f, prioridadId: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="">Seleccioná...</option>
              {prioridades.map((p: { id: string; nombre: string }) => (
                <option key={p.id} value={p.id}>{p.nombre}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
            <select
              value={form.categoriaId}
              onChange={e => setForm(f => ({ ...f, categoriaId: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="">Sin categoría</option>
              {categorias.map((c: { id: string; nombre: string }) => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>
          </div>
        </div>

        {crearMutation.isError && (
          <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
            Error al crear el problema. Verificá los datos e intentá de nuevo.
          </p>
        )}

        <div className="flex gap-3 pt-2">
          <button
            onClick={() => crearMutation.mutate()}
            disabled={!valid || crearMutation.isPending}
            className="flex-1 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 disabled:opacity-50 transition-colors"
          >
            {crearMutation.isPending ? 'Creando...' : 'Crear Problema'}
          </button>
          <button
            onClick={() => navigate('/problemas')}
            className="px-4 py-2 text-gray-600 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
