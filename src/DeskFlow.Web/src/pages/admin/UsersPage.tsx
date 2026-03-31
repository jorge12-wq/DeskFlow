import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UserCheck, UserX, Plus, Shield, X, Eye, EyeOff, Pencil, Trash2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { usuariosApi } from '../../api/usuarios';
import { formatDateShort } from '../../utils/date';
import type { Usuario } from '../../types';

interface CreateUserForm {
  nombre: string;
  apellido: string;
  email: string;
  password: string;
  rolId: string;
}

interface EditUserForm {
  nombre: string;
  apellido: string;
  email: string;
  rolId: string;
  sucursalId: string;
  areaId: string;
}

const rolColors: Record<string, string> = {
  Administrador: 'bg-purple-100 text-purple-700',
  Supervisor:    'bg-blue-100 text-blue-700',
  Agente:        'bg-green-100 text-green-700',
  Aprobador:     'bg-orange-100 text-orange-700',
  Observador:    'bg-yellow-100 text-yellow-700',
  Usuario:       'bg-gray-100 text-gray-700',
};

export default function UsersPage() {
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [changingRolFor, setChangingRolFor] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<Usuario | null>(null);
  const [deletingUser, setDeletingUser] = useState<Usuario | null>(null);

  const { data: usuarios, isLoading } = useQuery({
    queryKey: ['usuarios'],
    queryFn: usuariosApi.getAll,
  });

  const { data: roles } = useQuery({
    queryKey: ['roles'],
    queryFn: usuariosApi.getRoles,
  });

  const { data: sucursales } = useQuery({
    queryKey: ['sucursales'],
    queryFn: usuariosApi.getSucursales,
  });

  const { data: areas } = useQuery({
    queryKey: ['areas'],
    queryFn: usuariosApi.getAreas,
  });

  // ── Create form ─────────────────────────────────────────────────────────
  const createForm = useForm<CreateUserForm>();
  const { register: regCreate, handleSubmit: handleCreate, reset: resetCreate,
    formState: { errors: errCreate, isSubmitting: isCreating } } = createForm;

  // ── Edit form ────────────────────────────────────────────────────────────
  const editForm = useForm<EditUserForm>();
  const { register: regEdit, handleSubmit: handleEdit, reset: resetEdit,
    formState: { errors: errEdit } } = editForm;

  // ── Mutations ────────────────────────────────────────────────────────────
  const toggleMutation = useMutation({
    mutationFn: (id: string) => usuariosApi.toggleActivo(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['usuarios'] }); toast.success('Estado actualizado'); },
    onError: (e: { response?: { data?: { message?: string } } }) => toast.error(e.response?.data?.message ?? 'Error al actualizar'),
  });

  const cambiarRolMutation = useMutation({
    mutationFn: ({ id, rolId }: { id: string; rolId: string }) => usuariosApi.cambiarRol(id, rolId),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['usuarios'] }); setChangingRolFor(null); toast.success('Rol actualizado'); },
    onError: (e: { response?: { data?: { message?: string } } }) => toast.error(e.response?.data?.message ?? 'Error al cambiar rol'),
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateUserForm) => usuariosApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
      setShowCreateModal(false);
      resetCreate();
      toast.success('Usuario creado exitosamente');
    },
    onError: (e: { response?: { data?: { message?: string } } }) => toast.error(e.response?.data?.message ?? 'Error al crear usuario'),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data, originalRolId }: { id: string; data: EditUserForm; originalRolId: string }) => {
      await usuariosApi.update(id, {
        nombre: data.nombre,
        apellido: data.apellido,
        email: data.email,
        sucursalId: data.sucursalId || undefined,
        areaId: data.areaId || undefined,
      });
      if (data.rolId && data.rolId !== originalRolId) {
        await usuariosApi.cambiarRol(id, data.rolId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
      setEditingUser(null);
      toast.success('Usuario actualizado');
    },
    onError: (e: { response?: { data?: { message?: string } } }) => toast.error(e.response?.data?.message ?? 'Error al actualizar'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => usuariosApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
      setDeletingUser(null);
      toast.success('Usuario eliminado');
    },
    onError: (e: { response?: { data?: { message?: string } } }) => {
      toast.error(e.response?.data?.message ?? 'Error al eliminar');
      setDeletingUser(null);
    },
  });

  const onCreateSubmit = (data: CreateUserForm) => createMutation.mutate(data);

  const openEdit = (user: Usuario) => {
    setEditingUser(user);
    resetEdit({
      nombre:     user.nombre,
      apellido:   user.apellido,
      email:      user.email,
      rolId:      user.rolId ?? '',
      sucursalId: user.sucursalId ?? '',
      areaId:     user.areaId ?? '',
    });
  };

  const onEditSubmit = (data: EditUserForm) => {
    if (!editingUser) return;
    updateMutation.mutate({ id: editingUser.id, data, originalRolId: editingUser.rolId ?? '' });
  };

  const activos = usuarios?.filter(u => u.activo).length ?? 0;
  const inactivos = (usuarios?.length ?? 0) - activos;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Usuarios</h1>
          <p className="text-gray-500 text-sm mt-1">
            {usuarios?.length ?? 0} registrados · {activos} activos · {inactivos} inactivos
          </p>
        </div>
        <button
          onClick={() => { setShowCreateModal(true); resetCreate(); }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition"
        >
          <Plus className="h-4 w-4" />
          Nuevo usuario
        </button>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">USUARIO</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">EMAIL</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">ROL</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3 hidden md:table-cell">ESTADO</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3 hidden lg:table-cell">REGISTRO</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {usuarios?.map(user => (
                <tr key={user.id} className={`border-b border-gray-50 hover:bg-gray-50 transition ${!user.activo ? 'opacity-60' : ''}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${user.activo ? 'bg-blue-600' : 'bg-gray-400'}`}>
                        {user.nombre[0]}{user.apellido[0]}
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-900">{user.nombre} {user.apellido}</span>
                        {user.area && <p className="text-xs text-gray-400">{user.area}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{user.email}</td>
                  <td className="px-4 py-3">
                    {changingRolFor === user.id ? (
                      <div className="flex items-center gap-2">
                        <select
                          defaultValue={user.rolId}
                          onChange={e => cambiarRolMutation.mutate({ id: user.id, rolId: e.target.value })}
                          className="text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          disabled={cambiarRolMutation.isPending}
                        >
                          {roles?.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
                        </select>
                        <button onClick={() => setChangingRolFor(null)} className="text-gray-400 hover:text-gray-600">
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setChangingRolFor(user.id)}
                        title="Cambiar rol"
                        className={`text-xs px-2 py-1 rounded-full font-medium hover:opacity-80 transition ${rolColors[user.rol] ?? 'bg-gray-100 text-gray-700'}`}
                      >
                        {user.rol}
                      </button>
                    )}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <div className="flex items-center gap-1">
                      {user.activo
                        ? <><UserCheck className="h-4 w-4 text-green-500" /><span className="text-xs text-green-700">Activo</span></>
                        : <><UserX className="h-4 w-4 text-red-500" /><span className="text-xs text-red-700">Inactivo</span></>}
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell text-sm text-gray-500">
                    {formatDateShort(user.fechaCreacion)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {/* Edit */}
                      <button
                        onClick={() => openEdit(user)}
                        title="Editar usuario"
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      {/* Toggle active */}
                      <button
                        onClick={() => toggleMutation.mutate(user.id)}
                        disabled={toggleMutation.isPending}
                        title={user.activo ? 'Desactivar' : 'Activar'}
                        className={`text-xs px-2 py-1 rounded font-medium transition ${user.activo ? 'text-orange-600 hover:bg-orange-50' : 'text-green-600 hover:bg-green-50'}`}
                      >
                        {user.activo ? 'Desactivar' : 'Activar'}
                      </button>
                      {/* Delete */}
                      <button
                        onClick={() => setDeletingUser(user)}
                        title="Eliminar usuario"
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!usuarios?.length && (
                <tr>
                  <td colSpan={6} className="text-center text-gray-400 py-12 text-sm">No hay usuarios</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Roles legend */}
      {roles && roles.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Shield className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Roles disponibles</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {roles.map(r => (
              <div key={r.id} className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-100">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${rolColors[r.nombre] ?? 'bg-gray-100 text-gray-700'}`}>{r.nombre}</span>
                {r.descripcion && <span className="text-xs text-gray-400">{r.descripcion}</span>}
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-2">Haz clic en el rol de un usuario para cambiarlo.</p>
        </div>
      )}

      {/* ── Create Modal ──────────────────────────────────────────────────────── */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">Nuevo usuario</h2>
              <button onClick={() => setShowCreateModal(false)} className="p-1.5 rounded-lg hover:bg-gray-100">
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleCreate(onCreateSubmit)} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                  <input {...regCreate('nombre', { required: 'Requerido' })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Juan" />
                  {errCreate.nombre && <p className="text-xs text-red-500 mt-1">{errCreate.nombre.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Apellido</label>
                  <input {...regCreate('apellido', { required: 'Requerido' })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Pérez" />
                  {errCreate.apellido && <p className="text-xs text-red-500 mt-1">{errCreate.apellido.message}</p>}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input {...regCreate('email', { required: 'Requerido', pattern: { value: /^\S+@\S+\.\S+$/, message: 'Email inválido' } })}
                  type="email"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="juan@empresa.com" />
                {errCreate.email && <p className="text-xs text-red-500 mt-1">{errCreate.email.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
                <div className="relative">
                  <input {...regCreate('password', { required: 'Requerido', minLength: { value: 8, message: 'Mínimo 8 caracteres' } })}
                    type={showPassword ? 'text' : 'password'}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="••••••••" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errCreate.password && <p className="text-xs text-red-500 mt-1">{errCreate.password.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
                <select {...regCreate('rolId', { required: 'Selecciona un rol' })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                  <option value="">Seleccionar rol...</option>
                  {roles?.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
                </select>
                {errCreate.rolId && <p className="text-xs text-red-500 mt-1">{errCreate.rolId.message}</p>}
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition">
                  Cancelar
                </button>
                <button type="submit" disabled={isCreating || createMutation.isPending}
                  className="flex-1 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition">
                  {createMutation.isPending ? 'Creando...' : 'Crear usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Edit Modal ────────────────────────────────────────────────────────── */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">Editar usuario</h2>
              <button onClick={() => setEditingUser(null)} className="p-1.5 rounded-lg hover:bg-gray-100">
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleEdit(onEditSubmit)} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                  <input {...regEdit('nombre', { required: 'Requerido' })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  {errEdit.nombre && <p className="text-xs text-red-500 mt-1">{errEdit.nombre.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Apellido</label>
                  <input {...regEdit('apellido', { required: 'Requerido' })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  {errEdit.apellido && <p className="text-xs text-red-500 mt-1">{errEdit.apellido.message}</p>}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input {...regEdit('email', { required: 'Requerido', pattern: { value: /^\S+@\S+\.\S+$/, message: 'Email inválido' } })}
                  type="email"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                {errEdit.email && <p className="text-xs text-red-500 mt-1">{errEdit.email.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
                <select {...regEdit('rolId', { required: 'Selecciona un rol' })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                  <option value="">Seleccionar rol...</option>
                  {roles?.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
                </select>
                {errEdit.rolId && <p className="text-xs text-red-500 mt-1">{errEdit.rolId.message}</p>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sucursal</label>
                  <select {...regEdit('sucursalId')}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                    <option value="">Sin sucursal</option>
                    {sucursales?.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Área</label>
                  <select {...regEdit('areaId')}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                    <option value="">Sin área</option>
                    {areas?.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setEditingUser(null)}
                  className="flex-1 px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition">
                  Cancelar
                </button>
                <button type="submit" disabled={updateMutation.isPending}
                  className="flex-1 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition">
                  {updateMutation.isPending ? 'Guardando...' : 'Guardar cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation ───────────────────────────────────────────────── */}
      {deletingUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-full">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Eliminar usuario</h2>
            </div>
            <p className="text-sm text-gray-600 mb-1">
              ¿Estás seguro que querés eliminar a <strong>{deletingUser.nombre} {deletingUser.apellido}</strong>?
            </p>
            <p className="text-xs text-gray-400 mb-5">
              Si tiene tickets asociados no podrá eliminarse — desactivalo en su lugar.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeletingUser(null)}
                className="flex-1 px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition">
                Cancelar
              </button>
              <button onClick={() => deleteMutation.mutate(deletingUser.id)} disabled={deleteMutation.isPending}
                className="flex-1 px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition">
                {deleteMutation.isPending ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
