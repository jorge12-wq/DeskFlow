using DeskFlow.Core.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace DeskFlow.Infrastructure.Data;

public class DatabaseSeeder
{
    private readonly DeskFlowDbContext _context;
    private readonly ILogger<DatabaseSeeder> _logger;

    // IDs fijos para seed
    public static readonly Guid TenantDemoId      = Guid.Parse("10000000-0000-0000-0000-000000000001");
    public static readonly Guid RolAdminId        = Guid.Parse("20000000-0000-0000-0000-000000000001");
    public static readonly Guid RolSupervisorId   = Guid.Parse("20000000-0000-0000-0000-000000000002");
    public static readonly Guid RolAgenteId       = Guid.Parse("20000000-0000-0000-0000-000000000003");
    public static readonly Guid RolUsuarioId      = Guid.Parse("20000000-0000-0000-0000-000000000004");
    public static readonly Guid RolAprobadorId    = Guid.Parse("20000000-0000-0000-0000-000000000005");
    public static readonly Guid RolObservadorId   = Guid.Parse("20000000-0000-0000-0000-000000000006");

    // Mantener alias para compatibilidad con código existente
    public static readonly Guid RolTecnicoId = RolAgenteId;

    public static readonly Guid EstadoNuevoId               = Guid.Parse("30000000-0000-0000-0000-000000000001");
    public static readonly Guid EstadoAsignadoId            = Guid.Parse("30000000-0000-0000-0000-000000000002");
    public static readonly Guid EstadoEnProcesoId           = Guid.Parse("30000000-0000-0000-0000-000000000003");
    public static readonly Guid EstadoPendienteUsuarioId    = Guid.Parse("30000000-0000-0000-0000-000000000004");
    public static readonly Guid EstadoPendienteProveedorId  = Guid.Parse("30000000-0000-0000-0000-000000000005");
    public static readonly Guid EstadoResueltoId            = Guid.Parse("30000000-0000-0000-0000-000000000006");
    public static readonly Guid EstadoCerradoId             = Guid.Parse("30000000-0000-0000-0000-000000000007");
    public static readonly Guid EstadoCanceladoId           = Guid.Parse("30000000-0000-0000-0000-000000000008");

    public static readonly Guid PrioridadCriticaId = Guid.Parse("40000000-0000-0000-0000-000000000001");
    public static readonly Guid PrioridadAltaId    = Guid.Parse("40000000-0000-0000-0000-000000000002");
    public static readonly Guid PrioridadMediaId   = Guid.Parse("40000000-0000-0000-0000-000000000003");
    public static readonly Guid PrioridadBajaId    = Guid.Parse("40000000-0000-0000-0000-000000000004");

    public static readonly Guid AdminUserId       = Guid.Parse("50000000-0000-0000-0000-000000000001");
    public static readonly Guid SupervisorUserId  = Guid.Parse("50000000-0000-0000-0000-000000000002");
    public static readonly Guid Agente1UserId     = Guid.Parse("50000000-0000-0000-0000-000000000003");
    public static readonly Guid Agente2UserId     = Guid.Parse("50000000-0000-0000-0000-000000000004");
    public static readonly Guid UsuarioUserId     = Guid.Parse("50000000-0000-0000-0000-000000000005");
    public static readonly Guid AprobadorUserId   = Guid.Parse("50000000-0000-0000-0000-000000000006");
    public static readonly Guid ObservadorUserId  = Guid.Parse("50000000-0000-0000-0000-000000000007");

