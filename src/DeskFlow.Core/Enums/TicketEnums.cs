namespace DeskFlow.Core.Enums;

public enum RolNombre
{
    Administrador = 1,
    Supervisor    = 2,
    Tecnico       = 3,
    Usuario       = 4,
    Agente        = 5,
    Aprobador     = 6
}

public enum EstadoTicketNombre
{
    Nuevo                  = 1,
    Asignado               = 2,
    EnProceso              = 3,
    PendienteUsuario       = 4,
    PendienteProveedor     = 5,
    Resuelto               = 6,
    Cerrado                = 7,
    Cancelado              = 8,
    Escalado               = 9,
    PendienteAprobacion    = 10,
    Rechazado              = 11
}

public enum SLAEstado
{
    EnTiempo = 0,
    EnRiesgo = 1,
    Vencido  = 2
}

public enum TipoNotificacion
{
    TicketCreado    = 1,
    TicketAsignado  = 2,
    NuevoComentario = 3,
    SLAEnRiesgo     = 4,
    SLAVencido      = 5,
    TicketResuelto  = 6,
    CambioEstado    = 7,
    TicketEscalado  = 8,
    TicketAprobado  = 9,
    TicketRechazado = 10
}
