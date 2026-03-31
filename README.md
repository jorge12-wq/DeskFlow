# DeskFlow

DeskFlow es un sistema de mesa de ayuda y soporte tecnico empresarial. El proyecto ya tiene una base funcional bastante completa y este documento sirve como guia rapida para entenderlo, navegarlo y saber donde tocar cuando quieras cambiar algo.

## Que es DeskFlow

A nivel funcional, DeskFlow resuelve este flujo:

1. Un usuario inicia sesion.
2. Crea un ticket de soporte.
3. El sistema calcula su SLA y puede autoasignarlo.
4. Tecnicos y supervisores lo trabajan.
5. Se registran comentarios, cambios de estado e historial.
6. Se disparan notificaciones en tiempo real.
7. Al cerrar o resolver, se pueden generar reportes y encuestas.

Roles principales:

- `Administrador`: acceso total.
- `Supervisor`: supervisa, asigna y controla.
- `Tecnico`: atiende tickets y genera conocimiento/reportes.
- `Usuario`: crea y consulta sus tickets.

## Arquitectura General

DeskFlow esta dividido en capas bien marcadas:

### `src/DeskFlow.Core`

Es la capa de dominio.

Aqui viven:

- Entidades del negocio.
- DTOs.
- Enums.
- Interfaces de servicios y repositorios.

Regla mental: si quieres entender que datos existen y que conceptos maneja el sistema, empiezas aqui.

Archivos clave:

- [Ticket.cs](C:/Users/Desarrollo%20TI/OneDrive%20-%20TASSOS%20S.A/Escritorio/Proyectos/DeskFlow/src/DeskFlow.Core/Entities/Ticket.cs)
- [Usuario.cs](C:/Users/Desarrollo%20TI/OneDrive%20-%20TASSOS%20S.A/Escritorio/Proyectos/DeskFlow/src/DeskFlow.Core/Entities/Usuario.cs)
- [DeskFlow.Core.csproj](C:/Users/Desarrollo%20TI/OneDrive%20-%20TASSOS%20S.A/Escritorio/Proyectos/DeskFlow/src/DeskFlow.Core/DeskFlow.Core.csproj)

### `src/DeskFlow.Infrastructure`

Es la capa donde realmente se implementa el negocio.

Aqui viven:

- `DbContext` y configuracion de EF Core.
- Migraciones.
- Repositorios.
- Servicios de aplicacion.
- Jobs/background services.
- Seed de base de datos.

Regla mental: si quieres entender como funciona el sistema de verdad, esta es la capa mas importante.

Archivos clave:

- [DeskFlowDbContext.cs](C:/Users/Desarrollo%20TI/OneDrive%20-%20TASSOS%20S.A/Escritorio/Proyectos/DeskFlow/src/DeskFlow.Infrastructure/Data/DeskFlowDbContext.cs)
- [DependencyInjection.cs](C:/Users/Desarrollo%20TI/OneDrive%20-%20TASSOS%20S.A/Escritorio/Proyectos/DeskFlow/src/DeskFlow.Infrastructure/DependencyInjection.cs)
- [DatabaseSeeder.cs](C:/Users/Desarrollo%20TI/OneDrive%20-%20TASSOS%20S.A/Escritorio/Proyectos/DeskFlow/src/DeskFlow.Infrastructure/Data/DatabaseSeeder.cs)
- [TicketService.cs](C:/Users/Desarrollo%20TI/OneDrive%20-%20TASSOS%20S.A/Escritorio/Proyectos/DeskFlow/src/DeskFlow.Infrastructure/Services/TicketService.cs)
- [SLAService.cs](C:/Users/Desarrollo%20TI/OneDrive%20-%20TASSOS%20S.A/Escritorio/Proyectos/DeskFlow/src/DeskFlow.Infrastructure/Services/SLAService.cs)
- [NotificacionService.cs](C:/Users/Desarrollo%20TI/OneDrive%20-%20TASSOS%20S.A/Escritorio/Proyectos/DeskFlow/src/DeskFlow.Infrastructure/Services/NotificacionService.cs)
- [ReporteService.cs](C:/Users/Desarrollo%20TI/OneDrive%20-%20TASSOS%20S.A/Escritorio/Proyectos/DeskFlow/src/DeskFlow.Infrastructure/Services/ReporteService.cs)

### `src/DeskFlow.API`

Es la capa HTTP del backend.

Aqui viven:

