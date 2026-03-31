import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, BookOpen, Eye, Plus, TrendingUp } from 'lucide-react';
import { conocimientoApi } from '../api/conocimiento';
import { catalogosApi } from '../api/dashboard';
import { useAuthStore } from '../store/authStore';

export default function KnowledgeListPage() {
  const navigate = useNavigate();
  const { usuario } = useAuthStore();
  const [buscar, setBuscar] = useState('');
  const [categoriaId, setCategoriaId] = useState('');
  const [pagina, setPagina] = useState(1);
  const canWrite = ['Agente', 'Supervisor', 'Administrador'].includes(usuario?.rol ?? '');

  const { data, isLoading } = useQuery({
    queryKey: ['conocimiento', buscar, categoriaId, pagina],
    queryFn: () => conocimientoApi.buscar({ buscar: buscar || undefined, categoriaId: categoriaId || undefined, pagina, porPagina: 12 }),
  });

  const { data: populares } = useQuery({
    queryKey: ['conocimiento-populares'],
    queryFn: conocimientoApi.getPopulares,
    staleTime: 5 * 60 * 1000,
  });

  const { data: categorias } = useQuery({
    queryKey: ['categorias'],
    queryFn: catalogosApi.getCategorias,
    staleTime: 5 * 60 * 1000,
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Base de Conocimiento</h1>
          <p className="text-gray-500 text-sm mt-1">Encontrá soluciones a problemas frecuentes</p>
        </div>
        {canWrite && (
          <button
            onClick={() => navigate('/conocimiento/nuevo')}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
          >
            <Plus className="h-4 w-4" />
            Nuevo artículo
          </button>
        )}
      </div>

      {/* Search + filter */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            value={buscar}
            onChange={e => { setBuscar(e.target.value); setPagina(1); }}
            placeholder="Buscar artículos..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={categoriaId}
          onChange={e => { setCategoriaId(e.target.value); setPagina(1); }}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Todas las categorías</option>
          {categorias?.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Articles grid */}
        <div className="lg:col-span-3 space-y-4">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-gray-100 rounded-xl h-40 animate-pulse" />
              ))}
            </div>
          ) : data?.items.length === 0 ? (
            <div className="text-center py-16">
              <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No se encontraron artículos</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data?.items.map(art => (
                <Link
                  key={art.id}
                  to={`/conocimiento/${art.id}`}
                  className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md hover:border-blue-200 transition group"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition line-clamp-2">{art.titulo}</h3>
                  </div>
                  <p className="text-xs text-blue-600 mb-2">{art.categoria}{art.subcategoria ? ` › ${art.subcategoria}` : ''}</p>
                  {art.etiquetas.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {art.etiquetas.slice(0, 3).map(tag => (
                        <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{tag}</span>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>{art.autor}</span>
                    <div className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      <span>{art.vistas}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Pagination */}
          {data && data.totalPages > 1 && (
            <div className="flex justify-center gap-2">
              <button disabled={pagina === 1} onClick={() => setPagina(p => p - 1)}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition">
                Anterior
              </button>
              <span className="px-3 py-1.5 text-sm text-gray-600">{pagina} / {data.totalPages}</span>
              <button disabled={pagina === data.totalPages} onClick={() => setPagina(p => p + 1)}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition">
                Siguiente
              </button>
            </div>
          )}
        </div>

        {/* Populares sidebar */}
        <div className="space-y-4">
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              <h3 className="font-semibold text-gray-900 text-sm">Más populares</h3>
            </div>
            <div className="space-y-3">
              {populares?.slice(0, 8).map(art => (
                <Link key={art.id} to={`/conocimiento/${art.id}`}
                  className="block hover:text-blue-600 transition">
                  <p className="text-sm text-gray-800 hover:text-blue-600 line-clamp-2">{art.titulo}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <Eye className="h-3 w-3 text-gray-400" />
                    <span className="text-xs text-gray-400">{art.vistas} vistas</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
