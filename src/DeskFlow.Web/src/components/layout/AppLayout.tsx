import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import {
  LayoutDashboard, Ticket, LogOut, Menu, X, Bell, BookOpen,
  Users, Tag, Settings, BarChart3, Star,
  Shield, Layers, ChevronRight, User, Inbox, CheckSquare,
  Briefcase, ShoppingBag, AlertTriangle, GitMerge, Workflow,
  Building2, Trophy, Award, HeadphonesIcon, Globe, BookMarked, LineChart, MapPin, Archive, Clock, PauseCircle
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ticketsApi } from '../../api/tickets';
import { aprobacionesApi } from '../../api/aprobaciones';
import { useAuthStore } from '../../store/authStore';
import { useNotificacionesStore } from '../../store/notificacionesStore';
import { useSignalR } from '../../hooks/useSignalR';
import { authApi } from '../../api/auth';
import { notificacionesApi } from '../../api/notificaciones';
import { permisosModuloApi } from '../../api/permisosModulo';
import { formatDistanceToNow } from '../../utils/date';
import { Toaster } from 'sonner';

interface NavChild {
  path: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: string[];
  modulo?: string;
  badge?: 'pendientes' | 'aprobaciones';
}

interface NavGroup {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: string[];
  modulo?: string;
  children: NavChild[];
}

interface NavLink {
  type: 'link';
  path: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: string[];
  modulo?: string;
}

type NavEntry = NavLink | (NavGroup & { type: 'group' });

const ROLES_STAFF   = ['Administrador', 'Supervisor', 'Agente'];
const ROLES_LECTURA = [...ROLES_STAFF, 'Observador'];

const navEntries: NavEntry[] = [
  {
    type: 'link',
    path: '/mi-trabajo',
    label: 'Mi Trabajo',
    icon: Briefcase,
    roles: ROLES_STAFF,
    modulo: 'mi-trabajo',
  },
  {
    type: 'group',
    id: 'helpdesk',
    label: 'Mesa de Ayuda',
    icon: HeadphonesIcon,
    children: [
      { path: '/tickets',          label: 'Tickets',            icon: Ticket,       modulo: 'tickets' },
      { path: '/tickets/cerrados', label: 'Tickets Cerrados',   icon: Archive,      modulo: 'tickets' },
      { path: '/cola-asignacion',  label: 'Cola de Asignación', icon: Inbox,        modulo: 'cola-asignacion', roles: ROLES_STAFF, badge: 'pendientes' },
      { path: '/aprobaciones',     label: 'Aprobaciones',       icon: CheckSquare,  modulo: 'aprobaciones',    roles: ['Administrador', 'Supervisor', 'Aprobador'], badge: 'aprobaciones' },
    ],
  },
  {
    type: 'group',
    id: 'itsm',
    label: 'ITSM',
    icon: GitMerge,
    roles: [...ROLES_STAFF, 'Aprobador', 'Observador'],
    children: [
      { path: '/problemas', label: 'Problemas',         icon: AlertTriangle, modulo: 'problemas', roles: ROLES_LECTURA },
      { path: '/cambios',   label: 'Change Management', icon: GitMerge,      modulo: 'cambios',   roles: [...ROLES_STAFF, 'Aprobador', 'Observador'] },
      { path: '/workflows', label: 'Workflow Builder',  icon: Workflow,      modulo: 'workflows', roles: ['Administrador', 'Supervisor'] },
    ],
  },
  {
    type: 'group',
    id: 'portales',
    label: 'Portales',
    icon: Globe,
    children: [
      { path: '/esm',     label: 'Portal ESM',            icon: Building2,  modulo: 'esm' },
      { path: '/catalogo',label: 'Catálogo de Servicios', icon: ShoppingBag,modulo: 'catalogo' },
    ],
  },
  {
    type: 'group',
    id: 'conocimiento',
    label: 'Conocimiento',
    icon: BookMarked,
    children: [
      { path: '/conocimiento', label: 'Base de Conocimiento', icon: BookOpen, modulo: 'conocimiento' },
      { path: '/encuestas',    label: 'Encuestas',            icon: Star,     modulo: 'encuestas' },
    ],
  },
  {
    type: 'group',
    id: 'analitica',
    label: 'Analítica',
    icon: LineChart,
    roles: ROLES_LECTURA,
    children: [
      { path: '/dashboard',    label: 'Dashboard',    icon: LayoutDashboard, modulo: 'dashboard',    roles: ROLES_LECTURA },
      { path: '/mi-dashboard', label: 'Mi Dashboard', icon: LayoutDashboard, modulo: 'gamificacion' },
      { path: '/ranking',      label: 'Ranking',      icon: Trophy,          modulo: 'ranking',      roles: ROLES_LECTURA },
      { path: '/mis-logros',   label: 'Mis Logros',   icon: Award,           modulo: 'gamificacion', roles: ROLES_STAFF },
      { path: '/reportes',     label: 'Reportes',     icon: BarChart3,       modulo: 'reportes',     roles: ROLES_LECTURA },
    ],
  },
  {
    type: 'group',
    id: 'admin',
    label: 'Administración',
    icon: Settings,
    roles: ['Supervisor', 'Administrador'],
    modulo: 'admin',
    children: [
      { path: '/admin/helpdesks',      label: 'Help Desks',        icon: Building2 },
      { path: '/admin/organizacion',   label: 'Organización',      icon: MapPin },
      { path: '/admin/usuarios',       label: 'Usuarios',          icon: Users },
      { path: '/admin/permisos-modulo',label: 'Permisos',          icon: Shield,      roles: ['Administrador'] },
      { path: '/admin/categorias',     label: 'Categorías',        icon: Layers },
      { path: '/admin/etiquetas',      label: 'Etiquetas',         icon: Tag },
      { path: '/admin/sla',            label: 'Config. SLA',       icon: Clock },
      { path: '/admin/motivos-espera', label: 'Motivos de Espera', icon: PauseCircle },
      { path: '/admin/auditoria',      label: 'Auditoría',         icon: Shield,      roles: ['Administrador'] },
    ],
  },
  {
    type: 'link',
    path: '/perfil',
    label: 'Mi Perfil',
    icon: User,
  },
];