- Controllers REST.
- Configuracion de JWT.
- CORS.
- Swagger.
- Middleware global.
- Hubs de SignalR.
- Adaptadores de contexto del request.

Regla mental: si quieres saber que endpoints existen o por donde entra el frontend, mira aqui.

Archivos clave:

- [Program.cs](C:/Users/Desarrollo%20TI/OneDrive%20-%20TASSOS%20S.A/Escritorio/Proyectos/DeskFlow/src/DeskFlow.API/Program.cs)
- [AuthController.cs](C:/Users/Desarrollo%20TI/OneDrive%20-%20TASSOS%20S.A/Escritorio/Proyectos/DeskFlow/src/DeskFlow.API/Controllers/AuthController.cs)
- [TicketsController.cs](C:/Users/Desarrollo%20TI/OneDrive%20-%20TASSOS%20S.A/Escritorio/Proyectos/DeskFlow/src/DeskFlow.API/Controllers/TicketsController.cs)
- [CatalogosController.cs](C:/Users/Desarrollo%20TI/OneDrive%20-%20TASSOS%20S.A/Escritorio/Proyectos/DeskFlow/src/DeskFlow.API/Controllers/CatalogosController.cs)
- [TenantContextService.cs](C:/Users/Desarrollo%20TI/OneDrive%20-%20TASSOS%20S.A/Escritorio/Proyectos/DeskFlow/src/DeskFlow.API/Middleware/TenantContextService.cs)
- [ExceptionMiddleware.cs](C:/Users/Desarrollo%20TI/OneDrive%20-%20TASSOS%20S.A/Escritorio/Proyectos/DeskFlow/src/DeskFlow.API/Middleware/ExceptionMiddleware.cs)
- [NotificacionHub.cs](C:/Users/Desarrollo%20TI/OneDrive%20-%20TASSOS%20S.A/Escritorio/Proyectos/DeskFlow/src/DeskFlow.API/Hubs/NotificacionHub.cs)

### `src/DeskFlow.Web`

Es el frontend.

Tecnologias principales:

- React.
- TypeScript.
- Vite.
- React Query.
- Zustand.
- Axios.
- SignalR.

Aqui viven:

- Paginas.
- Layout.
- Clientes API.
- Stores.
- Hooks.

Regla mental: si quieres tocar la experiencia del usuario o la navegacion, empiezas aqui.

Archivos clave:

- [App.tsx](C:/Users/Desarrollo%20TI/OneDrive%20-%20TASSOS%20S.A/Escritorio/Proyectos/DeskFlow/src/DeskFlow.Web/src/App.tsx)
- [AppLayout.tsx](C:/Users/Desarrollo%20TI/OneDrive%20-%20TASSOS%20S.A/Escritorio/Proyectos/DeskFlow/src/DeskFlow.Web/src/components/layout/AppLayout.tsx)
- [client.ts](C:/Users/Desarrollo%20TI/OneDrive%20-%20TASSOS%20S.A/Escritorio/Proyectos/DeskFlow/src/DeskFlow.Web/src/api/client.ts)
- [authStore.ts](C:/Users/Desarrollo%20TI/OneDrive%20-%20TASSOS%20S.A/Escritorio/Proyectos/DeskFlow/src/DeskFlow.Web/src/store/authStore.ts)
- [useSignalR.ts](C:/Users/Desarrollo%20TI/OneDrive%20-%20TASSOS%20S.A/Escritorio/Proyectos/DeskFlow/src/DeskFlow.Web/src/hooks/useSignalR.ts)

## Flujo De Datos

La ruta principal de datos es:

`DeskFlow.Web -> DeskFlow.API -> DeskFlow.Infrastructure -> DeskFlow.Core -> SQL Server`

Mas concretamente:

1. El frontend llama un endpoint o hub.
2. La API autentica al usuario.
3. `TenantContextService` extrae `tenantId`, `usuarioId` y rol desde claims.
4. Los controllers delegan la logica a servicios.
5. Infrastructure consulta o persiste en EF Core.
6. El `DbContext` aplica filtros globales por tenant.
7. La API devuelve DTOs al frontend.
8. Si corresponde, SignalR empuja actualizaciones en vivo.

## Autenticacion Y Multitenancy

DeskFlow usa JWT.

Los claims importantes del token son:

- `tenantId`
- `sub` o `NameIdentifier`
- `role`

Con eso se resuelve:

