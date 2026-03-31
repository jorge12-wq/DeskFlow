import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from './store/authStore';
import AppLayout from './components/layout/AppLayout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import TicketsPage from './pages/TicketsPage';
import NuevoTicketPage from './pages/NuevoTicketPage';
import TicketDetailPage from './pages/TicketDetailPage';
import KnowledgeListPage from './pages/KnowledgeListPage';
import KnowledgeArticlePage from './pages/KnowledgeArticlePage';
import KnowledgeEditorPage from './pages/KnowledgeEditorPage';
import ReportsPage from './pages/ReportsPage';
import SurveyPage from './pages/SurveyPage';
import ProfilePage from './pages/ProfilePage';
import ColaPendienteAsignacionPage from './pages/ColaPendienteAsignacionPage';
import AprobacionesPage from './pages/AprobacionesPage';
import MiTrabajoPage from './pages/MiTrabajoPage';
import UsersPage from './pages/admin/UsersPage';
import PermisosModuloPage from './pages/admin/PermisosModuloPage';
import CategoriesPage from './pages/admin/CategoriesPage';
import EtiquetasPage from './pages/admin/EtiquetasPage';
import AuditLogPage from './pages/admin/AuditLogPage';
import CatalogoPage from './pages/CatalogoPage';
import SolicitarServicioPage from './pages/SolicitarServicioPage';
import ProblemasPage from './pages/ProblemasPage';
import ProblemaDetailPage from './pages/ProblemaDetailPage';
import NuevoProblemaPage from './pages/NuevoProblemaPage';
import CambiosPage from './pages/CambiosPage';
import CambioDetailPage from './pages/CambioDetailPage';
import NuevoCambioPage from './pages/NuevoCambioPage';
import WorkflowsPage from './pages/WorkflowsPage';
import WorkflowBuilderPage from './pages/WorkflowBuilderPage';
import EsmPortalPage from './pages/EsmPortalPage';
import HelpDeskPage from './pages/HelpDeskPage';
import HelpDesksAdminPage from './pages/admin/HelpDesksAdminPage';
import TicketsCerradosPage from './pages/TicketsCerradosPage';
import SLAConfigPage from './pages/admin/SLAConfigPage';
import MotivosEsperaPage from './pages/admin/MotivosEsperaPage';
import OrganizacionPage from './pages/admin/OrganizacionPage';
import RankingPage from './pages/RankingPage';
import MisLogrosPage from './pages/MisLogrosPage';
import DashboardPersonalizadoPage from './pages/DashboardPersonalizadoPage';
import { ErrorBoundary } from './components/ErrorBoundary';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30000 },
  },
});

const ROLES_CON_DASHBOARD = ['Administrador', 'Supervisor', 'Agente', 'Observador'];
const ROLES_STAFF         = ['Administrador', 'Supervisor', 'Agente'];
const ROLES_APROBACION    = ['Administrador', 'Supervisor', 'Aprobador'];

function ProtectedRoute({ children, roles }: { children: React.ReactNode; roles?: string[] }) {
  const { isAuthenticated, usuario } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  const rol = usuario?.rol ?? '';
  if (roles && !roles.includes(rol)) {
    return <Navigate to={ROLES_CON_DASHBOARD.includes(rol) ? '/mi-trabajo' : '/tickets'} replace />;
  }
  return <>{children}</>;
}

