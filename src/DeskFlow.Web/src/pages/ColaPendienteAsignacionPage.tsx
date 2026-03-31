import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Clock, UserCheck, AlertTriangle, ChevronRight, Users } from 'lucide-react';
import { ticketsApi } from '../api/tickets';
import { catalogosApi } from '../api/dashboard';
import { useAuthStore } from '../store/authStore';
import { formatDistanceToNow } from '../utils/date';
import { toast } from 'sonner';

const PRIMERA_RESPUESTA_HORAS = 2;

function usarContador(fechaCreacion: string) {
  const creado = new Date(fechaCreacion).getTime();
  const limite = creado + PRIMERA_RESPUESTA_HORAS * 60 * 60 * 1000;
  const ahora = Date.now();
  const restanMs = limite - ahora;
  const vencido = restanMs <= 0;
  const mins = Math.abs(Math.floor(restanMs / 60000));
  const horas = Math.floor(mins / 60);
  const minutos = mins % 60;
  const texto = vencido
    ? `Vencido hace ${horas > 0 ? `${horas}h ` : ''}${minutos}m`
    : `${horas > 0 ? `${horas}h ` : ''}${minutos}m restantes`;
  const color = vencido
    ? 'text-red-600 bg-red-50'
    : restanMs < 30 * 60 * 1000
    ? 'text-orange-600 bg-orange-50'
    : 'text-green-700 bg-green-50';
  return { texto, vencido, color };
}