- Que usuario esta operando.
- A que tenant pertenece.
- Que permisos tiene.

Esto es importante porque gran parte del sistema depende del contexto del request:

- [Program.cs](C:/Users/Desarrollo%20TI/OneDrive%20-%20TASSOS%20S.A/Escritorio/Proyectos/DeskFlow/src/DeskFlow.API/Program.cs) configura autenticacion.
- [TenantContextService.cs](C:/Users/Desarrollo%20TI/OneDrive%20-%20TASSOS%20S.A/Escritorio/Proyectos/DeskFlow/src/DeskFlow.API/Middleware/TenantContextService.cs) lee los claims.
- [DeskFlowDbContext.cs](C:/Users/Desarrollo%20TI/OneDrive%20-%20TASSOS%20S.A/Escritorio/Proyectos/DeskFlow/src/DeskFlow.Infrastructure/Data/DeskFlowDbContext.cs) aplica filtros por tenant.

## Modulos Principales

### Tickets

Es el corazon del proyecto.

Responsabilidades:

- Crear tickets.
- Filtrarlos y paginarlos.
- Cambiar estado.
- Asignar tecnico.
- Agregar comentarios.
- Registrar historial.
- Manejar etiquetas.
- Notificar cambios.

Archivos principales:

- [TicketsController.cs](C:/Users/Desarrollo%20TI/OneDrive%20-%20TASSOS%20S.A/Escritorio/Proyectos/DeskFlow/src/DeskFlow.API/Controllers/TicketsController.cs)
- [TicketService.cs](C:/Users/Desarrollo%20TI/OneDrive%20-%20TASSOS%20S.A/Escritorio/Proyectos/DeskFlow/src/DeskFlow.Infrastructure/Services/TicketService.cs)
- [TicketRepository.cs](C:/Users/Desarrollo%20TI/OneDrive%20-%20TASSOS%20S.A/Escritorio/Proyectos/DeskFlow/src/DeskFlow.Infrastructure/Repositories/TicketRepository.cs)
- [TicketsPage.tsx](C:/Users/Desarrollo%20TI/OneDrive%20-%20TASSOS%20S.A/Escritorio/Proyectos/DeskFlow/src/DeskFlow.Web/src/pages/TicketsPage.tsx)
- [TicketDetailPage.tsx](C:/Users/Desarrollo%20TI/OneDrive%20-%20TASSOS%20S.A/Escritorio/Proyectos/DeskFlow/src/DeskFlow.Web/src/pages/TicketDetailPage.tsx)
- [NuevoTicketPage.tsx](C:/Users/Desarrollo%20TI/OneDrive%20-%20TASSOS%20S.A/Escritorio/Proyectos/DeskFlow/src/DeskFlow.Web/src/pages/NuevoTicketPage.tsx)

### SLA

Responsabilidades:

- Calcular fecha limite.
- Marcar tickets en tiempo, en riesgo o vencidos.
- Pausar SLA en ciertos estados.
- Reanudar SLA cuando vuelve el flujo.
- Revisar periodicamente tickets activos.

Archivos principales:

- [SLAService.cs](C:/Users/Desarrollo%20TI/OneDrive%20-%20TASSOS%20S.A/Escritorio/Proyectos/DeskFlow/src/DeskFlow.Infrastructure/Services/SLAService.cs)
- [SLAMonitorBackgroundService.cs](C:/Users/Desarrollo%20TI/OneDrive%20-%20TASSOS%20S.A/Escritorio/Proyectos/DeskFlow/src/DeskFlow.Infrastructure/BackgroundServices/SLAMonitorBackgroundService.cs)

### Notificaciones

Responsabilidades:

- Guardar notificaciones en base.
- Consultarlas.
- Marcar una o todas como leidas.
- Empujar eventos por SignalR.

Archivos principales:

