namespace DeskFlow.Core.DTOs.Permisos;

public static class ModulosClave
{
    public const string MiTrabajo      = "mi-trabajo";
    public const string Tickets        = "tickets";
    public const string ColaAsignacion = "cola-asignacion";
    public const string Aprobaciones   = "aprobaciones";
    public const string Problemas      = "problemas";
    public const string Cambios        = "cambios";
    public const string Workflows      = "workflows";
    public const string Esm            = "esm";
    public const string Catalogo       = "catalogo";
    public const string Conocimiento   = "conocimiento";
    public const string Encuestas      = "encuestas";
    public const string Dashboard      = "dashboard";
    public const string Ranking        = "ranking";
    public const string Reportes       = "reportes";
    public const string Gamificacion   = "gamificacion";
    public const string Admin          = "admin";

    public static readonly IReadOnlyList<(string Clave, string Nombre, string Grupo)> Todos =
    [
        (MiTrabajo,      "Mi Trabajo",            "Principal"),
        (Tickets,        "Tickets",               "Mesa de Ayuda"),
        (ColaAsignacion, "Cola de Asignación",    "Mesa de Ayuda"),
        (Aprobaciones,   "Aprobaciones",          "Mesa de Ayuda"),
        (Problemas,      "Problem Management",    "ITSM"),
        (Cambios,        "Change Management",     "ITSM"),
        (Workflows,      "Workflow Builder",      "ITSM"),
        (Esm,            "Portal ESM",            "Portales"),
        (Catalogo,       "Catálogo de Servicios", "Portales"),
        (Conocimiento,   "Base de Conocimiento",  "Conocimiento"),
        (Encuestas,      "Encuestas",             "Conocimiento"),
        (Dashboard,      "Dashboard",             "Analítica"),
        (Ranking,        "Ranking",               "Analítica"),
        (Reportes,       "Reportes",              "Analítica"),
        (Gamificacion,   "Gamificación",          "Analítica"),
        (Admin,          "Administración",        "Admin"),
    ];

    // Permisos por defecto según rol
    public static readonly IReadOnlyDictionary<string, IReadOnlyList<string>> DefaultPorRol =
        new Dictionary<string, IReadOnlyList<string>>
        {
            ["Administrador"] = Todos.Select(m => m.Clave).ToList(),
            ["Supervisor"]    = [MiTrabajo, Tickets, ColaAsignacion, Aprobaciones, Problemas, Cambios, Workflows, Esm, Catalogo, Conocimiento, Encuestas, Dashboard, Ranking, Reportes, Gamificacion, Admin],
            ["Agente"]        = [MiTrabajo, Tickets, ColaAsignacion, Esm, Catalogo, Conocimiento, Encuestas, Ranking, Gamificacion],
            ["Aprobador"]     = [Tickets, Aprobaciones, Cambios, Conocimiento],
            ["Observador"]    = [Tickets, Problemas, Cambios, Conocimiento, Dashboard, Ranking, Reportes],
            ["Usuario"]       = [Tickets, Catalogo, Esm, Conocimiento],
        };
}

public class ModuloInfoDto
{
    public string Clave { get; set; } = string.Empty;
    public string Nombre { get; set; } = string.Empty;
    public string Grupo { get; set; } = string.Empty;
    public bool Activo { get; set; }
}

public class RolPermisosDto
{
    public Guid RolId { get; set; }
    public string RolNombre { get; set; } = string.Empty;
    public List<ModuloInfoDto> Modulos { get; set; } = new();
}

public class ActualizarPermisosRolDto
{
    public List<string> ModulosActivos { get; set; } = new();
}
