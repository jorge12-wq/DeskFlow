namespace DeskFlow.Core.DTOs.Catalogo;

public class DepartamentoDto
{
    public Guid Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string? Descripcion { get; set; }
    public string? Icono { get; set; }
    public string? Color { get; set; }
    public int CantidadServicios { get; set; }
}

public class ServicioListItemDto
{
    public Guid Id { get; set; }
    public Guid DepartamentoId { get; set; }
    public string Departamento { get; set; } = string.Empty;
    public string? DepartamentoColor { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string? Descripcion { get; set; }
    public string? Icono { get; set; }
    public string? Color { get; set; }
    public int? TiempoEntregaHoras { get; set; }
    public bool RequiereAprobacion { get; set; }
    public bool EsPublico { get; set; }
}

public class CampoServicioDto
{
    public Guid Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string Etiqueta { get; set; } = string.Empty;
    public string TipoCampo { get; set; } = string.Empty;
    public string? Placeholder { get; set; }
    public bool Requerido { get; set; }
    public int Orden { get; set; }
    public List<string> Opciones { get; set; } = [];
}

public class PlantillaTareaDto
{
    public Guid Id { get; set; }
    public string Titulo { get; set; } = string.Empty;
    public string? Descripcion { get; set; }
    public int Orden { get; set; }
    public string? AsignarARol { get; set; }
}

public class ServicioDetalleDto : ServicioListItemDto
{
    public List<CampoServicioDto> Campos { get; set; } = [];
    public List<PlantillaTareaDto> Plantillas { get; set; } = [];
}

public class SolicitarServicioDto
{
    public Dictionary<string, string> Respuestas { get; set; } = new();
}

public class RespuestaFormularioDto
{
    public Guid CampoId { get; set; }
    public string Etiqueta { get; set; } = string.Empty;
    public string TipoCampo { get; set; } = string.Empty;
    public string? Valor { get; set; }
}

public class TareaDto
{
    public Guid Id { get; set; }
    public string Titulo { get; set; } = string.Empty;
    public string? Descripcion { get; set; }
    public string? AsignadoA { get; set; }
    public Guid? AsignadoAId { get; set; }
    public bool Completada { get; set; }
    public DateTime? FechaCompletada { get; set; }
    public DateTime? FechaVencimiento { get; set; }
    public DateTime FechaCreacion { get; set; }
}