- [NotificacionService.cs](C:/Users/Desarrollo%20TI/OneDrive%20-%20TASSOS%20S.A/Escritorio/Proyectos/DeskFlow/src/DeskFlow.Infrastructure/Services/NotificacionService.cs)
- [NotificacionesController.cs](C:/Users/Desarrollo%20TI/OneDrive%20-%20TASSOS%20S.A/Escritorio/Proyectos/DeskFlow/src/DeskFlow.API/Controllers/NotificacionesController.cs)
- [NotificacionHub.cs](C:/Users/Desarrollo%20TI/OneDrive%20-%20TASSOS%20S.A/Escritorio/Proyectos/DeskFlow/src/DeskFlow.API/Hubs/NotificacionHub.cs)
- [SignalRNotificacionPushService.cs](C:/Users/Desarrollo%20TI/OneDrive%20-%20TASSOS%20S.A/Escritorio/Proyectos/DeskFlow/src/DeskFlow.API/Services/SignalRNotificacionPushService.cs)
- [useSignalR.ts](C:/Users/Desarrollo%20TI/OneDrive%20-%20TASSOS%20S.A/Escritorio/Proyectos/DeskFlow/src/DeskFlow.Web/src/hooks/useSignalR.ts)

### Dashboard

Responsabilidades:

- Mostrar KPIs.
- Agrupar tickets por estado, prioridad, categoria y tecnico.
- Mostrar ultimos tickets.
- Mostrar datos agregados de operacion.

Archivos principales:

- [DashboardController.cs](C:/Users/Desarrollo%20TI/OneDrive%20-%20TASSOS%20S.A/Escritorio/Proyectos/DeskFlow/src/DeskFlow.API/Controllers/DashboardController.cs)
- [DashboardService.cs](C:/Users/Desarrollo%20TI/OneDrive%20-%20TASSOS%20S.A/Escritorio/Proyectos/DeskFlow/src/DeskFlow.Infrastructure/Services/DashboardService.cs)
- [DashboardPage.tsx](C:/Users/Desarrollo%20TI/OneDrive%20-%20TASSOS%20S.A/Escritorio/Proyectos/DeskFlow/src/DeskFlow.Web/src/pages/DashboardPage.tsx)

### Base De Conocimiento

Responsabilidades:

- Buscar articulos.
- Consultar populares.
- Sugerir articulos por ticket.
- Ver relacionados.
- Crear y editar articulos.

Archivos principales:

- [ConocimientoController.cs](C:/Users/Desarrollo%20TI/OneDrive%20-%20TASSOS%20S.A/Escritorio/Proyectos/DeskFlow/src/DeskFlow.API/Controllers/ConocimientoController.cs)
- [BaseConocimientoService.cs](C:/Users/Desarrollo%20TI/OneDrive%20-%20TASSOS%20S.A/Escritorio/Proyectos/DeskFlow/src/DeskFlow.Infrastructure/Services/BaseConocimientoService.cs)
- [KnowledgeListPage.tsx](C:/Users/Desarrollo%20TI/OneDrive%20-%20TASSOS%20S.A/Escritorio/Proyectos/DeskFlow/src/DeskFlow.Web/src/pages/KnowledgeListPage.tsx)
- [KnowledgeArticlePage.tsx](C:/Users/Desarrollo%20TI/OneDrive%20-%20TASSOS%20S.A/Escritorio/Proyectos/DeskFlow/src/DeskFlow.Web/src/pages/KnowledgeArticlePage.tsx)
- [KnowledgeEditorPage.tsx](C:/Users/Desarrollo%20TI/OneDrive%20-%20TASSOS%20S.A/Escritorio/Proyectos/DeskFlow/src/DeskFlow.Web/src/pages/KnowledgeEditorPage.tsx)

### Encuestas

Responsabilidades:

- Crear encuestas pendientes.
- Responder evaluaciones.
- Calcular promedios.
- Medir satisfaccion por tecnico y por periodo.

Archivos principales:

- [EncuestasController.cs](C:/Users/Desarrollo%20TI/OneDrive%20-%20TASSOS%20S.A/Escritorio/Proyectos/DeskFlow/src/DeskFlow.API/Controllers/EncuestasController.cs)
- [EncuestaService.cs](C:/Users/Desarrollo%20TI/OneDrive%20-%20TASSOS%20S.A/Escritorio/Proyectos/DeskFlow/src/DeskFlow.Infrastructure/Services/EncuestaService.cs)
- [SurveyPage.tsx](C:/Users/Desarrollo%20TI/OneDrive%20-%20TASSOS%20S.A/Escritorio/Proyectos/DeskFlow/src/DeskFlow.Web/src/pages/SurveyPage.tsx)

### Reportes

Responsabilidades:

- Exportar tickets a Excel.
- Exportar SLA a Excel.
- Exportar rendimiento tecnico.
- Generar PDF individual por ticket.

Archivos principales:

