namespace DeskFlow.Core.DTOs.Dashboard;

public class DashboardResumenDto
{
    public int TotalTickets { get; set; }
    public int TicketsAbiertos { get; set; }
    public int TicketsEnProceso { get; set; }
    public int TicketsResueltos { get; set; }
    public int TicketsCerrados { get; set; }
    public int TicketsVencidosSLA { get; set; }
    public int TicketsEnRiesgoSLA { get; set; }
    public int TicketsCreadosHoy { get; set; }
}

public class TicketsPorMesDto
{
    public int Mes { get; set; }
    public string NombreMes { get; set; } = string.Empty;
    public int Cantidad { get; set; }
}

public class TicketsPorTecnicoDto
{
    public Guid TecnicoId { get; set; }
    public string NombreTecnico { get; set; } = string.Empty;
    public int TicketsAbiertos { get; set; }
    public int TicketsResueltos { get; set; }
}

public class TicketsPorCategoriaDto
{
    public string Categoria { get; set; } = string.Empty;
    public int Cantidad { get; set; }
    public double Porcentaje { get; set; }
}

public class TiempoPromedioDto
{
    public string Prioridad { get; set; } = string.Empty;
    public string Color { get; set; } = string.Empty;
    public double PromedioHoras { get; set; }
    public int TotalResueltos { get; set; }
}

public class SLACumplimientoDto
{
    public int Mes { get; set; }
    public string NombreMes { get; set; } = string.Empty;
    public int TotalTickets { get; set; }
    public int CumplidosSLA { get; set; }
    public double PorcentajeCumplimiento { get; set; }
}

public class DashboardDto
{
    public int TotalTickets { get; set; }
    public int TicketsAbiertos { get; set; }
    public int TicketsEnProceso { get; set; }
    public int TicketsResueltos { get; set; }
    public int TicketsCerrados { get; set; }
    public int TicketsVencidosSLA { get; set; }
    public IEnumerable<ContadorEstadoDto> PorEstado { get; set; } = new List<ContadorEstadoDto>();
    public IEnumerable<ContadorPrioridadDto> PorPrioridad { get; set; } = new List<ContadorPrioridadDto>();
    public IEnumerable<TicketRecienteDto> UltimosTickets { get; set; } = new List<TicketRecienteDto>();
}

public class ContadorEstadoDto
{
    public string Estado { get; set; } = string.Empty;
    public string Color { get; set; } = string.Empty;
    public int Cantidad { get; set; }
}

public class ContadorPrioridadDto
{
    public string Prioridad { get; set; } = string.Empty;
    public string Color { get; set; } = string.Empty;
    public int Cantidad { get; set; }
}

public class TicketRecienteDto
{
    public Guid Id { get; set; }
    public string Numero { get; set; } = string.Empty;
    public string Asunto { get; set; } = string.Empty;
    public string Estado { get; set; } = string.Empty;
    public string EstadoColor { get; set; } = string.Empty;
    public string Prioridad { get; set; } = string.Empty;
    public string PrioridadColor { get; set; } = string.Empty;
    public DateTime FechaCreacion { get; set; }
}
