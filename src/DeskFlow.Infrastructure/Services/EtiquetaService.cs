using DeskFlow.Core.DTOs.Etiquetas;
using DeskFlow.Core.Entities;
using DeskFlow.Core.Interfaces;
using DeskFlow.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace DeskFlow.Infrastructure.Services;

public class EtiquetaService : IEtiquetaService
{
    private readonly DeskFlowDbContext _context;
    private readonly ITenantContext _tenant;

    public EtiquetaService(DeskFlowDbContext context, ITenantContext tenant)
    {
        _context = context;
        _tenant = tenant;
    }

    public async Task<IEnumerable<EtiquetaDto>> GetAllAsync()
    {
        return await _context.Etiquetas
            .Where(e => e.Activo)
            .Select(e => new EtiquetaDto { Id = e.Id, Nombre = e.Nombre, Color = e.Color, Activo = e.Activo })
            .ToListAsync();
    }

    public async Task<EtiquetaDto> CreateAsync(CreateEtiquetaDto dto)
    {
        var etiqueta = new Etiqueta
        {
            TenantId = _tenant.TenantId,
            Nombre = dto.Nombre,
            Color = dto.Color
        };
        _context.Etiquetas.Add(etiqueta);
        await _context.SaveChangesAsync();
        return new EtiquetaDto { Id = etiqueta.Id, Nombre = etiqueta.Nombre, Color = etiqueta.Color, Activo = etiqueta.Activo };
    }

    public async Task<EtiquetaDto> UpdateAsync(Guid id, UpdateEtiquetaDto dto)
    {
        var etiqueta = await _context.Etiquetas.FindAsync(id)
            ?? throw new KeyNotFoundException($"Etiqueta {id} no encontrada.");
        if (dto.Nombre != null) etiqueta.Nombre = dto.Nombre;
        if (dto.Color != null) etiqueta.Color = dto.Color;
        if (dto.Activo.HasValue) etiqueta.Activo = dto.Activo.Value;
        await _context.SaveChangesAsync();
        return new EtiquetaDto { Id = etiqueta.Id, Nombre = etiqueta.Nombre, Color = etiqueta.Color, Activo = etiqueta.Activo };
    }

    public async Task DeleteAsync(Guid id)
    {
        var etiqueta = await _context.Etiquetas.FindAsync(id)
            ?? throw new KeyNotFoundException($"Etiqueta {id} no encontrada.");
        etiqueta.Activo = false;
        await _context.SaveChangesAsync();
    }

    public async Task AsignarEtiquetasAsync(Guid ticketId, List<Guid> etiquetaIds)
    {
        // Quitar etiquetas existentes
        var existentes = await _context.TicketEtiquetas
            .Where(te => te.TicketId == ticketId)
            .ToListAsync();
        _context.TicketEtiquetas.RemoveRange(existentes);

        // Agregar nuevas
        foreach (var etiquetaId in etiquetaIds)
        {
            _context.TicketEtiquetas.Add(new TicketEtiqueta
            {
                TicketId = ticketId,
                EtiquetaId = etiquetaId
            });
        }

        await _context.SaveChangesAsync();
    }

    public async Task QuitarEtiquetaAsync(Guid ticketId, Guid etiquetaId)
    {
        var te = await _context.TicketEtiquetas
            .FirstOrDefaultAsync(te => te.TicketId == ticketId && te.EtiquetaId == etiquetaId)
            ?? throw new KeyNotFoundException("Asignación no encontrada.");
        _context.TicketEtiquetas.Remove(te);
        await _context.SaveChangesAsync();
    }

    public async Task<IEnumerable<EtiquetaEstadisticaDto>> GetEstadisticasAsync()
    {
        return await _context.Etiquetas
            .Where(e => e.Activo)
            .Select(e => new EtiquetaEstadisticaDto
            {
                Id = e.Id,
                Nombre = e.Nombre,
                Color = e.Color,
                CantidadTickets = e.TicketEtiquetas.Count
            })
            .OrderByDescending(e => e.CantidadTickets)
            .ToListAsync();
    }
}