- [ReportesController.cs](C:/Users/Desarrollo%20TI/OneDrive%20-%20TASSOS%20S.A/Escritorio/Proyectos/DeskFlow/src/DeskFlow.API/Controllers/ReportesController.cs)
- [ReporteService.cs](C:/Users/Desarrollo%20TI/OneDrive%20-%20TASSOS%20S.A/Escritorio/Proyectos/DeskFlow/src/DeskFlow.Infrastructure/Services/ReporteService.cs)
- [ReportsPage.tsx](C:/Users/Desarrollo%20TI/OneDrive%20-%20TASSOS%20S.A/Escritorio/Proyectos/DeskFlow/src/DeskFlow.Web/src/pages/ReportsPage.tsx)

### Auditoria

Responsabilidades:

- Registrar acciones del sistema.
- Listar logs paginados.
- Filtrar por entidad.

Archivos principales:

- [AuditoriaController.cs](C:/Users/Desarrollo%20TI/OneDrive%20-%20TASSOS%20S.A/Escritorio/Proyectos/DeskFlow/src/DeskFlow.API/Controllers/AuditoriaController.cs)
- [AuditLogService.cs](C:/Users/Desarrollo%20TI/OneDrive%20-%20TASSOS%20S.A/Escritorio/Proyectos/DeskFlow/src/DeskFlow.Infrastructure/Services/AuditLogService.cs)
- [AuditLogPage.tsx](C:/Users/Desarrollo%20TI/OneDrive%20-%20TASSOS%20S.A/Escritorio/Proyectos/DeskFlow/src/DeskFlow.Web/src/pages/admin/AuditLogPage.tsx)

## Por Donde Empezar A Leer

Si quieres entender todo sin perderte, este orden funciona muy bien:

1. [Program.cs](C:/Users/Desarrollo%20TI/OneDrive%20-%20TASSOS%20S.A/Escritorio/Proyectos/DeskFlow/src/DeskFlow.API/Program.cs)
2. [App.tsx](C:/Users/Desarrollo%20TI/OneDrive%20-%20TASSOS%20S.A/Escritorio/Proyectos/DeskFlow/src/DeskFlow.Web/src/App.tsx)
3. [DeskFlowDbContext.cs](C:/Users/Desarrollo%20TI/OneDrive%20-%20TASSOS%20S.A/Escritorio/Proyectos/DeskFlow/src/DeskFlow.Infrastructure/Data/DeskFlowDbContext.cs)
4. [Ticket.cs](C:/Users/Desarrollo%20TI/OneDrive%20-%20TASSOS%20S.A/Escritorio/Proyectos/DeskFlow/src/DeskFlow.Core/Entities/Ticket.cs)
5. [TicketService.cs](C:/Users/Desarrollo%20TI/OneDrive%20-%20TASSOS%20S.A/Escritorio/Proyectos/DeskFlow/src/DeskFlow.Infrastructure/Services/TicketService.cs)
6. [TicketsController.cs](C:/Users/Desarrollo%20TI/OneDrive%20-%20TASSOS%20S.A/Escritorio/Proyectos/DeskFlow/src/DeskFlow.API/Controllers/TicketsController.cs)
7. [TicketsPage.tsx](C:/Users/Desarrollo%20TI/OneDrive%20-%20TASSOS%20S.A/Escritorio/Proyectos/DeskFlow/src/DeskFlow.Web/src/pages/TicketsPage.tsx)
8. [TicketDetailPage.tsx](C:/Users/Desarrollo%20TI/OneDrive%20-%20TASSOS%20S.A/Escritorio/Proyectos/DeskFlow/src/DeskFlow.Web/src/pages/TicketDetailPage.tsx)

Con eso entiendes el flujo principal del sistema.

## Si Quiero Cambiar X, Donde Voy

### Quiero cambiar login, JWT o sesion

Ve a:

- [AuthController.cs](C:/Users/Desarrollo%20TI/OneDrive%20-%20TASSOS%20S.A/Escritorio/Proyectos/DeskFlow/src/DeskFlow.API/Controllers/AuthController.cs)
- [AuthService.cs](C:/Users/Desarrollo%20TI/OneDrive%20-%20TASSOS%20S.A/Escritorio/Proyectos/DeskFlow/src/DeskFlow.Infrastructure/Services/AuthService.cs)
- [authStore.ts](C:/Users/Desarrollo%20TI/OneDrive%20-%20TASSOS%20S.A/Escritorio/Proyectos/DeskFlow/src/DeskFlow.Web/src/store/authStore.ts)
- [client.ts](C:/Users/Desarrollo%20TI/OneDrive%20-%20TASSOS%20S.A/Escritorio/Proyectos/DeskFlow/src/DeskFlow.Web/src/api/client.ts)

