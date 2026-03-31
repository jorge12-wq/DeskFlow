using DeskFlow.Core.Interfaces;
using DeskFlow.Core.Interfaces.Repositories;
using DeskFlow.Infrastructure.BackgroundServices;
using DeskFlow.Infrastructure.Data;
using DeskFlow.Infrastructure.Repositories;
using DeskFlow.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace DeskFlow.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.AddDbContext<DeskFlowDbContext>((sp, options) =>
        {
            options.UseNpgsql(
                configuration.GetConnectionString("DefaultConnection"),
                npgsql => npgsql.MigrationsAssembly(typeof(DeskFlowDbContext).Assembly.FullName));
        });

        // Repositories
        services.AddScoped<ITicketRepository, TicketRepository>();

        // Services
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<ITicketService, TicketService>();
        services.AddScoped<IDashboardService, DashboardService>();
        services.AddScoped<ISLAService, SLAService>();
        services.AddScoped<INotificacionService, NotificacionService>();
        services.AddScoped<IEmailService, EmailService>();
        services.AddScoped<IFileStorageService, LocalFileStorageService>();
        services.AddScoped<IAsignacionService, AsignacionService>();
        services.AddScoped<IBaseConocimientoService, BaseConocimientoService>();
        services.AddScoped<IEncuestaService, EncuestaService>();
        services.AddScoped<IEtiquetaService, EtiquetaService>();
        services.AddScoped<IReporteService, ReporteService>();
        services.AddScoped<IAuditLogService, AuditLogService>();
        services.AddScoped<IAprobacionService, AprobacionService>();
        services.AddScoped<ICatalogoService, CatalogoService>();
        services.AddScoped<IProblemaService, ProblemaService>();
        services.AddScoped<ICambioService, CambioService>();
        services.AddScoped<IWorkflowService, WorkflowService>();
        services.AddScoped<IHelpDeskService, HelpDeskService>();
        services.AddScoped<IGamificacionService, GamificacionService>();
        services.AddScoped<IPermisosModuloService, PermisosModuloService>();

        // Background services
        services.AddHostedService<SLAMonitorBackgroundService>();

        // Seeder
        services.AddScoped<DatabaseSeeder>();

        return services;
    }
}