const pageTitles: Record<string, string> = {
  '/mi-trabajo':        'Mi Trabajo',
  '/dashboard':         'Dashboard',
  '/mi-dashboard':      'Mi Dashboard',
  '/esm':               'Portal ESM',
  '/catalogo':          'Catálogo de Servicios',
  '/tickets/cerrados':  'Tickets Cerrados',
  '/tickets':           'Tickets',
  '/cola-asignacion':   'Cola de Asignación',
  '/aprobaciones':      'Aprobaciones',
  '/problemas':         'Problem Management',
  '/cambios':           'Change Management',
  '/workflows':         'Workflow Builder',
  '/conocimiento':      'Base de Conocimiento',
  '/encuestas':         'Encuestas',
  '/reportes':          'Reportes',
  '/ranking':           'Ranking de Agentes',
  '/mis-logros':        'Mis Logros',
  '/perfil':            'Mi Perfil',
  '/admin/helpdesks':    'Help Desks',
  '/admin/organizacion': 'Organización',
  '/admin/usuarios':     'Usuarios',
  '/admin/categorias':  'Categorías',
  '/admin/etiquetas':   'Etiquetas',
  '/admin/sla':            'Configuración SLA',
  '/admin/motivos-espera':   'Motivos de Espera',
  '/admin/permisos-modulo':  'Permisos por Módulo',
  '/admin/auditoria':        'Auditoría',
};

