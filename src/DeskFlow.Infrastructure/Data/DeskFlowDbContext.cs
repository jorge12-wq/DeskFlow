using DeskFlow.Core.Entities;
using DeskFlow.Core.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace DeskFlow.Infrastructure.Data;

public class DeskFlowDbContext : DbContext
{
    private readonly ITenantContext? _tenantContext;

    public DeskFlowDbContext(DbContextOptions<DeskFlowDbContext> options, ITenantContext? tenantContext = null)
        : base(options)
    {
        _tenantContext = tenantContext;
    }

    public DbSet<Tenant> Tenants => Set<Tenant>();
    public DbSet<Rol> Roles => Set<Rol>();
    public DbSet<Usuario> Usuarios => Set<Usuario>();
    public DbSet<Sucursal> Sucursales => Set<Sucursal>();
    public DbSet<Area> Areas => Set<Area>();
    public DbSet<Categoria> Categorias => Set<Categoria>();
    public DbSet<Subcategoria> Subcategorias => Set<Subcategoria>();
    public DbSet<Prioridad> Prioridades => Set<Prioridad>();
    public DbSet<EstadoTicket> EstadosTicket => Set<EstadoTicket>();
    public DbSet<Ticket> Tickets => Set<Ticket>();
    public DbSet<ComentarioTicket> ComentariosTicket => Set<ComentarioTicket>();
    public DbSet<AdjuntoTicket> AdjuntosTicket => Set<AdjuntoTicket>();
    public DbSet<HistorialTicket> HistorialTickets => Set<HistorialTicket>();
    public DbSet<SLAConfiguracion> SLAConfiguraciones => Set<SLAConfiguracion>();
    public DbSet<Notificacion> Notificaciones => Set<Notificacion>();
    public DbSet<TecnicoCategoria> TecnicoCategorias => Set<TecnicoCategoria>();
    public DbSet<Plantilla> Plantillas => Set<Plantilla>();
    public DbSet<BaseConocimiento> BaseConocimiento => Set<BaseConocimiento>();
    public DbSet<ArticuloRelacionado> ArticulosRelacionados => Set<ArticuloRelacionado>();
    public DbSet<EncuestaConfiguracion> EncuestaConfiguraciones => Set<EncuestaConfiguracion>();
    public DbSet<EncuestaRespuesta> EncuestaRespuestas => Set<EncuestaRespuesta>();
    public DbSet<Etiqueta> Etiquetas => Set<Etiqueta>();
    public DbSet<TicketEtiqueta> TicketEtiquetas => Set<TicketEtiqueta>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
    public DbSet<AprobacionTicket> AprobacionesTicket => Set<AprobacionTicket>();
    public DbSet<Departamento> Departamentos => Set<Departamento>();
    public DbSet<ServicioCatalogo> ServiciosCatalogo => Set<ServicioCatalogo>();
    public DbSet<CampoServicio> CamposServicio => Set<CampoServicio>();
    public DbSet<PlantillaTarea> PlantillasTareas => Set<PlantillaTarea>();
    public DbSet<RespuestaFormulario> RespuestasFormulario => Set<RespuestaFormulario>();
    public DbSet<Tarea> Tareas => Set<Tarea>();
    public DbSet<EstadoProblema> EstadosProblema => Set<EstadoProblema>();
    public DbSet<Problema> Problemas => Set<Problema>();
    public DbSet<ProblemaIncidente> ProblemaIncidentes => Set<ProblemaIncidente>();
    public DbSet<HistorialProblema> HistorialProblemas => Set<HistorialProblema>();
    public DbSet<TipoCambio> TiposCambio => Set<TipoCambio>();
    public DbSet<EstadoCambio> EstadosCambio => Set<EstadoCambio>();
    public DbSet<Cambio> Cambios => Set<Cambio>();
    public DbSet<AprobadorCAB> AprobadoresCAB => Set<AprobadorCAB>();
    public DbSet<HistorialCambio> HistorialCambios => Set<HistorialCambio>();
    public DbSet<CambioProblema> CambioProblemas => Set<CambioProblema>();
    public DbSet<HelpDesk> HelpDesks => Set<HelpDesk>();
    public DbSet<HelpDeskAgente> HelpDeskAgentes => Set<HelpDeskAgente>();
    public DbSet<Workflow> Workflows => Set<Workflow>();
    public DbSet<WorkflowNodo> WorkflowNodos => Set<WorkflowNodo>();
    public DbSet<WorkflowConexion> WorkflowConexiones => Set<WorkflowConexion>();
    public DbSet<Logro> Logros => Set<Logro>();
    public DbSet<LogroAgente> LogrosAgente => Set<LogroAgente>();
    public DbSet<DashboardPersonalizado> DashboardsPersonalizados => Set<DashboardPersonalizado>();
    public DbSet<ReporteCompartido> ReportesCompartidos => Set<ReporteCompartido>();
    public DbSet<ConfiguracionHorario> ConfiguracionesHorario => Set<ConfiguracionHorario>();
    public DbSet<MotivoEspera> MotivosEspera => Set<MotivoEspera>();
    public DbSet<ConocimientoAdjunto> ConocimientoAdjuntos => Set<ConocimientoAdjunto>();
    public DbSet<PermisoModulo> PermisosModulo => Set<PermisoModulo>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Apply all configurations from this assembly
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(DeskFlowDbContext).Assembly);

        // Global Query Filters for multi-tenancy
        // Reference _tenantContext directly (not a captured local variable) so EF Core
        // evaluates TenantId per DbContext instance at query time, not once at model build time.
        modelBuilder.Entity<Rol>().HasQueryFilter(e => _tenantContext == null || e.TenantId == _tenantContext.TenantId);
        modelBuilder.Entity<Usuario>().HasQueryFilter(e => _tenantContext == null || e.TenantId == _tenantContext.TenantId);
        modelBuilder.Entity<Sucursal>().HasQueryFilter(e => _tenantContext == null || e.TenantId == _tenantContext.TenantId);
        modelBuilder.Entity<Area>().HasQueryFilter(e => _tenantContext == null || e.TenantId == _tenantContext.TenantId);
        modelBuilder.Entity<Categoria>().HasQueryFilter(e => _tenantContext == null || e.TenantId == _tenantContext.TenantId);
        modelBuilder.Entity<Subcategoria>().HasQueryFilter(e => _tenantContext == null || e.TenantId == _tenantContext.TenantId);
        modelBuilder.Entity<Prioridad>().HasQueryFilter(e => _tenantContext == null || e.TenantId == _tenantContext.TenantId);
        modelBuilder.Entity<Ticket>().HasQueryFilter(e => _tenantContext == null || e.TenantId == _tenantContext.TenantId);
        modelBuilder.Entity<SLAConfiguracion>().HasQueryFilter(e => _tenantContext == null || e.TenantId == _tenantContext.TenantId);
        modelBuilder.Entity<Notificacion>().HasQueryFilter(e => _tenantContext == null || e.TenantId == _tenantContext.TenantId);
        modelBuilder.Entity<TecnicoCategoria>().HasQueryFilter(e => _tenantContext == null || e.TenantId == _tenantContext.TenantId);
        modelBuilder.Entity<Plantilla>().HasQueryFilter(e => _tenantContext == null || e.TenantId == _tenantContext.TenantId);
        modelBuilder.Entity<BaseConocimiento>().HasQueryFilter(e => _tenantContext == null || e.TenantId == _tenantContext.TenantId);
        modelBuilder.Entity<EncuestaConfiguracion>().HasQueryFilter(e => _tenantContext == null || e.TenantId == _tenantContext.TenantId);
        modelBuilder.Entity<EncuestaRespuesta>().HasQueryFilter(e => _tenantContext == null || e.TenantId == _tenantContext.TenantId);
        modelBuilder.Entity<Etiqueta>().HasQueryFilter(e => _tenantContext == null || e.TenantId == _tenantContext.TenantId);
        modelBuilder.Entity<AuditLog>().HasQueryFilter(e => _tenantContext == null || e.TenantId == _tenantContext.TenantId);
        modelBuilder.Entity<AprobacionTicket>().HasQueryFilter(e => _tenantContext == null || e.TenantId == _tenantContext.TenantId);
        modelBuilder.Entity<Departamento>().HasQueryFilter(e => _tenantContext == null || e.TenantId == _tenantContext.TenantId);
        modelBuilder.Entity<ServicioCatalogo>().HasQueryFilter(e => _tenantContext == null || e.TenantId == _tenantContext.TenantId);
        modelBuilder.Entity<CampoServicio>().HasQueryFilter(e => _tenantContext == null || e.TenantId == _tenantContext.TenantId);
        modelBuilder.Entity<PlantillaTarea>().HasQueryFilter(e => _tenantContext == null || e.TenantId == _tenantContext.TenantId);
        modelBuilder.Entity<RespuestaFormulario>().HasQueryFilter(e => _tenantContext == null || e.TenantId == _tenantContext.TenantId);
        modelBuilder.Entity<Tarea>().HasQueryFilter(e => _tenantContext == null || e.TenantId == _tenantContext.TenantId);
        modelBuilder.Entity<Problema>().HasQueryFilter(e => _tenantContext == null || e.TenantId == _tenantContext.TenantId);
        modelBuilder.Entity<ProblemaIncidente>().HasQueryFilter(e => _tenantContext == null || e.TenantId == _tenantContext.TenantId);
        modelBuilder.Entity<HistorialProblema>().HasQueryFilter(e => _tenantContext == null || e.TenantId == _tenantContext.TenantId);
        modelBuilder.Entity<Cambio>().HasQueryFilter(e => _tenantContext == null || e.TenantId == _tenantContext.TenantId);
        modelBuilder.Entity<AprobadorCAB>().HasQueryFilter(e => _tenantContext == null || e.TenantId == _tenantContext.TenantId);
        modelBuilder.Entity<HistorialCambio>().HasQueryFilter(e => _tenantContext == null || e.TenantId == _tenantContext.TenantId);
        modelBuilder.Entity<CambioProblema>().HasQueryFilter(e => _tenantContext == null || e.TenantId == _tenantContext.TenantId);
        modelBuilder.Entity<Workflow>().HasQueryFilter(e => _tenantContext == null || e.TenantId == _tenantContext.TenantId);
        modelBuilder.Entity<HelpDesk>().HasQueryFilter(e => _tenantContext == null || e.TenantId == _tenantContext.TenantId);
        modelBuilder.Entity<HelpDeskAgente>().HasQueryFilter(e => _tenantContext == null || e.TenantId == _tenantContext.TenantId);
        modelBuilder.Entity<LogroAgente>().HasQueryFilter(e => _tenantContext == null || e.TenantId == _tenantContext.TenantId);
        modelBuilder.Entity<DashboardPersonalizado>().HasQueryFilter(e => _tenantContext == null || e.TenantId == _tenantContext.TenantId);
        modelBuilder.Entity<ReporteCompartido>().HasQueryFilter(e => _tenantContext == null || e.TenantId == _tenantContext.TenantId);
        modelBuilder.Entity<ConfiguracionHorario>().HasQueryFilter(e => _tenantContext == null || e.TenantId == _tenantContext.TenantId);
        modelBuilder.Entity<MotivoEspera>().HasQueryFilter(e => _tenantContext == null || e.TenantId == _tenantContext.TenantId);
        modelBuilder.Entity<ConocimientoAdjunto>().HasQueryFilter(e => _tenantContext == null || e.TenantId == _tenantContext.TenantId);
        modelBuilder.Entity<PermisoModulo>().HasQueryFilter(e => _tenantContext == null || e.TenantId == _tenantContext.TenantId);
        // WorkflowNodo and WorkflowConexion are filtered via Workflow cascade — no TenantId column
        // Logro is global (no TenantId)
    }
}