export default function App() {
  return (
    <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
            <Route index element={<Navigate to="/mi-trabajo" replace />} />
            <Route path="mi-trabajo" element={<ProtectedRoute roles={ROLES_STAFF}><MiTrabajoPage /></ProtectedRoute>} />
            <Route path="dashboard" element={<ProtectedRoute roles={ROLES_CON_DASHBOARD}><DashboardPage /></ProtectedRoute>} />
            <Route path="tickets" element={<TicketsPage />} />
            <Route path="tickets/cerrados" element={<TicketsCerradosPage />} />
            <Route path="tickets/nuevo" element={<NuevoTicketPage />} />
            <Route path="tickets/:id" element={<TicketDetailPage />} />
            <Route path="cola-asignacion" element={
              <ProtectedRoute roles={ROLES_STAFF}>
                <ColaPendienteAsignacionPage />
              </ProtectedRoute>
            } />
            <Route path="aprobaciones" element={
              <ProtectedRoute roles={ROLES_APROBACION}>
                <AprobacionesPage />
              </ProtectedRoute>
            } />
            <Route path="conocimiento" element={<KnowledgeListPage />} />
            <Route path="conocimiento/nuevo" element={<ProtectedRoute roles={[...ROLES_STAFF, 'Aprobador']}><KnowledgeEditorPage /></ProtectedRoute>} />
            <Route path="conocimiento/:id" element={<KnowledgeArticlePage />} />
            <Route path="conocimiento/:id/editar" element={<ProtectedRoute roles={[...ROLES_STAFF, 'Aprobador']}><KnowledgeEditorPage /></ProtectedRoute>} />
            <Route path="esm" element={<EsmPortalPage />} />
            <Route path="esm/:id" element={<HelpDeskPage />} />
            <Route path="catalogo" element={<CatalogoPage />} />
            <Route path="catalogo/servicios/:id" element={<SolicitarServicioPage />} />
            <Route path="problemas" element={<ProtectedRoute roles={[...ROLES_STAFF, 'Observador']}><ProblemasPage /></ProtectedRoute>} />
            <Route path="problemas/nuevo" element={<ProtectedRoute roles={ROLES_STAFF}><NuevoProblemaPage /></ProtectedRoute>} />
            <Route path="problemas/:id" element={<ProtectedRoute roles={[...ROLES_STAFF, 'Observador']}><ProblemaDetailPage /></ProtectedRoute>} />
            <Route path="cambios" element={<ProtectedRoute roles={[...ROLES_STAFF, 'Aprobador', 'Observador']}><CambiosPage /></ProtectedRoute>} />
            <Route path="cambios/nuevo" element={<ProtectedRoute roles={ROLES_STAFF}><NuevoCambioPage /></ProtectedRoute>} />
            <Route path="cambios/:id" element={<ProtectedRoute roles={[...ROLES_STAFF, 'Aprobador', 'Observador']}><CambioDetailPage /></ProtectedRoute>} />
            <Route path="workflows" element={<ProtectedRoute roles={['Administrador', 'Supervisor']}><WorkflowsPage /></ProtectedRoute>} />
            <Route path="workflows/:id" element={<ProtectedRoute roles={['Administrador', 'Supervisor']}><WorkflowBuilderPage /></ProtectedRoute>} />
            <Route path="ranking" element={<ProtectedRoute roles={[...ROLES_STAFF, 'Observador']}><RankingPage /></ProtectedRoute>} />
            <Route path="mis-logros" element={<ProtectedRoute roles={ROLES_STAFF}><MisLogrosPage /></ProtectedRoute>} />
            <Route path="mi-dashboard" element={<DashboardPersonalizadoPage />} />
            <Route path="encuestas" element={<SurveyPage />} />
            <Route path="reportes" element={<ProtectedRoute roles={[...ROLES_STAFF, 'Observador']}><ReportsPage /></ProtectedRoute>} />
            <Route path="perfil" element={<ProfilePage />} />
            <Route path="admin/helpdesks" element={<ProtectedRoute roles={['Administrador','Supervisor']}><HelpDesksAdminPage /></ProtectedRoute>} />
            <Route path="admin/usuarios" element={<ProtectedRoute roles={['Administrador']}><UsersPage /></ProtectedRoute>} />
            <Route path="admin/permisos-modulo" element={<ProtectedRoute roles={['Administrador']}><PermisosModuloPage /></ProtectedRoute>} />
            <Route path="admin/categorias" element={<ProtectedRoute roles={['Supervisor', 'Administrador']}><CategoriesPage /></ProtectedRoute>} />
            <Route path="admin/etiquetas" element={<ProtectedRoute roles={['Supervisor', 'Administrador']}><EtiquetasPage /></ProtectedRoute>} />
            <Route path="admin/sla" element={<ProtectedRoute roles={['Supervisor', 'Administrador']}><SLAConfigPage /></ProtectedRoute>} />
            <Route path="admin/motivos-espera" element={<ProtectedRoute roles={['Supervisor', 'Administrador']}><MotivosEsperaPage /></ProtectedRoute>} />
            <Route path="admin/auditoria" element={<ProtectedRoute roles={['Administrador']}><AuditLogPage /></ProtectedRoute>} />
            <Route path="admin/organizacion" element={<ProtectedRoute roles={['Administrador']}><OrganizacionPage /></ProtectedRoute>} />
          </Route>
          <Route path="*" element={<Navigate to="/mi-trabajo" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
    </ErrorBoundary>
  );
}
