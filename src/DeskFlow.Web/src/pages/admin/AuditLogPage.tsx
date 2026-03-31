import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { auditoriaApi } from '../../api/usuarios';
import { formatDate } from '../../utils/date';

export default function AuditLogPage() {
  const [filtros, setFiltros] = useState({ entidad: '', pagina: 1 });

  const { data, isLoading } = useQuery({
    queryKey: ['auditoria', filtros],
    queryFn: () => auditoriaApi.getPaged({ entidad: filtros.entidad || undefined, pagina: filtros.pagina, porPagina: 30 }),
  });

  const accionColors: Record<string, string> = {
    Created: 'bg-green-100 text-green-700',
    Updated: 'bg-blue-100 text-blue-700',
    Deleted: 'bg-red-100 text-red-700',
    Login: 'bg-purple-100 text-purple-700',
    Logout: 'bg-gray-100 text-gray-700',
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Auditoría</h1>
        <p className="text-gray-500 text-sm mt-1">Registro de acciones del sistema</p>
      </div>

      {/* Filtros */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 flex gap-3">
        <select value={filtros.entidad}
          onChange={e => setFiltros(f => ({ ...f, entidad: e.target.value, pagina: 1 }))}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">Todas las entidades</option>
          {['Ticket', 'Usuario', 'Categoria', 'Etiqueta', 'BaseConocimiento', 'EncuestaRespuesta'].map(e => (
            <option key={e} value={e}>{e}</option>
          ))}
        </select>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">FECHA</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">USUARIO</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">ACCIÓN</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">ENTIDAD</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3 hidden lg:table-cell">IP</th>
              </tr>
            </thead>
            <tbody>
              {data?.items.map(log => (
                <tr key={log.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-3 text-xs text-gray-500">{formatDate(log.fechaCreacion)}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{log.usuario}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${accionColors[log.accion] ?? 'bg-gray-100 text-gray-700'}`}>
                      {log.accion}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-gray-700">{log.entidad}</p>
                    {log.entidadId && <p className="text-xs text-gray-400 font-mono">{log.entidadId.substring(0, 8)}...</p>}
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell text-xs text-gray-400">{log.ip}</td>
                </tr>
              ))}
              {!data?.items.length && (
                <tr>
                  <td colSpan={5} className="text-center text-gray-400 py-12 text-sm">No hay registros</td>
                </tr>
              )}
            </tbody>
          </table>
        )}

        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-sm text-gray-500">Página {filtros.pagina} de {data.totalPages}</p>
            <div className="flex gap-1">
              <button disabled={filtros.pagina === 1}
                onClick={() => setFiltros(f => ({ ...f, pagina: f.pagina - 1 }))}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition">
                Anterior
              </button>
              <button disabled={filtros.pagina === data.totalPages}
                onClick={() => setFiltros(f => ({ ...f, pagina: f.pagina + 1 }))}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition">
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
