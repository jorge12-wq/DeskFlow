import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Eye, Edit, BookOpen, Paperclip, FileText, Download } from 'lucide-react';
import { conocimientoApi } from '../api/conocimiento';
import { useAuthStore } from '../store/authStore';
import { formatDate } from '../utils/date';

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function KnowledgeArticlePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { usuario } = useAuthStore();
  const canEdit = ['Agente', 'Supervisor', 'Administrador'].includes(usuario?.rol ?? '');

  const { data: articulo, isLoading } = useQuery({
    queryKey: ['articulo', id],
    queryFn: () => conocimientoApi.getById(id!),
  });

  const { data: relacionados } = useQuery({
    queryKey: ['relacionados', id],
    queryFn: () => conocimientoApi.getRelacionados(id!),
  });

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="bg-gray-100 rounded-xl h-8 w-1/2 animate-pulse" />
        <div className="bg-gray-100 rounded-xl h-96 animate-pulse" />
      </div>
    );
  }

  if (!articulo) return <div className="text-center py-16 text-gray-500">Artículo no encontrado</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-gray-100 transition">
          <ArrowLeft className="h-5 w-5 text-gray-500" />
        </button>
        {canEdit && (
          <Link to={`/conocimiento/${id}/editar`}
            className="flex items-center gap-2 text-sm border border-gray-300 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition">
            <Edit className="h-4 w-4" />
            Editar
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Article content */}
        <div className="lg:col-span-3">
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="mb-4">
              <p className="text-xs text-blue-600 mb-2">{articulo.categoria}{articulo.subcategoria ? ` › ${articulo.subcategoria}` : ''}</p>
              <h1 className="text-2xl font-bold text-gray-900 mb-3">{articulo.titulo}</h1>
              <div className="flex items-center gap-4 text-xs text-gray-400">
                <span>Por {articulo.autor}</span>
                <span>{formatDate(articulo.fechaActualizacion)}</span>
                <div className="flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  <span>{articulo.vistas} vistas</span>
                </div>
              </div>
              {articulo.etiquetas.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-3">
                  {articulo.etiquetas.map(tag => (
                    <span key={tag} className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">{tag}</span>
                  ))}
                </div>
              )}
            </div>
            <hr className="mb-5" />
            {/* Render HTML content */}
            <div
              className="prose prose-sm max-w-none text-gray-700"
              dangerouslySetInnerHTML={{ __html: articulo.contenido }}
            />

            {/* Adjuntos */}
            {articulo.adjuntos?.length > 0 && (
              <div className="mt-6 pt-5 border-t border-gray-100">
                <div className="flex items-center gap-2 mb-3">
                  <Paperclip className="h-3.5 w-3.5 text-gray-400" />
                  <p className="text-[12px] font-semibold text-gray-500 uppercase tracking-wide">
                    Archivos adjuntos ({articulo.adjuntos.length})
                  </p>
                </div>
                <div className="space-y-1.5">
                  {articulo.adjuntos.map(a => (
                    <a
                      key={a.id}
                      href={conocimientoApi.getAdjuntoUrl(id!, a.id)}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2.5 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-200 transition group"
                    >
                      <FileText className="h-4 w-4 text-gray-400 shrink-0 group-hover:text-blue-500" />
                      <span className="flex-1 text-[13px] text-gray-700 group-hover:text-blue-600 truncate">{a.nombreOriginal}</span>
                      <span className="text-[11px] text-gray-400 shrink-0">{formatBytes(a.tamanoBytes)}</span>
                      <Download className="h-3.5 w-3.5 text-gray-300 group-hover:text-blue-400 shrink-0" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar - Related */}
        <div className="space-y-4">
          {relacionados && relacionados.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <BookOpen className="h-4 w-4 text-blue-600" />
                <h3 className="font-semibold text-gray-900 text-sm">Relacionados</h3>
              </div>
              <div className="space-y-3">
                {relacionados.map(art => (
                  <Link key={art.id} to={`/conocimiento/${art.id}`}
                    className="block text-sm text-gray-700 hover:text-blue-600 transition">
                    {art.titulo}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
