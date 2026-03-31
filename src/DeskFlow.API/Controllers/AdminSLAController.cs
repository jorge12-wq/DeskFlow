using DeskFlow.Core.Entities;
using DeskFlow.Core.Interfaces;
using DeskFlow.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DeskFlow.API.Controllers;

[ApiController]
[Route("api/admin/sla")]
[Authorize(Roles = "Administrador,Supervisor")]
public class AdminSLAController : ControllerBase
{
    private readonly DeskFlowDbContext _db;
    private readonly ITenantContext _tenant;

    public AdminSLAController(DeskFlowDbContext db, ITenantContext tenant)
    {
        _db = db;
        _tenant = tenant;
    }

    // ── HORARIO LABORAL ──────────────────────────────────────────────────────

    [HttpGet("horario")]
    public async Task<IActionResult> GetHorario()
    {
        var horario = await _db.ConfiguracionesHorario
            .FirstOrDefaultAsync();

        if (horario == null)
        {
            // Devolver defaults si no está configurado aún
            return Ok(new
            {
                horaInicio = "08:00",
                horaFin    = "18:00",
                lunes = true, martes = true, miercoles = true,
                jueves = true, viernes = true, sabado = false, domingo = false,
                zonaHoraria = "UTC"
            });
        }

        return Ok(new
        {
            horaInicio  = horario.HoraInicio.ToString(@"hh\:mm"),
            horaFin     = horario.HoraFin.ToString(@"hh\:mm"),
            lunes       = horario.Lunes,
            martes      = horario.Martes,
            miercoles   = horario.Miercoles,
            jueves      = horario.Jueves,
            viernes     = horario.Viernes,
            sabado      = horario.Sabado,
            domingo     = horario.Domingo,
            zonaHoraria = horario.ZonaHoraria
        });
    }

    [HttpPut("horario")]
    public async Task<IActionResult> SaveHorario([FromBody] SaveHorarioDto dto)
    {
        if (!TimeSpan.TryParse(dto.HoraInicio, out var inicio) ||
            !TimeSpan.TryParse(dto.HoraFin, out var fin))
            return BadRequest("Formato de hora inválido. Use HH:mm.");

        if (fin <= inicio)
            return BadRequest("La hora de fin debe ser posterior a la hora de inicio.");

        var horario = await _db.ConfiguracionesHorario.FirstOrDefaultAsync();

        if (horario == null)
        {
            horario = new ConfiguracionHorario { TenantId = _tenant.TenantId };
            _db.ConfiguracionesHorario.Add(horario);
        }

        horario.HoraInicio  = inicio;
        horario.HoraFin     = fin;
        horario.Lunes       = dto.Lunes;
        horario.Martes      = dto.Martes;
        horario.Miercoles   = dto.Miercoles;
        horario.Jueves      = dto.Jueves;
        horario.Viernes     = dto.Viernes;
        horario.Sabado      = dto.Sabado;
        horario.Domingo     = dto.Domingo;
        horario.ZonaHoraria = dto.ZonaHoraria ?? "UTC";

        await _db.SaveChangesAsync();
        return Ok(new { message = "Horario laboral guardado." });
    }

    // ── CONFIGURACIONES SLA (prioridad/categoría) ────────────────────────────

    [HttpGet("configuraciones")]
    public async Task<IActionResult> GetConfiguraciones()
    {
        var items = await _db.SLAConfiguraciones
            .Include(s => s.Prioridad)
            .Include(s => s.Categoria)
            .OrderBy(s => s.Prioridad.Nombre)
            .Select(s => new
            {
                s.Id,
                prioridad      = s.Prioridad.Nombre,
                prioridadId    = s.PrioridadId,
                prioridadColor = s.Prioridad.Color,
                categoria      = s.Categoria != null ? s.Categoria.Nombre : (string?)null,
                categoriaId    = s.CategoriaId,
                tiempoRespuesta  = s.TiempoRespuesta_Horas,
                tiempoResolucion = s.TiempoResolucion_Horas,
            })
            .ToListAsync();

        return Ok(items);
    }

    [HttpPost("configuraciones")]
    public async Task<IActionResult> CreateConfiguracion([FromBody] SLAConfigDto dto)
    {
        // Evitar duplicados
        var existe = await _db.SLAConfiguraciones.AnyAsync(s =>
            s.PrioridadId == dto.PrioridadId &&
            s.CategoriaId == dto.CategoriaId);

        if (existe)
            return Conflict("Ya existe una configuración SLA para esa combinación de prioridad y categoría.");

        var config = new SLAConfiguracion
        {
            TenantId              = _tenant.TenantId,
            PrioridadId           = dto.PrioridadId,
            CategoriaId           = dto.CategoriaId,
            TiempoRespuesta_Horas  = dto.TiempoRespuesta,
            TiempoResolucion_Horas = dto.TiempoResolucion,
        };

        _db.SLAConfiguraciones.Add(config);
        await _db.SaveChangesAsync();
        return Ok(new { config.Id });
    }

    [HttpPut("configuraciones/{id:guid}")]
    public async Task<IActionResult> UpdateConfiguracion(Guid id, [FromBody] SLAConfigDto dto)
    {
        var config = await _db.SLAConfiguraciones.FindAsync(id);
        if (config == null) return NotFound();

        config.PrioridadId            = dto.PrioridadId;
        config.CategoriaId            = dto.CategoriaId;
        config.TiempoRespuesta_Horas  = dto.TiempoRespuesta;
        config.TiempoResolucion_Horas = dto.TiempoResolucion;

        await _db.SaveChangesAsync();
        return Ok();
    }

    [HttpDelete("configuraciones/{id:guid}")]
    public async Task<IActionResult> DeleteConfiguracion(Guid id)
    {
        var config = await _db.SLAConfiguraciones.FindAsync(id);
        if (config == null) return NotFound();

        _db.SLAConfiguraciones.Remove(config);
        await _db.SaveChangesAsync();
        return Ok();
    }

    // ── ZONAS HORARIAS ────────────────────────────────────────────────────────

    [HttpGet("zonas-horarias")]
    public IActionResult GetZonasHorarias()
    {
        var zonas = TimeZoneInfo.GetSystemTimeZones()
            .Select(tz => new { id = tz.Id, nombre = tz.DisplayName })
            .OrderBy(z => z.nombre)
            .ToList();
        return Ok(zonas);
    }
}

public record SaveHorarioDto(
    string HoraInicio,
    string HoraFin,
    bool Lunes, bool Martes, bool Miercoles,
    bool Jueves, bool Viernes, bool Sabado, bool Domingo,
    string? ZonaHoraria
);

public record SLAConfigDto(
    Guid PrioridadId,
    Guid? CategoriaId,
    int TiempoRespuesta,
    int TiempoResolucion
);
