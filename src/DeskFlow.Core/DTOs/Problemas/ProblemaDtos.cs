namespace DeskFlow.Core.DTOs.Problemas;

public record EstadoProblemaDto(Guid Id, string Nombre, string Color, int Orden, bool EsFinal);

public record ProblemaListItemDto(
    Guid Id,
    string Numero,
    string Titulo,
    string EstadoNombre,
    string EstadoColor,
    string PrioridadNombre,
    string PrioridadColor,
    string? CategoriaNombre,
    string? ResponsableNombre,
    string CreadorNombre,
    bool EsErrorConocido,
    int IncidentesCount,
    DateTime FechaCreacion,
    DateTime? FechaResolucion
);

public record IncidenteVinculadoDto(
    Guid Id,
    Guid TicketId,
    string TicketNumero,
    string TicketAsunto,
    string TicketEstado,
    string TicketEstadoColor,
    string? VinculadoPorNombre,
    DateTime FechaVinculacion
);

public record HistorialProblemaDto(
    Guid Id,
    string Accion,
    string? Detalle,
    string? UsuarioNombre,
    DateTime FechaAccion
);

public record ProblemaDetalleDto(
    Guid Id,
    string Numero,
    string Titulo,
    string Descripcion,
    Guid EstadoId,
    string EstadoNombre,
    string EstadoColor,
    bool EstadoEsFinal,
    Guid PrioridadId,
    string PrioridadNombre,
    string PrioridadColor,
    Guid? CategoriaId,
    string? CategoriaNombre,
    Guid? ResponsableId,
    string? ResponsableNombre,
    Guid UsuarioCreadorId,
    string CreadorNombre,
    string? CausaRaiz,
    string? Workaround,
    string? Solucion,
    bool EsErrorConocido,
    DateTime FechaCreacion,
    DateTime? FechaIdentificacion,
    DateTime? FechaResolucion,
    DateTime? FechaCierre,
    IEnumerable<IncidenteVinculadoDto> Incidentes,
    IEnumerable<HistorialProblemaDto> Historial
);

public record CreateProblemaDto(
    string Titulo,
    string Descripcion,
    Guid PrioridadId,
    Guid? CategoriaId,
    Guid? ResponsableId,
    Guid? TicketOrigenId
);

public record UpdateProblemaDto(
    string? Titulo,
    string? Descripcion,
    Guid? PrioridadId,
    Guid? CategoriaId,
    Guid? ResponsableId,
    Guid? EstadoId,
    string? CausaRaiz,
    string? Workaround,
    string? Solucion,
    bool? EsErrorConocido
);

public record VincularIncidenteDto(Guid TicketId);

public record ResolverProblemaDto(
    string Solucion,
    string? CausaRaiz,
    bool ActualizarIncidentesVinculados
);
