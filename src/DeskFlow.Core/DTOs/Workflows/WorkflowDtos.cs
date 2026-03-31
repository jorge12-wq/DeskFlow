namespace DeskFlow.Core.DTOs.Workflows;

public record WorkflowNodoDto(
    Guid Id,
    string TipoNodo,
    string Nombre,
    float PosicionX,
    float PosicionY,
    string? ConfigJson
);

public record WorkflowConexionDto(
    Guid Id,
    Guid NodoOrigenId,
    Guid NodoDestinoId,
    string? Etiqueta,
    int Orden,
    string? OrigenLado,
    string? DestinoLado,
    float? MidOffsetX,
    float? MidOffsetY
);

public record WorkflowListItemDto(
    Guid Id,
    string Nombre,
    string? Descripcion,
    string Tipo,
    string? ServicioNombre,
    bool Activo,
    int CantidadNodos,
    DateTime FechaCreacion,
    string? CreadoPorNombre
);

public record WorkflowDetalleDto(
    Guid Id,
    string Nombre,
    string? Descripcion,
    string Tipo,
    Guid? ServicioId,
    string? ServicioNombre,
    bool Activo,
    DateTime FechaCreacion,
    DateTime? FechaActualizacion,
    string? CreadoPorNombre,
    List<WorkflowNodoDto> Nodos,
    List<WorkflowConexionDto> Conexiones
);

public record CreateWorkflowDto(
    string Nombre,
    string? Descripcion,
    string Tipo,
    Guid? ServicioId
);

public record SaveWorkflowDto(
    string Nombre,
    string? Descripcion,
    string Tipo,
    Guid? ServicioId,
    bool Activo,
    List<SaveNodoDto> Nodos,
    List<SaveConexionDto> Conexiones
);

public record SaveNodoDto(
    Guid Id,
    string TipoNodo,
    string Nombre,
    float PosicionX,
    float PosicionY,
    string? ConfigJson
);

public record SaveConexionDto(
    Guid Id,
    Guid NodoOrigenId,
    Guid NodoDestinoId,
    string? Etiqueta,
    int Orden,
    string? OrigenLado,
    string? DestinoLado,
    float? MidOffsetX,
    float? MidOffsetY
);
