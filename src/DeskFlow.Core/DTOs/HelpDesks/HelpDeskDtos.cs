namespace DeskFlow.Core.DTOs.HelpDesks;

public record HelpDeskAgenteDto(
    Guid Id,
    Guid UsuarioId,
    string NombreCompleto,
    string Email,
    string Rol,
    bool EsResponsable,
    DateTime FechaAsignacion
);

public record HelpDeskListItemDto(
    Guid Id,
    string Nombre,
    string? Descripcion,
    string? Icono,
    string Color,
    bool Activo,
    bool EsPublico,
    int Orden,
    int CantidadAgentes,
    int TicketsAbiertos
);

public record HelpDeskDetalleDto(
    Guid Id,
    string Nombre,
    string? Descripcion,
    string? Icono,
    string Color,
    bool Activo,
    bool EsPublico,
    int Orden,
    DateTime FechaCreacion,
    List<HelpDeskAgenteDto> Agentes,
    int TicketsAbiertos,
    int TicketsHoy
);

public record CreateHelpDeskDto(
    string Nombre,
    string? Descripcion,
    string? Icono,
    string Color,
    bool EsPublico,
    int Orden
);

public record UpdateHelpDeskDto(
    string Nombre,
    string? Descripcion,
    string? Icono,
    string Color,
    bool Activo,
    bool EsPublico,
    int Orden
);

public record AsignarAgenteDto(
    Guid UsuarioId,
    bool EsResponsable
);

public record MiHelpDeskDto(
    Guid Id,
    string Nombre,
    string? Icono,
    string Color,
    bool EsResponsable
);
