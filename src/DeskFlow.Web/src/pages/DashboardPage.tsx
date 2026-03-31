import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Ticket, Clock, CheckCircle, AlertTriangle, TrendingUp, ArrowRight, Star, RefreshCw } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { dashboardApi } from '../api/dashboard';
import { encuestasApi } from '../api/encuestas';
import { formatDistanceToNow } from '../utils/date';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export default function DashboardPage() {
  const queryClient = useQueryClient();
  const { data, isLoading, dataUpdatedAt, isFetching } = useQuery({
    queryKey: ['dashboard'],
    queryFn: dashboardApi.get,
    refetchInterval: 10000,
    staleTime: 0,
  });

  const { data: satisfaccion } = useQuery({
    queryKey: ['satisfaccion'],
    queryFn: encuestasApi.getPromedio,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-gray-100 rounded-xl p-4 h-24 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const stats = [
    { label: 'Total Tickets', value: data?.totalTickets ?? 0, icon: Ticket, accent: 'border-blue-500', iconBg: 'bg-blue-500', num: 'text-gray-900', sub: 'text-gray-500' },
    { label: 'Abiertos', value: data?.ticketsAbiertos ?? 0, icon: TrendingUp, accent: 'border-amber-400', iconBg: 'bg-amber-400', num: 'text-gray-900', sub: 'text-gray-500' },
    { label: 'En Proceso', value: data?.ticketsEnProceso ?? 0, icon: Clock, accent: 'border-violet-500', iconBg: 'bg-violet-500', num: 'text-gray-900', sub: 'text-gray-500' },
    { label: 'Resueltos', value: data?.ticketsResueltos ?? 0, icon: CheckCircle, accent: 'border-emerald-500', iconBg: 'bg-emerald-500', num: 'text-gray-900', sub: 'text-gray-500' },
    { label: 'Vencidos SLA', value: data?.ticketsVencidosSLA ?? 0, icon: AlertTriangle, accent: 'border-red-500', iconBg: 'bg-red-500', num: data?.ticketsVencidosSLA ? 'text-red-600' : 'text-gray-900', sub: 'text-gray-500' },
  ];

  const pieData = data?.porEstado.filter(e => e.cantidad > 0).map(e => ({
    name: e.estado,
    value: e.cantidad,
    color: e.color,
  })) ?? [];

  const barPrioridad = data?.porPrioridad.map(p => ({
    name: p.prioridad,
    cantidad: p.cantidad,
    color: p.color,
  })) ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">Dashboard</h1>
          <div className="flex items-center gap-2 mt-0.5">
            <p className="text-gray-500 text-[13px]">Resumen de actividad de soporte</p>
            {dataUpdatedAt > 0 && (
              <span className="text-[12px] text-gray-400">
                · {new Date(dataUpdatedAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => queryClient.invalidateQueries({ queryKey: ['dashboard'] })}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition text-gray-400 hover:text-gray-600"
            title="Actualizar ahora"
          >
            <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin text-blue-500' : ''}`} />
          </button>
          {satisfaccion && satisfaccion.promedio > 0 && (
            <div className="flex items-center gap-1.5 bg-yellow-50 px-3 py-1.5 rounded-lg border border-yellow-200">
              <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
              <span className="font-bold text-yellow-700 text-[14px]">{satisfaccion.promedio.toFixed(1)}</span>
              <span className="text-yellow-600 text-[12px]">satisfacción</span>
            </div>
          )}
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {stats.map(({ label, value, icon: Icon, accent, iconBg, num, sub }) => (
          <div key={label} className={`bg-white rounded-xl p-4 border border-gray-200 border-l-4 ${accent} flex items-center gap-3`}>
            <div className={`w-9 h-9 ${iconBg} rounded-lg flex items-center justify-center flex-shrink-0`}>
              <Icon className="h-4.5 w-4.5 text-white" style={{ width: 18, height: 18 }} />
            </div>
            <div className="min-w-0">
              <p className={`text-2xl font-bold leading-none ${num}`}>{value}</p>
              <p className={`text-[12px] ${sub} mt-1 leading-tight`}>{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Bar chart - Por prioridad */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-[14px] font-semibold text-gray-800 mb-4">Tickets por Prioridad</h3>
          {barPrioridad.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={barPrioridad} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="cantidad" radius={[4, 4, 0, 0]}>
                  {barPrioridad.map((entry, index) => (
                    <Cell key={index} fill={entry.color || COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-400 text-sm">Sin datos</div>
          )}
        </div>

        {/* Pie chart - Por estado */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-[14px] font-semibold text-gray-800 mb-4">Tickets por Estado</h3>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, percent }) => `${name ?? ''} ${(((percent as number) ?? 0) * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={index} fill={entry.color || COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-400 text-sm">Sin datos</div>
          )}
        </div>
      </div>

      {/* Recent tickets */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
          <h3 className="text-[14px] font-semibold text-gray-800">Últimos Tickets</h3>
          <Link to="/tickets" className="text-[12px] text-blue-600 hover:text-blue-700 flex items-center gap-1 font-medium">
            Ver todos <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        <div>
          {data?.ultimosTickets.map(t => (
            <Link key={t.id} to={`/tickets/${t.id}`}
              className="flex items-center justify-between py-2.5 px-5 hover:bg-gray-50 border-b border-gray-50 transition last:border-0">
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-[12px] font-semibold text-blue-600 w-20 flex-shrink-0 font-mono">{t.numero}</span>
                <span className="text-[13px] text-gray-700 truncate">{t.asunto}</span>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                <span
                  className="text-[11px] px-2 py-0.5 rounded-full font-medium"
                  style={{ backgroundColor: t.estadoColor + '20', color: t.estadoColor }}
                >
                  {t.estado}
                </span>
                <span className="text-[11px] text-gray-400 hidden sm:block w-20 text-right">{formatDistanceToNow(t.fechaCreacion)}</span>
              </div>
            </Link>
          ))}
          {!data?.ultimosTickets.length && (
            <p className="text-[13px] text-gray-400 text-center py-8">Sin tickets recientes</p>
          )}
        </div>
      </div>
    </div>
  );
}
