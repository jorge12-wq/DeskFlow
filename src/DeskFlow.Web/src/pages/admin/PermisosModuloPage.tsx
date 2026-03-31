import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { permisosModuloApi, type RolPermisos } from '../../api/permisosModulo';
import { toast } from 'sonner';
import { RotateCcw, Save, Shield } from 'lucide-react';
import { useState } from 'react';

const GRUPOS = ['Principal', 'Mesa de Ayuda', 'ITSM', 'Portales', 'Conocimiento', 'Analítica', 'Admin'];

export default function PermisosModuloPage() {
  const queryClient = useQueryClient();
  const [pendingChanges, setPendingChanges] = useState<Record<string, Record<string, boolean>>>({});

  const { data: matriz, isLoading } = useQuery({
    queryKey: ['permisos-modulo'],
    queryFn: permisosModuloApi.getMatriz,
  });

  const actualizarMutation = useMutation({
    mutationFn: ({ rolId, modulosActivos }: { rolId: string; modulosActivos: string[] }) =>
      permisosModuloApi.actualizarRol(rolId, modulosActivos),
    onSuccess: (_, { rolId }) => {
      setPendingChanges(prev => {
        const next = { ...prev };
        delete next[rolId];
        return next;
      });
      queryClient.invalidateQueries({ queryKey: ['permisos-modulo'] });
      queryClient.invalidateQueries({ queryKey: ['mis-modulos'] });
      toast.success('Permisos actualizados');
    },
    onError: () => toast.error('Error al actualizar permisos'),
  });

  const resetearMutation = useMutation({
    mutationFn: (rolId: string) => permisosModuloApi.resetearRol(rolId),
    onSuccess: (_, rolId) => {
      setPendingChanges(prev => {
        const next = { ...prev };
        delete next[rolId];
        return next;
      });
      queryClient.invalidateQueries({ queryKey: ['permisos-modulo'] });
      queryClient.invalidateQueries({ queryKey: ['mis-modulos'] });
      toast.success('Permisos reseteados a valores por defecto');
    },
    onError: () => toast.error('Error al resetear'),
  });

  const getModuloActivo = (rol: RolPermisos, moduloClave: string): boolean => {
    if (pendingChanges[rol.rolId]?.[moduloClave] !== undefined)
      return pendingChanges[rol.rolId][moduloClave];
    return rol.modulos.find(m => m.clave === moduloClave)?.activo ?? false;
  };

  const toggleModulo = (rol: RolPermisos, moduloClave: string) => {
    const currentValue = getModuloActivo(rol, moduloClave);
    setPendingChanges(prev => ({
      ...prev,
      [rol.rolId]: {
        ...(prev[rol.rolId] ?? {}),
        [moduloClave]: !currentValue,
      },
    }));
  };

  const guardarRol = (rol: RolPermisos) => {
    const modulosActivos = rol.modulos
      .map(m => m.clave)
      .filter(clave => getModuloActivo(rol, clave));
    actualizarMutation.mutate({ rolId: rol.rolId, modulosActivos });
  };

  const hasPendingForRol = (rolId: string) =>
    Object.keys(pendingChanges[rolId] ?? {}).length > 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!matriz) return null;

  // Obtener todos los módulos ordenados por grupo
  const todoModulos = matriz[0]?.modulos ?? [];
  const modulosPorGrupo = GRUPOS.map(grupo => ({
    grupo,
    modulos: todoModulos.filter(m => m.grupo === grupo),
  })).filter(g => g.modulos.length > 0);

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Shield className="h-5 w-5 text-blue-600" />
        <div>
          <h1 className="text-[17px] font-bold text-gray-900">Permisos por Módulo</h1>
          <p className="text-[13px] text-gray-500 mt-0.5">Configurá qué módulos puede acceder cada rol.</p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/70">
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider w-52">
                  Módulo
                </th>
                {matriz.map(rol => (
                  <th key={rol.rolId} className="px-4 py-3 text-center min-w-[120px]">
                    <div className="flex flex-col items-center gap-1.5">
                      <span className="text-[12px] font-semibold text-gray-700">{rol.rolNombre}</span>
                      <div className="flex gap-1">
                        {hasPendingForRol(rol.rolId) && (
                          <button
                            onClick={() => guardarRol(rol)}
                            disabled={actualizarMutation.isPending}
                            className="flex items-center gap-1 px-2 py-0.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-[11px] font-medium transition"
                          >
                            <Save className="h-3 w-3" />
                            Guardar
                          </button>
                        )}
                        <button
                          onClick={() => resetearMutation.mutate(rol.rolId)}
                          disabled={resetearMutation.isPending}
                          title="Resetear a valores por defecto"
                          className="p-0.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {modulosPorGrupo.map(({ grupo, modulos }) => (
                <>
                  <tr key={`grupo-${grupo}`} className="bg-gray-50/40 border-b border-gray-100">
                    <td colSpan={matriz.length + 1} className="px-5 py-1.5">
                      <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{grupo}</span>
                    </td>
                  </tr>
                  {modulos.map(modulo => (
                    <tr key={modulo.clave} className="border-b border-gray-50 hover:bg-gray-50/40 transition">
                      <td className="px-5 py-2.5 text-gray-700 font-medium">{modulo.nombre}</td>
                      {matriz.map(rol => {
                        const activo = getModuloActivo(rol, modulo.clave);
                        const isPending = pendingChanges[rol.rolId]?.[modulo.clave] !== undefined;
                        return (
                          <td key={rol.rolId} className="px-4 py-2.5 text-center">
                            <button
                              onClick={() => toggleModulo(rol, modulo.clave)}
                              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors
                                ${activo ? 'bg-blue-600' : 'bg-gray-200'}
                                ${isPending ? 'ring-2 ring-blue-300 ring-offset-1' : ''}`}
                            >
                              <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform
                                ${activo ? 'translate-x-4' : 'translate-x-0.5'}`} />
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-[12px] text-gray-400">
        Los cambios pendientes se resaltan con un borde azul en el toggle. Hacé clic en <strong>Guardar</strong> por columna para confirmar.
        <br />Usar <strong>↺</strong> para volver a los valores por defecto del sistema.
      </p>
    </div>
  );
}
