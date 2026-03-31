namespace DeskFlow.Core.DTOs.Cambios;

public record TipoCambioDto(Guid Id, string Nombre, string? Descripcion, string Color);
public record EstadoCambioDto(Guid Id, string Nombre, string Color, int Orden, bool EsFinal);

public record AprobadorCABDto(
    Guid Id,
    Guid AprobadorId,
    string AprobadorNombre,
    int Estado,
    string EstadoNombre,
    string? Comentario,
    DateTime? FechaDecision
);

public record HistorialCambioDto(
    Guid Id,
    string Accion,
    string? Detalle,
    string? UsuarioNombre,
    DateTime FechaAccion
);

public record CambioListItemDto(
    Guid Id,
    string Numero,
    string Titulo,
    string TipoNombre,
    string TipoColor,
    string EstadoNombre,
    string EstadoColor,
    bool EstadoEsFinal,
    string PrioridadNombre,
    string PrioridadColor,
    string Riesgo,
    string Impacto,
    string SolicitanteNombre,
    string? ImplementadorNombre,
    int AprobadoresPendientes,
    DateTime FechaCreacion,
    DateTime? FechaInicioPlaneado,
    DateTime? FechaFinPlaneado
);

public record CambioDetalleDto(
    Guid Id,
    string Numero,
    string Titulo,
    string Descripcion,
    Guid TipoCambioId,
    string TipoNombre,
    string TipoColor,
    Guid EstadoId,
    string EstadoNombre,
    string EstadoColor,
    bool EstadoEsFinal,
    Guid PrioridadId,
    string PrioridadNombre,
    string PrioridadColor,
    Guid? CategoriaId,
    string? CategoriaNombre,
    Guid SolicitanteId,
    string SolicitanteNombre,
    Guid? ImplementadorId,
    string? ImplementadorNombre,
    string Riesgo,
    string Impacto,
    string Urgencia,
    string? DescripcionImpacto,
    string? PlanImplementacion,
    string? PlanPruebas,
    string? PlanBackout,
    string? ResultadoPostImpl,
    DateTime FechaCreacion,
    DateTime? FechaInicioPlaneado,
    DateTime? FechaFinPlaneado,
    DateTime? FechaInicioReal,
    DateTime? FechaFinReal,
    DateTime? FechaCierre,
    IEnumerable<AprobadorCABDto> AprobadoresCAB,
    IEnumerable<HistorialCambioDto> Historial
);

public record CreateCambioDto(
    string Titulo,
    string Descripcion,
    Guid TipoCambioId,
    Guid PrioridadId,
    Guid? CategoriaId,
    Guid? ImplementadorId,
    string Riesgo,
    string Impacto,
    string Urgencia,
    string? DescripcionImpacto,
    string? PlanImplementacion,
    string? PlanPruebas,
    string? PlanBackout,
    DateTime? FechaInicioPlaneado,
    DateTime? FechaFinPlaneado
);

public record UpdateCambioDto(
    string? Titulo,
    string? Descripcion,
    Guid? TipoCambioId,
    Guid? PrioridadId,
    Guid? CategoriaId,
    Guid? ImplementadorId,
    string? Riesgo,
    string? Impacto,
    string? Urgencia,
    string? DescripcionImpacto,
    string? PlanImplementacion,
    string? PlanPruebas,
    string? PlanBackout,
    DateTime? FechaInicioPlaneado,
    DateTime? FechaFinPlaneado
);

public record EnviarCABDto(IEnumerable<Guid>? AprobadoresIds);

public record VotarCABDto(bool Aprobado, string? Comentario);

public record IniciarImplementacionDto(string? Comentario);

public record CompletarImplementacionDto(string ResultadoPostImpl);

public record CambioCalendarioItemDto(
    Guid Id,
    string Numero,
    string Titulo,
    string TipoNombre,
    string TipoColor,
    string EstadoNombre,
    string EstadoColor,
    string Riesgo,
    string? ImplementadorNombre,
    DateTime? FechaInicioPlaneado,
    DateTime? FechaFinPlaneado
);