### Quiero cambiar creacion o detalle de tickets

Ve a:

- [TicketsController.cs](C:/Users/Desarrollo%20TI/OneDrive%20-%20TASSOS%20S.A/Escritorio/Proyectos/DeskFlow/src/DeskFlow.API/Controllers/TicketsController.cs)
- [TicketService.cs](C:/Users/Desarrollo%20TI/OneDrive%20-%20TASSOS%20S.A/Escritorio/Proyectos/DeskFlow/src/DeskFlow.Infrastructure/Services/TicketService.cs)
- [TicketRepository.cs](C:/Users/Desarrollo%20TI/OneDrive%20-%20TASSOS%20S.A/Escritorio/Proyectos/DeskFlow/src/DeskFlow.Infrastructure/Repositories/TicketRepository.cs)
- [NuevoTicketPage.tsx](C:/Users/Desarrollo%20TI/OneDrive%20-%20TASSOS%20S.A/Escritorio/Proyectos/DeskFlow/src/DeskFlow.Web/src/pages/NuevoTicketPage.tsx)
- [TicketDetailPage.tsx](C:/Users/Desarrollo%20TI/OneDrive%20-%20TASSOS%20S.A/Escritorio/Proyectos/DeskFlow/src/DeskFlow.Web/src/pages/TicketDetailPage.tsx)

### Quiero cambiar reglas de SLA

Ve a:

- [SLAService.cs](C:/Users/Desarrollo%20TI/OneDrive%20-%20TASSOS%20S.A/Escritorio/Proyectos/DeskFlow/src/DeskFlow.Infrastructure/Services/SLAService.cs)
- [SLAMonitorBackgroundService.cs](C:/Users/Desarrollo%20TI/OneDrive%20-%20TASSOS%20S.A/Escritorio/Proyectos/DeskFlow/src/DeskFlow.Infrastructure/BackgroundServices/SLAMonitorBackgroundService.cs)

### Quiero cambiar notificaciones

Ve a:

- [NotificacionService.cs](C:/Users/Desarrollo%20TI/OneDrive%20-%20TASSOS%20S.A/Escritorio/Proyectos/DeskFlow/src/DeskFlow.Infrastructure/Services/NotificacionService.cs)
- [NotificacionHub.cs](C:/Users/Desarrollo%20TI/OneDrive%20-%20TASSOS%20S.A/Escritorio/Proyectos/DeskFlow/src/DeskFlow.API/Hubs/NotificacionHub.cs)
- [SignalRNotificacionPushService.cs](C:/Users/Desarrollo%20TI/OneDrive%20-%20TASSOS%20S.A/Escritorio/Proyectos/DeskFlow/src/DeskFlow.API/Services/SignalRNotificacionPushService.cs)
- [useSignalR.ts](C:/Users/Desarrollo%20TI/OneDrive%20-%20TASSOS%20S.A/Escritorio/Proyectos/DeskFlow/src/DeskFlow.Web/src/hooks/useSignalR.ts)

### Quiero cambiar reportes

Ve a:

- [ReportesController.cs](C:/Users/Desarrollo%20TI/OneDrive%20-%20TASSOS%20S.A/Escritorio/Proyectos/DeskFlow/src/DeskFlow.API/Controllers/ReportesController.cs)
- [ReporteService.cs](C:/Users/Desarrollo%20TI/OneDrive%20-%20TASSOS%20S.A/Escritorio/Proyectos/DeskFlow/src/DeskFlow.Infrastructure/Services/ReporteService.cs)
- [ReportsPage.tsx](C:/Users/Desarrollo%20TI/OneDrive%20-%20TASSOS%20S.A/Escritorio/Proyectos/DeskFlow/src/DeskFlow.Web/src/pages/ReportsPage.tsx)

### Quiero cambiar base de conocimiento

Ve a:

