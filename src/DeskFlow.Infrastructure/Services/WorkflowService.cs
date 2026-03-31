using DeskFlow.Core.DTOs.Workflows;
using DeskFlow.Core.Entities;
using DeskFlow.Core.Interfaces;
using DeskFlow.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace DeskFlow.Infrastructure.Services;

public class WorkflowService : IWorkflowService
{
    private readonly DeskFlowDbContext _db;
    private readonly ITenantContext _tenantContext;

    public WorkflowService(DeskFlowDbContext db, ITenantContext tenantContext)
    {
        _db = db;
        _tenantContext = tenantContext;
    }

    public async Task<List<WorkflowListItemDto>> GetAllAsync()
    {
        var items = await _db.Workflows
            .Include(w => w.Servicio)
            .Include(w => w.CreadoPor)
            .Include(w => w.Nodos)
            .OrderByDescending(w => w.FechaCreacion)
            .ToListAsync();

        return items.Select(w => new WorkflowListItemDto(
            w.Id,
            w.Nombre,
            w.Descripcion,
            w.Tipo,
            w.Servicio?.Nombre,
            w.Activo,
            w.Nodos.Count,
            w.FechaCreacion,
            w.CreadoPor != null ? $"{w.CreadoPor.Nombre} {w.CreadoPor.Apellido}" : null
        )).ToList();
    }

    public async Task<WorkflowDetalleDto?> GetByIdAsync(Guid id)
    {
        var w = await _db.Workflows
            .Include(w => w.Servicio)
            .Include(w => w.CreadoPor)
            .Include(w => w.Nodos)
            .Include(w => w.Conexiones)
            .FirstOrDefaultAsync(w => w.Id == id);

        if (w == null) return null;
        return ToDetalle(w);
    }

    public async Task<WorkflowDetalleDto> CreateAsync(CreateWorkflowDto dto)
    {
        var workflow = new Workflow
        {
            TenantId    = _tenantContext.TenantId,
            Nombre      = dto.Nombre,
            Descripcion = dto.Descripcion,
            Tipo        = dto.Tipo,
            ServicioId  = dto.ServicioId,
            CreadoPorId = _tenantContext.UsuarioId,
            FechaCreacion = DateTime.UtcNow,
        };

        // Add default start and end nodes
        var nodoInicio = new WorkflowNodo
        {
            Id         = Guid.NewGuid(),
            WorkflowId = workflow.Id,
            TipoNodo   = "inicio",
            Nombre     = "Inicio",
            PosicionX  = 80,
            PosicionY  = 200,
        };
        var nodoFin = new WorkflowNodo
        {
            Id         = Guid.NewGuid(),
            WorkflowId = workflow.Id,
            TipoNodo   = "fin",
            Nombre     = "Fin",
            PosicionX  = 500,
            PosicionY  = 200,
        };

        workflow.Nodos.Add(nodoInicio);
        workflow.Nodos.Add(nodoFin);

        _db.Workflows.Add(workflow);
        await _db.SaveChangesAsync();

        return (await GetByIdAsync(workflow.Id))!;
    }

    public async Task<WorkflowDetalleDto> SaveAsync(Guid id, SaveWorkflowDto dto)
    {
        var workflow = await _db.Workflows
            .Include(w => w.Nodos)
            .Include(w => w.Conexiones)
            .FirstOrDefaultAsync(w => w.Id == id)
            ?? throw new KeyNotFoundException("Workflow no encontrado");

        workflow.Nombre      = dto.Nombre;
        workflow.Descripcion = dto.Descripcion;
        workflow.Tipo        = dto.Tipo;
        workflow.ServicioId  = dto.ServicioId;
        workflow.Activo      = dto.Activo;
        workflow.FechaActualizacion = DateTime.UtcNow;

        // Replace all nodes and edges
        _db.WorkflowConexiones.RemoveRange(workflow.Conexiones);
        _db.WorkflowNodos.RemoveRange(workflow.Nodos);
        await _db.SaveChangesAsync();

        var nodos = dto.Nodos.Select(n => new WorkflowNodo
        {
            Id         = n.Id,
            WorkflowId = id,
            TipoNodo   = n.TipoNodo,
            Nombre     = n.Nombre,
            PosicionX  = n.PosicionX,
            PosicionY  = n.PosicionY,
            ConfigJson = n.ConfigJson,
        }).ToList();

        var conexiones = dto.Conexiones.Select(c => new WorkflowConexion
        {
            Id            = c.Id,
            WorkflowId    = id,
            NodoOrigenId  = c.NodoOrigenId,
            NodoDestinoId = c.NodoDestinoId,
            Etiqueta      = c.Etiqueta,
            Orden         = c.Orden,
            OrigenLado    = c.OrigenLado,
            DestinoLado   = c.DestinoLado,
            MidOffsetX    = c.MidOffsetX,
            MidOffsetY    = c.MidOffsetY,
        }).ToList();

        await _db.WorkflowNodos.AddRangeAsync(nodos);
        await _db.WorkflowConexiones.AddRangeAsync(conexiones);
        await _db.SaveChangesAsync();

        return (await GetByIdAsync(id))!;
    }

    public async Task DeleteAsync(Guid id)
    {
        var workflow = await _db.Workflows.FindAsync(id)
            ?? throw new KeyNotFoundException("Workflow no encontrado");
        _db.Workflows.Remove(workflow);
        await _db.SaveChangesAsync();
    }

    private static WorkflowDetalleDto ToDetalle(Workflow w) => new(
        w.Id,
        w.Nombre,
        w.Descripcion,
        w.Tipo,
        w.ServicioId,
        w.Servicio?.Nombre,
        w.Activo,
        w.FechaCreacion,
        w.FechaActualizacion,
        w.CreadoPor != null ? $"{w.CreadoPor.Nombre} {w.CreadoPor.Apellido}" : null,
        w.Nodos.Select(n => new WorkflowNodoDto(n.Id, n.TipoNodo, n.Nombre, n.PosicionX, n.PosicionY, n.ConfigJson)).ToList(),
        w.Conexiones.Select(c => new WorkflowConexionDto(c.Id, c.NodoOrigenId, c.NodoDestinoId, c.Etiqueta, c.Orden, c.OrigenLado, c.DestinoLado, c.MidOffsetX, c.MidOffsetY)).ToList()
    );
}
