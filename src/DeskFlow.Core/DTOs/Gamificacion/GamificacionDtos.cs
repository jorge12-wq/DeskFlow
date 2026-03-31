namespace DeskFlow.Core.DTOs.Gamificacion;

public record LogroDto(
    Guid Id,
    string Clave,
    string Nombre,
    string Descripcion,
    string Icono,
    string Criterio,
    int PuntosRecompensa,
    bool Obtenido,
    DateTime? FechaObtenido
);

public record RankingItemDto(
    int Posicion,
    Guid UsuarioId,
    string NombreCompleto,
    string Rol,
    int TicketsResueltos,
    int TicketsEnSLA,
    double PorcentajeSLA,
    double? PromedioCsat,
    int TiempoPromedioHoras,
    int Puntos,
    List<LogroResumenDto> Logros
);

public record LogroResumenDto(string Icono, string Nombre);

public record PerfilGamificacionDto(
    Guid UsuarioId,
    string NombreCompleto,
    int Posicion,
    int Puntos,
    int TicketsResueltos,
    double PorcentajeSLA,
    double? PromedioCsat,
    List<LogroDto> Logros
);

public record WidgetConfigDto(
    string Id,
    string Tipo,
    string Titulo,
    bool Visible,
    int Orden
);

public record ReporteCompartidoDto(
    Guid Id,
    string Token,
    string Titulo,
    string Url,
    DateTime FechaCreacion,
    DateTime? FechaExpiracion
);

public record CrearReporteCompartidoDto(
    string Titulo,
    string ConfigJson,
    string DatosJson,
    int? DiasExpiracion
);