- [ConocimientoController.cs](C:/Users/Desarrollo%20TI/OneDrive%20-%20TASSOS%20S.A/Escritorio/Proyectos/DeskFlow/src/DeskFlow.API/Controllers/ConocimientoController.cs)
- [BaseConocimientoService.cs](C:/Users/Desarrollo%20TI/OneDrive%20-%20TASSOS%20S.A/Escritorio/Proyectos/DeskFlow/src/DeskFlow.Infrastructure/Services/BaseConocimientoService.cs)
- [KnowledgeListPage.tsx](C:/Users/Desarrollo%20TI/OneDrive%20-%20TASSOS%20S.A/Escritorio/Proyectos/DeskFlow/src/DeskFlow.Web/src/pages/KnowledgeListPage.tsx)
- [KnowledgeEditorPage.tsx](C:/Users/Desarrollo%20TI/OneDrive%20-%20TASSOS%20S.A/Escritorio/Proyectos/DeskFlow/src/DeskFlow.Web/src/pages/KnowledgeEditorPage.tsx)

## Endpoints Importantes

Estos son algunos grupos importantes de endpoints:

- `/api/auth/*`
- `/api/tickets/*`
- `/api/dashboard/*`
- `/api/catalogos/*`
- `/api/notificaciones/*`
- `/api/conocimiento/*`
- `/api/encuestas/*`
- `/api/reportes/*`
- `/api/auditoria`

Hubs:

- `/hubs/tickets`
- `/hubs/notificaciones`

## Datos Demo Y Arranque

El sistema siembra datos demo al iniciar:

- tenant demo
- roles
- estados
- prioridades
- categorias
- usuario admin

Credenciales demo:

- `admin@demo.com`
- `Admin123!`

Esto se configura en:

- [DatabaseSeeder.cs](C:/Users/Desarrollo%20TI/OneDrive%20-%20TASSOS%20S.A/Escritorio/Proyectos/DeskFlow/src/DeskFlow.Infrastructure/Data/DatabaseSeeder.cs)
- [appsettings.json](C:/Users/Desarrollo%20TI/OneDrive%20-%20TASSOS%20S.A/Escritorio/Proyectos/DeskFlow/src/DeskFlow.API/appsettings.json)

## Estado Actual Del Proyecto

Lo que se ve bastante solido:

- Arquitectura por capas.
- Gestion de tickets.
- Reglas de SLA.
- Notificaciones en tiempo real.
- Dashboard.
- Reportes.
- Base de conocimiento.
- Encuestas.

Lo que hoy parece mas flojo o pendiente:

- Tests casi inexistentes.
- Documentacion previa muy escasa.
- Algunas pantallas admin del frontend no parecen tener todos sus endpoints backend completos.
- Hay varios textos con problemas de encoding.
- El frontend no esta incluido dentro de la solucion `.slnx`, aunque existe como proyecto real.

## Solucion Y Proyectos

La solucion actual incluye:

- [DeskFlow.slnx](C:/Users/Desarrollo%20TI/OneDrive%20-%20TASSOS%20S.A/Escritorio/Proyectos/DeskFlow/DeskFlow.slnx)
- [DeskFlow.API.csproj](C:/Users/Desarrollo%20TI/OneDrive%20-%20TASSOS%20S.A/Escritorio/Proyectos/DeskFlow/src/DeskFlow.API/DeskFlow.API.csproj)
- [DeskFlow.Core.csproj](C:/Users/Desarrollo%20TI/OneDrive%20-%20TASSOS%20S.A/Escritorio/Proyectos/DeskFlow/src/DeskFlow.Core/DeskFlow.Core.csproj)
- [DeskFlow.Infrastructure.csproj](C:/Users/Desarrollo%20TI/OneDrive%20-%20TASSOS%20S.A/Escritorio/Proyectos/DeskFlow/src/DeskFlow.Infrastructure/DeskFlow.Infrastructure.csproj)
- [DeskFlow.Tests.csproj](C:/Users/Desarrollo%20TI/OneDrive%20-%20TASSOS%20S.A/Escritorio/Proyectos/DeskFlow/tests/DeskFlow.Tests/DeskFlow.Tests.csproj)

## Recomendacion Practica De Uso

Cuando entres al proyecto, usa esta secuencia mental:

1. Mira `Program.cs` para ver como esta compuesto el backend.
2. Mira `App.tsx` para ver las pantallas reales.
3. Sigue un caso vertical, por ejemplo tickets.
4. Para ese caso, lee `Page -> api client -> controller -> service -> repository/dbcontext -> entity/dto`.
5. Repite lo mismo para el modulo que quieras tocar.

Si haces eso, DeskFlow deja de sentirse grande y empieza a verse como varios modulos claros conectados entre si.