    public DatabaseSeeder(DeskFlowDbContext context, ILogger<DatabaseSeeder> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task SeedAsync()
    {
        try
        {
            await SeedEstadosTicketAsync();
            await SeedTenantDemoAsync();
            await SeedRolesAsync();
            await SeedPrioridadesAsync();
            await SeedUsersAsync();
            await SeedCategoriasAsync();

            await _context.SaveChangesAsync();
            _logger.LogInformation("Seed completado exitosamente.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error durante el seed de datos.");
            throw;
        }
    }

    private async Task SeedEstadosTicketAsync()
    {
        if (await _context.EstadosTicket.AnyAsync()) return;

        var estados = new List<EstadoTicket>
        {
            new() { Id = EstadoNuevoId,              Nombre = "Nuevo",                  Color = "#6B7280", EsFinal = false, Orden = 1 },
            new() { Id = EstadoAsignadoId,           Nombre = "Asignado",               Color = "#3B82F6", EsFinal = false, Orden = 2 },
            new() { Id = EstadoEnProcesoId,          Nombre = "En Proceso",             Color = "#F59E0B", EsFinal = false, Orden = 3 },
            new() { Id = EstadoPendienteUsuarioId,   Nombre = "Pendiente de Usuario",   Color = "#8B5CF6", EsFinal = false, Orden = 4 },
            new() { Id = EstadoPendienteProveedorId, Nombre = "Pendiente de Proveedor", Color = "#EC4899", EsFinal = false, Orden = 5 },
            new() { Id = EstadoResueltoId,           Nombre = "Resuelto",               Color = "#10B981", EsFinal = false, Orden = 6 },
            new() { Id = EstadoCerradoId,            Nombre = "Cerrado",                Color = "#1F2937", EsFinal = true,  Orden = 7 },
            new() { Id = EstadoCanceladoId,          Nombre = "Cancelado",              Color = "#EF4444", EsFinal = true,  Orden = 8 },
        };

        await _context.EstadosTicket.AddRangeAsync(estados);
        _logger.LogInformation("Estados de ticket sembrados.");
    }

    private async Task SeedTenantDemoAsync()
    {
        if (await _context.Tenants.AnyAsync(t => t.Id == TenantDemoId)) return;

        var tenant = new Tenant
        {
            Id = TenantDemoId,
            Nombre = "Empresa Demo",
            Dominio = "demo.deskflow.com",
            ColorPrimario = "#3B82F6",
            Activo = true,
            FechaCreacion = DateTime.UtcNow
        };

        await _context.Tenants.AddAsync(tenant);
        _logger.LogInformation("Tenant demo sembrado.");
    }

    private async Task SeedRolesAsync()
    {
        var rolesExistentes = await _context.Roles.IgnoreQueryFilters()
            .Where(r => r.TenantId == TenantDemoId)
            .Select(r => r.Id)
            .ToListAsync();

        var roles = new List<Rol>
        {
            new() { Id = RolAdminId,      TenantId = TenantDemoId, Nombre = "Administrador", Descripcion = "Control total del sistema — usuarios, configuración, auditoría" },
            new() { Id = RolSupervisorId, TenantId = TenantDemoId, Nombre = "Supervisor",    Descripcion = "Gestión operativa — SLA, reportes, helpdesks, asignación de tickets" },
            new() { Id = RolAgenteId,     TenantId = TenantDemoId, Nombre = "Agente",        Descripcion = "Atiende y resuelve tickets de soporte" },
            new() { Id = RolUsuarioId,    TenantId = TenantDemoId, Nombre = "Usuario",       Descripcion = "Usuario final — crea solicitudes y sigue sus tickets" },
            new() { Id = RolAprobadorId,  TenantId = TenantDemoId, Nombre = "Aprobador",     Descripcion = "Aprueba RFC, solicitudes de servicio y cambios críticos" },
            new() { Id = RolObservadorId, TenantId = TenantDemoId, Nombre = "Observador",    Descripcion = "Acceso de solo lectura — gerentes y stakeholders externos" },
        };

        foreach (var rol in roles)
        {
            if (!rolesExistentes.Contains(rol.Id))
                await _context.Roles.AddAsync(rol);
        }

        _logger.LogInformation("Roles sembrados.");
    }

    private async Task SeedPrioridadesAsync()
    {
        if (await _context.Prioridades.IgnoreQueryFilters().AnyAsync(p => p.TenantId == TenantDemoId)) return;

        var prioridades = new List<Prioridad>
        {
            new() { Id = PrioridadCriticaId, TenantId = TenantDemoId, Nombre = "Crítica", Color = "#EF4444", TiempoRespuestaSLA_Horas = 1,  TiempoResolucionSLA_Horas = 4,  Orden = 1 },
            new() { Id = PrioridadAltaId,    TenantId = TenantDemoId, Nombre = "Alta",    Color = "#F97316", TiempoRespuestaSLA_Horas = 4,  TiempoResolucionSLA_Horas = 8,  Orden = 2 },
            new() { Id = PrioridadMediaId,   TenantId = TenantDemoId, Nombre = "Media",   Color = "#F59E0B", TiempoRespuestaSLA_Horas = 8,  TiempoResolucionSLA_Horas = 24, Orden = 3 },
            new() { Id = PrioridadBajaId,    TenantId = TenantDemoId, Nombre = "Baja",    Color = "#10B981", TiempoRespuestaSLA_Horas = 24, TiempoResolucionSLA_Horas = 72, Orden = 4 },
        };

        await _context.Prioridades.AddRangeAsync(prioridades);
        _logger.LogInformation("Prioridades sembradas.");
    }

    private async Task SeedUsersAsync()
    {
        // Demo users definition: (Id, RolId, Nombre, Apellido, Email)
        var demoUsers = new[]
        {
            (AdminUserId,      RolAdminId,      "Admin",    "DeskFlow",   "admin@demo.com"),
            (SupervisorUserId, RolSupervisorId, "María",    "González",   "supervisor@demo.com"),
            (Agente1UserId,    RolAgenteId,     "Carlos",   "Martínez",   "agente1@demo.com"),
            (Agente2UserId,    RolAgenteId,     "Ana",      "López",      "agente2@demo.com"),
            (UsuarioUserId,    RolUsuarioId,    "Juan",     "Pérez",      "usuario@demo.com"),
            (AprobadorUserId,  RolAprobadorId,  "Roberto",  "Sánchez",    "aprobador@demo.com"),
            (ObservadorUserId, RolObservadorId, "Laura",    "Rodríguez",  "observador@demo.com"),
        };

        foreach (var (id, rolId, nombre, apellido, email) in demoUsers)
        {
            var existing = await _context.Usuarios.IgnoreQueryFilters()
                .FirstOrDefaultAsync(u => u.Id == id);

            if (existing != null)
            {
                // Siempre actualizar hash de usuarios demo para garantizar contraseña conocida
                existing.PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin123!");
                existing.RolId        = rolId;
                existing.Activo       = true;
                continue;
            }

            await _context.Usuarios.AddAsync(new Usuario
            {
                Id            = id,
                TenantId      = TenantDemoId,
                RolId         = rolId,
                Nombre        = nombre,
                Apellido      = apellido,
                Email         = email,
                PasswordHash  = BCrypt.Net.BCrypt.HashPassword("Admin123!"),
                Activo        = true,
                FechaCreacion = DateTime.UtcNow
            });

            _logger.LogInformation("Usuario demo sembrado: {Email}", email);
        }
    }

    private async Task SeedCategoriasAsync()
    {
        if (await _context.Categorias.IgnoreQueryFilters().AnyAsync(c => c.TenantId == TenantDemoId)) return;

        var catHardwareId = Guid.NewGuid();
        var catSoftwareId = Guid.NewGuid();
        var catRedId      = Guid.NewGuid();

        var categorias = new List<Categoria>
        {
            new() { Id = catHardwareId, TenantId = TenantDemoId, Nombre = "Hardware",          Descripcion = "Equipos, impresoras, periféricos",     Icono = "cpu",     Activo = true },
            new() { Id = catSoftwareId, TenantId = TenantDemoId, Nombre = "Software",          Descripcion = "Aplicaciones y sistemas operativos",   Icono = "monitor", Activo = true },
            new() { Id = catRedId,      TenantId = TenantDemoId, Nombre = "Red y Conectividad", Descripcion = "Internet, VPN, switches",              Icono = "wifi",    Activo = true },
        };

        var subcategorias = new List<Subcategoria>
        {
            new() { TenantId = TenantDemoId, CategoriaId = catHardwareId, Nombre = "PC de escritorio",       Activo = true },
            new() { TenantId = TenantDemoId, CategoriaId = catHardwareId, Nombre = "Notebook/Laptop",        Activo = true },
            new() { TenantId = TenantDemoId, CategoriaId = catHardwareId, Nombre = "Impresora",              Activo = true },
            new() { TenantId = TenantDemoId, CategoriaId = catSoftwareId, Nombre = "Sistema Operativo",      Activo = true },
            new() { TenantId = TenantDemoId, CategoriaId = catSoftwareId, Nombre = "Office / Productividad", Activo = true },
            new() { TenantId = TenantDemoId, CategoriaId = catSoftwareId, Nombre = "Antivirus / Seguridad",  Activo = true },
            new() { TenantId = TenantDemoId, CategoriaId = catRedId,      Nombre = "Sin acceso a internet",  Activo = true },
            new() { TenantId = TenantDemoId, CategoriaId = catRedId,      Nombre = "VPN",                    Activo = true },
        };

        await _context.Categorias.AddRangeAsync(categorias);
        await _context.Subcategorias.AddRangeAsync(subcategorias);
        _logger.LogInformation("Categorías y subcategorías sembradas.");
    }
}