function ContadorTiempo({ fechaCreacion }: { fechaCreacion: string }) {
  const { texto, vencido, color } = usarContador(fechaCreacion);
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${color}`}>
      {vencido ? <AlertTriangle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
      {texto}
    </span>
  );
}

export default function ColaPendienteAsignacionPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { usuario } = useAuthStore();
  const esAgente = usuario?.rol === 'Agente';
  const esSupervisorOAdmin = usuario?.rol === 'Supervisor' || usuario?.rol === 'Administrador';

  const [asignandoId, setAsignandoId] = useState<string | null>(null);
  const [tecnicoSeleccionado, setTecnicoSeleccionado] = useState<Record<string, string>>({});

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['tickets-pendientes'],
    queryFn: () => ticketsApi.getAll({ soloSinAsignar: true, pageSize: 100 }),
    refetchInterval: 30000,
  });

  const { data: tecnicos } = useQuery({
    queryKey: ['tecnicos'],
    queryFn: catalogosApi.getTecnicos,
    enabled: esSupervisorOAdmin,
  });

  const tomarMutation = useMutation({
    mutationFn: (id: string) => ticketsApi.tomarTicket(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets-pendientes'] });
      queryClient.invalidateQueries({ queryKey: ['tickets-pendientes-count'] });
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
    },
    onError: () => toast.error('Error al tomar el ticket'),
  });

  const asignarMutation = useMutation({
    mutationFn: ({ ticketId, tecnicoId }: { ticketId: string; tecnicoId: string }) =>
      ticketsApi.asignarTecnico(ticketId, tecnicoId),
    onSuccess: () => {
      setAsignandoId(null);
      queryClient.invalidateQueries({ queryKey: ['tickets-pendientes'] });
      queryClient.invalidateQueries({ queryKey: ['tickets-pendientes-count'] });
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
    },
    onError: () => toast.error('Error al asignar el agente'),
  });

  const tickets = data?.items ?? [];
  const vencidos = tickets.filter(t => {
    const limite = new Date(t.fechaCreacion).getTime() + PRIMERA_RESPUESTA_HORAS * 3600000;
    return Date.now() > limite;
  }).length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cola de Asignación</h1>
          <p className="text-gray-500 text-sm mt-1">
            Tickets sin asignar · Tiempo límite de primera respuesta: {PRIMERA_RESPUESTA_HORAS}h
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg px-3 py-1.5 transition"
        >
          Actualizar
        </button>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-sm text-gray-500">Pendientes</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{tickets.length}</p>
        </div>
        <div className={`border rounded-xl p-4 ${vencidos > 0 ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200'}`}>
          <p className={`text-sm ${vencidos > 0 ? 'text-red-600' : 'text-gray-500'}`}>Sin respuesta a tiempo</p>
          <p className={`text-3xl font-bold mt-1 ${vencidos > 0 ? 'text-red-600' : 'text-gray-900'}`}>{vencidos}</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 hidden md:block">
          <p className="text-sm text-blue-600">Límite primera respuesta</p>
          <p className="text-3xl font-bold text-blue-700 mt-1">{PRIMERA_RESPUESTA_HORAS}h</p>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
          </div>
        ) : tickets.length === 0 ? (
          <div className="text-center py-16">
            <Users className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No hay tickets pendientes de asignación</p>
            <p className="text-gray-400 text-sm mt-1">Todos los tickets tienen técnico asignado</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">TICKET</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">ASUNTO</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3 hidden md:table-cell">PRIORIDAD</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">TIEMPO LÍMITE</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3 hidden lg:table-cell">CREADO</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">ACCIÓN</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map(ticket => {
                const { vencido } = usarContador(ticket.fechaCreacion);
                return (
                  <tr
                    key={ticket.id}
                    className={`border-b border-gray-50 transition ${vencido ? 'bg-red-50/40' : 'hover:bg-gray-50'}`}
                  >
                    <td className="px-4 py-3">
                      <button
                        onClick={() => navigate(`/tickets/${ticket.id}`)}
                        className="flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:underline"
                      >
                        {vencido && <AlertTriangle className="h-3.5 w-3.5 text-red-500" />}
                        {ticket.numero}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => navigate(`/tickets/${ticket.id}`)}
                        className="text-left"
                      >
                        <p className="text-sm text-gray-900 truncate max-w-xs hover:text-blue-600">{ticket.asunto}</p>
                        <p className="text-xs text-gray-400">{ticket.categoria}</p>
                      </button>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span
                        className="text-xs px-2 py-1 rounded-full font-medium"
                        style={{ backgroundColor: ticket.prioridadColor + '20', color: ticket.prioridadColor }}
                      >
                        {ticket.prioridad}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <ContadorTiempo fechaCreacion={ticket.fechaCreacion} />
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="text-sm text-gray-500">{formatDistanceToNow(ticket.fechaCreacion)}</span>
                    </td>
                    <td className="px-4 py-3">
                      {esAgente && (
                        <button
                          onClick={() => tomarMutation.mutate(ticket.id)}
                          disabled={tomarMutation.isPending && tomarMutation.variables === ticket.id}
                          className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1.5 rounded-lg font-medium transition disabled:opacity-50"
                        >
                          <UserCheck className="h-3.5 w-3.5" />
                          Tomar
                        </button>
                      )}

                      {esSupervisorOAdmin && (
                        <div className="flex items-center gap-2">
                          {asignandoId === ticket.id ? (
                            <>
                              <select
                                className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={tecnicoSeleccionado[ticket.id] ?? ''}
                                onChange={e => setTecnicoSeleccionado(p => ({ ...p, [ticket.id]: e.target.value }))}
                              >
                                <option value="">Seleccionar agente...</option>
                                {tecnicos?.map(t => (
                                  <option key={t.id} value={t.id}>{t.nombreCompleto}</option>
                                ))}
                              </select>
                              <button
                                disabled={!tecnicoSeleccionado[ticket.id] || asignarMutation.isPending}
                                onClick={() => asignarMutation.mutate({
                                  ticketId: ticket.id,
                                  tecnicoId: tecnicoSeleccionado[ticket.id],
                                })}
                                className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg font-medium transition disabled:opacity-40"
                              >
                                Asignar
                              </button>
                              <button
                                onClick={() => setAsignandoId(null)}
                                className="text-xs text-gray-500 hover:text-gray-700"
                              >
                                Cancelar
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => setAsignandoId(ticket.id)}
                              className="flex items-center gap-1.5 border border-gray-200 hover:border-blue-400 hover:text-blue-600 text-gray-600 text-xs px-3 py-1.5 rounded-lg font-medium transition"
                            >
                              <Users className="h-3.5 w-3.5" />
                              Asignar
                              <ChevronRight className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