export default function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { usuario, clearAuth } = useAuthStore();
  const { notificaciones, noLeidas, setNotificaciones, marcarLeida, marcarTodasLeidas } = useNotificacionesStore();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notifOpen, setNotifOpen]     = useState(false);
  const [openGroups, setOpenGroups]   = useState<Record<string, boolean>>({});
  const notifRef = useRef<HTMLDivElement>(null);

  useSignalR();

  const esStaff     = ROLES_STAFF.includes(usuario?.rol ?? '');
  const esAprobador = ['Administrador', 'Supervisor', 'Aprobador'].includes(usuario?.rol ?? '');

  const { data: misModulos } = useQuery({
    queryKey: ['mis-modulos'],
    queryFn: permisosModuloApi.getMisModulos,
    staleTime: 5 * 60 * 1000,
    enabled: !!usuario,
  });

  // Auto-abrir el grupo que contiene la ruta activa
  useEffect(() => {
    navEntries.forEach(entry => {
      if (entry.type === 'group') {
        const hasActive = entry.children.some(c => location.pathname.startsWith(c.path));
        if (hasActive) setOpenGroups(prev => ({ ...prev, [entry.id]: true }));
      }
    });
  }, [location.pathname]);

  const toggleGroup = (id: string) =>
    setOpenGroups(prev => ({ ...prev, [id]: !prev[id] }));

  // Badges
  const { data: pendientesData } = useQuery({
    queryKey: ['tickets-pendientes-count'],
    queryFn: () => ticketsApi.getAll({ soloSinAsignar: true, pageSize: 1 }),
    enabled: esStaff,
    refetchInterval: 60000,
  });
  const pendientesCount = pendientesData?.total ?? 0;

  const { data: aprobacionesPendientes } = useQuery({
    queryKey: ['aprobaciones-pendientes'],
    queryFn: aprobacionesApi.getPendientes,
    enabled: esAprobador,
    refetchInterval: 60000,
  });
  const aprobacionesCount = aprobacionesPendientes?.length ?? 0;

  const getBadge = (badge?: string) =>
    badge === 'pendientes' ? pendientesCount : badge === 'aprobaciones' ? aprobacionesCount : 0;

  // Notificaciones
  const { data: notifsData } = useQuery({
    queryKey: ['notificaciones'],
    queryFn: () => notificacionesApi.getAll(),
    refetchInterval: 60000,
  });
  useEffect(() => { if (notifsData) setNotificaciones(notifsData); }, [notifsData]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node))
        setNotifOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const marcarLeidaMutation = useMutation({
    mutationFn: notificacionesApi.marcarLeida,
    onSuccess: (_, id) => { marcarLeida(id); queryClient.invalidateQueries({ queryKey: ['notificaciones'] }); },
  });
  const marcarTodasMutation = useMutation({
    mutationFn: notificacionesApi.marcarTodasLeidas,
    onSuccess: () => { marcarTodasLeidas(); queryClient.invalidateQueries({ queryKey: ['notificaciones'] }); },
  });

  const handleLogout = async () => {
    try { await authApi.logout(); } catch { /* ignore */ }
    clearAuth();
    navigate('/login');
  };

  const canAccess = (roles?: string[]) => !roles || roles.includes(usuario?.rol ?? '');
  const canAccessModulo = (modulo?: string) => {
    if (!modulo) return true;
    if (!misModulos || misModulos.length === 0) return true; // fallback: sin config = todo visible
    return misModulos.includes(modulo);
  };
  const canShow = (entry: { roles?: string[]; modulo?: string }) =>
    canAccess(entry.roles) && canAccessModulo(entry.modulo);
  const isActive  = (path: string) => {
    if (path === '/tickets') return location.pathname === '/tickets';
    return location.pathname.startsWith(path);
  };
  const currentTitle = Object.entries(pageTitles).find(([p]) => location.pathname.startsWith(p))?.[1] ?? 'DeskFlow';

  return (
    <div className="flex h-screen bg-[var(--shell)] text-slate-900">
      <Toaster position="top-right" richColors />

      {/* ── Sidebar ── */}
      <aside className={`${sidebarOpen ? 'w-72' : 'w-[78px]'} transition-all duration-300 bg-[linear-gradient(180deg,var(--sidebar)_0%,var(--sidebar-soft)_100%)] text-white flex flex-col flex-shrink-0 shadow-[0_28px_60px_-32px_rgba(15,23,42,0.7)]`}>

        {/* Logo */}
        <div className={`flex items-center ${sidebarOpen ? 'justify-between px-4' : 'justify-center px-3'} h-20 border-b border-[var(--sidebar-border)] flex-shrink-0`}>
          {sidebarOpen && (
            <div className="flex items-center gap-2.5">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(180deg,#38bdf8,#2563eb)] text-sm font-bold tracking-tight shadow-[0_14px_30px_-16px_rgba(56,189,248,0.75)]">
                DF
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.24em] text-slate-400">Service Desk</p>
                <span className="font-semibold text-[17px] tracking-tight text-white">DeskFlow</span>
              </div>
            </div>
          )}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="rounded-xl p-2 text-slate-400 transition hover:bg-white/10 hover:text-white">
            {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1 overflow-y-auto overflow-x-hidden px-3 py-4">
          {navEntries.map(entry => {
            if (!canShow(entry)) return null;

            // ── Direct link ──
            if (entry.type === 'link') {
              return (
                <Link
                  key={entry.path}
                  to={entry.path}
                  title={!sidebarOpen ? entry.label : undefined}
                  className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 transition-all text-[13px] font-medium
                    ${isActive(entry.path)
                      ? 'bg-white text-slate-950 shadow-[0_18px_30px_-22px_rgba(255,255,255,0.55)]'
                      : 'text-slate-400 hover:bg-white/7 hover:text-slate-100'}`}
                >
                  <entry.icon className="h-4 w-4 flex-shrink-0" />
                  {sidebarOpen && <span className="flex-1 truncate">{entry.label}</span>}
                </Link>
              );
            }

            // ── Collapsible group ──
            const visibleChildren = entry.children.filter(c => canShow(c));
            if (visibleChildren.length === 0) return null;

            const open = openGroups[entry.id] ?? false;
            const hasActive = visibleChildren.some(c => isActive(c.path));

            // Badge total del grupo (suma de todos sus hijos con badge)
            const groupBadge = visibleChildren.reduce((sum, c) => sum + getBadge(c.badge), 0);

            return (
              <div key={entry.id}>
                <button
                  onClick={() => toggleGroup(entry.id)}
                  title={!sidebarOpen ? entry.label : undefined}
                  className={`w-full flex items-center gap-3 rounded-2xl px-3 py-2.5 transition-all text-[13px] font-medium
                    ${hasActive ? 'bg-white/8 text-slate-100' : 'text-slate-500 hover:bg-white/7 hover:text-slate-200'}`}
                >
                  <entry.icon className="h-4 w-4 flex-shrink-0" />
                  {sidebarOpen && (
                    <>
                      <span className="flex-1 text-left truncate">{entry.label}</span>
                      {!open && groupBadge > 0 && (
                        <span className="bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 flex-shrink-0">
                          {groupBadge > 9 ? '9+' : groupBadge}
                        </span>
                      )}
                      <ChevronRight className={`h-3.5 w-3.5 transition-transform flex-shrink-0 text-slate-500 ${open ? 'rotate-90' : ''}`} />
                    </>
                  )}
                </button>

                {sidebarOpen && open && (
                  <div className="ml-3 mt-1 mb-2 space-y-1 border-l border-white/8 pl-4">
                    {visibleChildren.map(child => {
                      const badge = getBadge(child.badge);
                      return (
                        <Link
                          key={child.path}
                          to={child.path}
                          className={`flex items-center gap-2.5 rounded-xl px-3 py-2 transition-all text-[12.5px]
                            ${isActive(child.path)
                              ? 'border border-sky-400/20 bg-sky-500/15 text-sky-100 font-medium'
                              : 'text-slate-400 hover:bg-white/6 hover:text-slate-100'}`}
                        >
                          <child.icon className="h-3.5 w-3.5 flex-shrink-0" />
                          <span className="flex-1 truncate">{child.label}</span>
                          {badge > 0 && (
                            <span className="bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 flex-shrink-0">
                              {badge > 9 ? '9+' : badge}
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* User footer */}
        <div className="border-t border-[var(--sidebar-border)] px-3 py-3 flex-shrink-0">
          {sidebarOpen ? (
            <div className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/5 px-3 py-3 transition hover:bg-white/8">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[linear-gradient(180deg,#38bdf8,#2563eb)] text-[11px] font-bold flex-shrink-0">
                {usuario?.nombre?.[0]}{usuario?.apellido?.[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-slate-100 truncate leading-tight">{usuario?.nombre} {usuario?.apellido}</p>
                <p className="text-[11px] text-slate-400 truncate leading-tight">{usuario?.rol}</p>
              </div>
              <button onClick={handleLogout} className="rounded-xl p-2 transition hover:bg-white/10" title="Cerrar sesión">
                <LogOut className="h-3.5 w-3.5 text-slate-400" />
              </button>
            </div>
          ) : (
            <button onClick={handleLogout} className="flex w-full justify-center rounded-2xl p-3 transition hover:bg-white/10" title="Cerrar sesión">
              <LogOut className="h-4 w-4 text-slate-400" />
            </button>
          )}
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <header className="df-panel mx-4 mt-4 flex h-16 items-center justify-between rounded-[1.25rem] px-6 flex-shrink-0">
          <div>
            <p className="df-kicker mb-1">Workspace</p>
            <h2 className="df-title text-[20px] font-semibold text-slate-900 tracking-tight">{currentTitle}</h2>
          </div>
          <div className="flex items-center gap-2">

            {/* Bell */}
            <div ref={notifRef} className="relative">
              <button
                onClick={() => setNotifOpen(!notifOpen)}
                className="relative rounded-xl border border-slate-200 bg-white/70 p-2.5 shadow-sm transition hover:border-slate-300 hover:bg-white"
              >
                <Bell className="h-4.5 w-4.5 text-slate-500" style={{ width: 18, height: 18 }} />
                {noLeidas > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-red-500 rounded-full text-white text-[10px] flex items-center justify-center font-bold px-1">
                    {noLeidas > 9 ? '9+' : noLeidas}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 top-full mt-2 z-50 w-80 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_28px_60px_-34px_rgba(15,23,42,0.45)]">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                    <h3 className="font-semibold text-[13px] text-gray-900">Notificaciones</h3>
                    {noLeidas > 0 && (
                      <button onClick={() => marcarTodasMutation.mutate()} className="text-[12px] text-blue-600 hover:text-blue-700 font-medium">
                        Marcar todas leídas
                      </button>
                    )}
                  </div>
                  <div className="max-h-[360px] overflow-y-auto">
                    {notificaciones.length === 0 ? (
                      <p className="text-center text-gray-400 text-sm py-10">Sin notificaciones</p>
                    ) : (
                      notificaciones.slice(0, 20).map(n => (
                        <div
                          key={n.id}
                          onClick={() => {
                            if (!n.leida) marcarLeidaMutation.mutate(n.id);
                            setNotifOpen(false);
                            if (n.ticketId) {
                              navigate(`/tickets/${n.ticketId}`);
                            } else if (n.titulo.includes('RFC') || n.titulo.includes('CHG') || n.titulo.includes('cambio')) {
                              navigate('/cambios');
                            } else if (n.titulo.toLowerCase().includes('problema')) {
                              navigate('/problemas');
                            }
                          }}
                          className={`px-4 py-3 border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition ${!n.leida ? 'bg-blue-50/60' : ''}`}
                        >
                          <div className="flex items-start gap-2.5">
                            {!n.leida && <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0" />}
                            <div className={`flex-1 min-w-0 ${n.leida ? 'pl-4' : ''}`}>
                              <p className="text-[13px] font-medium text-gray-900 truncate">{n.titulo}</p>
                              <p className="text-[12px] text-gray-500 mt-0.5 line-clamp-2 leading-relaxed">{n.mensaje}</p>
                              <p className="text-[11px] text-gray-400 mt-1">{formatDistanceToNow(n.fechaCreacion)}</p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Avatar */}
            <div className="ml-2 flex items-center gap-3 border-l border-slate-200 pl-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[linear-gradient(180deg,#1d4ed8,#0f172a)] text-[11px] text-white font-bold flex-shrink-0 shadow-sm">
                {usuario?.nombre?.[0]}{usuario?.apellido?.[0]}
              </div>
              <div className="hidden sm:block">
                <p className="text-[13px] font-medium text-slate-800">{usuario?.nombre}</p>
                <p className="text-[11px] text-slate-400">{usuario?.rol}</p>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto px-4 pb-4 pt-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
