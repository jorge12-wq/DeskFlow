using DeskFlow.Core.DTOs.AuditLogs;
using DeskFlow.Core.DTOs.Tickets;
using DeskFlow.Core.Entities;
using DeskFlow.Core.Interfaces;
using DeskFlow.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace DeskFlow.Infrastructure.Services;

public class AuditLogService : IAuditLogService
{
    private readonly DeskFlowDbContext _context;
    private readonly ITenantContext _tenant;

    public AuditLogService(DeskFlowDbContext context, ITenantContext tenant)
    {
        _context = context;
        _tenant = tenant;
    }

    public async Task RegistrarAsync(string accion, string entidad, Guid? entidadId, string? ip = null, string? datosAnteriores = null, string? datosNuevos = null)
    {
        var log = new AuditLog
        {
            TenantId = _tenant.TenantId,
            UsuarioId = _tenant.UsuarioId,
            Accion = accion,
            Entidad = entidad,
            EntidadId = entidadId,
            DatosAnteriores = datosAnteriores,
            DatosNuevos = datosNuevos,
            IP = ip,
            FechaCreacion = DateTime.UtcNow
        };
        _context.AuditLogs.Add(log);
        await _context.SaveChangesAsync();
    }

    public async Task<PagedResultDto<AuditLogDto>> GetPagedAsync(string? entidad, Guid? entidadId, int pagina, int porPagina)
    {
        var query = _context.AuditLogs
            .Include(a => a.Usuario)
            .AsQueryable();

        if (!string.IsNullOrEmpty(entidad))
            query = query.Where(a => a.Entidad == entidad);

        if (entidadId.HasValue)
            query = query.Where(a => a.EntidadId == entidadId.Value);

        var total = await query.CountAsync();
        var items = await query
            .OrderByDescending(a => a.FechaCreacion)
            .Skip((pagina - 1) * porPagina)
            .Take(porPagina)
            .Select(a => new AuditLogDto
            {
                Id = a.Id,
                Usuario = a.Usuario.Nombre + " " + a.Usuario.Apellido,
                Accion = a.Accion,
                Entidad = a.Entidad,
                EntidadId = a.EntidadId,
                DatosAnteriores = a.DatosAnteriores,
                DatosNuevos = a.DatosNuevos,
                IP = a.IP,
                FechaCreacion = a.FechaCreacion
            })
            .ToListAsync();

        return new PagedResultDto<AuditLogDto>
        {
            Items = items,
            Total = total,
            Page = pagina,
            PageSize = porPagina
        };
    }
}
