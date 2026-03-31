using ClosedXML.Excel;
using DeskFlow.Core.DTOs.Reportes;
using DeskFlow.Core.Enums;
using DeskFlow.Core.Interfaces;
using DeskFlow.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace DeskFlow.Infrastructure.Services;

public class ReporteService : IReporteService
{
    private readonly DeskFlowDbContext _context;
    private readonly ITenantContext _tenant;

    public ReporteService(DeskFlowDbContext context, ITenantContext tenant)
    {
        _context = context;
        _tenant = tenant;
        QuestPDF.Settings.License = LicenseType.Community;
    }

    public async Task<byte[]> GenerarReporteTicketsExcelAsync(FiltroReporteTicketsDto filtro)
    {
        var query = _context.Tickets
            .Include(t => t.Categoria)
            .Include(t => t.Prioridad)
            .Include(t => t.Estado)
            .Include(t => t.UsuarioCreador)
            .Include(t => t.TecnicoAsignado)
            .AsQueryable();

        if (filtro.FechaDesde.HasValue) query = query.Where(t => t.FechaCreacion >= filtro.FechaDesde.Value);
        if (filtro.FechaHasta.HasValue) query = query.Where(t => t.FechaCreacion <= filtro.FechaHasta.Value);
        if (!string.IsNullOrEmpty(filtro.Estado)) query = query.Where(t => t.Estado.Nombre == filtro.Estado);
        if (filtro.TecnicoId.HasValue) query = query.Where(t => t.TecnicoAsignadoId == filtro.TecnicoId.Value);

        var tickets = await query.OrderBy(t => t.FechaCreacion).ToListAsync();

        using var workbook = new XLWorkbook();

        // Hoja de tickets
        var ws = workbook.Worksheets.Add("Tickets");
        var headers = new[] { "Número", "Asunto", "Categoría", "Prioridad", "Estado", "Creado por", "Técnico", "Fecha Creación", "Fecha Resolución", "Tiempo Resolución (hs)", "SLA Estado" };

        for (int i = 0; i < headers.Length; i++)
        {
            var cell = ws.Cell(1, i + 1);
            cell.Value = headers[i];
            cell.Style.Font.Bold = true;
            cell.Style.Fill.BackgroundColor = XLColor.FromHtml("#1e3a5f");
            cell.Style.Font.FontColor = XLColor.White;
        }

        for (int r = 0; r < tickets.Count; r++)
        {
            var t = tickets[r];
            var row = r + 2;
            var tiempoResolucion = t.FechaResolucion.HasValue
                ? (t.FechaResolucion.Value - t.FechaCreacion).TotalHours
                : (double?)null;

            ws.Cell(row, 1).Value = t.Numero;
            ws.Cell(row, 2).Value = t.Asunto;
            ws.Cell(row, 3).Value = t.Categoria.Nombre;
            ws.Cell(row, 4).Value = t.Prioridad.Nombre;
            ws.Cell(row, 5).Value = t.Estado.Nombre;
            ws.Cell(row, 6).Value = t.UsuarioCreador != null ? $"{t.UsuarioCreador.Nombre} {t.UsuarioCreador.Apellido}" : "";
            ws.Cell(row, 7).Value = t.TecnicoAsignado != null ? $"{t.TecnicoAsignado.Nombre} {t.TecnicoAsignado.Apellido}" : "";
            ws.Cell(row, 8).Value = t.FechaCreacion.ToString("dd/MM/yyyy HH:mm");
            ws.Cell(row, 9).Value = t.FechaResolucion?.ToString("dd/MM/yyyy HH:mm") ?? "";
            ws.Cell(row, 10).Value = tiempoResolucion.HasValue ? Math.Round(tiempoResolucion.Value, 1).ToString() : "";
            ws.Cell(row, 11).Value = t.SLAEstado.ToString();

            // Colores por estado SLA
            var fillColor = t.SLAEstado == SLAEstado.Vencido ? XLColor.FromHtml("#ffe0e0")
                : t.Estado.Nombre == "Cerrado" ? XLColor.FromHtml("#e0ffe0")
                : XLColor.FromHtml("#fff9e0");

            for (int c = 1; c <= 11; c++)
                ws.Cell(row, c).Style.Fill.BackgroundColor = fillColor;
        }

        ws.Columns().AdjustToContents();

        // Hoja resumen
        var wsSummary = workbook.Worksheets.Add("Resumen");
        wsSummary.Cell(1, 1).Value = "Resumen por Estado";
        wsSummary.Cell(1, 1).Style.Font.Bold = true;
        wsSummary.Cell(2, 1).Value = "Estado";
        wsSummary.Cell(2, 2).Value = "Cantidad";
        var porEstado = tickets.GroupBy(t => t.Estado.Nombre).Select(g => new { Estado = g.Key, Count = g.Count() }).ToList();
        int rowIdx = 3;
        foreach (var g in porEstado)
        {
            wsSummary.Cell(rowIdx, 1).Value = g.Estado;
            wsSummary.Cell(rowIdx, 2).Value = g.Count;
            rowIdx++;
        }

        rowIdx++;
        wsSummary.Cell(rowIdx, 1).Value = "Resumen por Prioridad";
        wsSummary.Cell(rowIdx, 1).Style.Font.Bold = true;
        rowIdx++;
        wsSummary.Cell(rowIdx, 1).Value = "Prioridad";
        wsSummary.Cell(rowIdx, 2).Value = "Cantidad";
        rowIdx++;
        var porPrioridad = tickets.GroupBy(t => t.Prioridad.Nombre).Select(g => new { Prioridad = g.Key, Count = g.Count() }).ToList();
        foreach (var g in porPrioridad)
        {
            wsSummary.Cell(rowIdx, 1).Value = g.Prioridad;
            wsSummary.Cell(rowIdx, 2).Value = g.Count;
            rowIdx++;
        }

        rowIdx++;
        wsSummary.Cell(rowIdx, 1).Value = "Resumen por Técnico";
        wsSummary.Cell(rowIdx, 1).Style.Font.Bold = true;
        rowIdx++;
        wsSummary.Cell(rowIdx, 1).Value = "Técnico";
        wsSummary.Cell(rowIdx, 2).Value = "Tickets";
        rowIdx++;
        var porTecnico = tickets.Where(t => t.TecnicoAsignado != null)
            .GroupBy(t => $"{t.TecnicoAsignado!.Nombre} {t.TecnicoAsignado.Apellido}")
            .Select(g => new { Tecnico = g.Key, Count = g.Count() }).ToList();
        foreach (var g in porTecnico)
        {
            wsSummary.Cell(rowIdx, 1).Value = g.Tecnico;
            wsSummary.Cell(rowIdx, 2).Value = g.Count;
            rowIdx++;
        }

        wsSummary.Columns().AdjustToContents();

        using var ms = new MemoryStream();
        workbook.SaveAs(ms);
        return ms.ToArray();
    }

    public async Task<byte[]> GenerarReporteSLAExcelAsync(int mes, int anio)
    {
        var desde = new DateTime(anio, mes, 1);
        var hasta = desde.AddMonths(1);

        var tickets = await _context.Tickets
            .Include(t => t.Categoria)
            .Include(t => t.Prioridad)
            .Include(t => t.TecnicoAsignado)
            .Where(t => t.FechaCreacion >= desde && t.FechaCreacion < hasta)
            .ToListAsync();

        using var workbook = new XLWorkbook();
        var ws = workbook.Worksheets.Add("SLA");

        ws.Cell(1, 1).Value = $"Reporte SLA - {new DateTime(anio, mes, 1):MMMM yyyy}";
        ws.Cell(1, 1).Style.Font.Bold = true;
        ws.Cell(1, 1).Style.Font.FontSize = 14;

        ws.Cell(3, 1).Value = "Por Categoría";
        ws.Cell(3, 1).Style.Font.Bold = true;
        ws.Cell(4, 1).Value = "Categoría";
        ws.Cell(4, 2).Value = "Total";
        ws.Cell(4, 3).Value = "En Tiempo";
        ws.Cell(4, 4).Value = "Vencidos";
        ws.Cell(4, 5).Value = "% Cumplimiento";

        var porcateg = tickets.GroupBy(t => t.Categoria.Nombre).ToList();
        int row = 5;
        foreach (var g in porcateg)
        {
            var enTiempo = g.Count(t => t.SLAEstado == SLAEstado.EnTiempo);
            var vencidos = g.Count(t => t.SLAEstado == SLAEstado.Vencido);
            ws.Cell(row, 1).Value = g.Key;
            ws.Cell(row, 2).Value = g.Count();
            ws.Cell(row, 3).Value = enTiempo;
            ws.Cell(row, 4).Value = vencidos;
            ws.Cell(row, 5).Value = g.Count() > 0 ? $"{(decimal)enTiempo / g.Count() * 100:F1}%" : "N/A";
            row++;
        }

        row++;
        ws.Cell(row, 1).Value = "Por Prioridad";
        ws.Cell(row, 1).Style.Font.Bold = true;
        row++;
        ws.Cell(row, 1).Value = "Prioridad";
        ws.Cell(row, 2).Value = "Total";
        ws.Cell(row, 3).Value = "En Tiempo";
        ws.Cell(row, 4).Value = "Vencidos";
        ws.Cell(row, 5).Value = "% Cumplimiento";
        row++;

        var porPrio = tickets.GroupBy(t => t.Prioridad.Nombre).ToList();
        foreach (var g in porPrio)
        {
            var enTiempo = g.Count(t => t.SLAEstado == SLAEstado.EnTiempo);
            ws.Cell(row, 1).Value = g.Key;
            ws.Cell(row, 2).Value = g.Count();
            ws.Cell(row, 3).Value = enTiempo;
            ws.Cell(row, 4).Value = g.Count() - enTiempo;
            ws.Cell(row, 5).Value = g.Count() > 0 ? $"{(decimal)enTiempo / g.Count() * 100:F1}%" : "N/A";
            row++;
        }

        row++;
        ws.Cell(row, 1).Value = "Detalle Tickets Vencidos";
        ws.Cell(row, 1).Style.Font.Bold = true;
        row++;
        ws.Cell(row, 1).Value = "Número";
        ws.Cell(row, 2).Value = "Asunto";
        ws.Cell(row, 3).Value = "Categoría";
        ws.Cell(row, 4).Value = "Prioridad";
        ws.Cell(row, 5).Value = "Técnico";
        ws.Cell(row, 6).Value = "Fecha Límite SLA";
        row++;

        foreach (var t in tickets.Where(t => t.SLAEstado == SLAEstado.Vencido))
        {
            ws.Cell(row, 1).Value = t.Numero;
            ws.Cell(row, 2).Value = t.Asunto;
            ws.Cell(row, 3).Value = t.Categoria.Nombre;
            ws.Cell(row, 4).Value = t.Prioridad.Nombre;
            ws.Cell(row, 5).Value = t.TecnicoAsignado != null ? $"{t.TecnicoAsignado.Nombre} {t.TecnicoAsignado.Apellido}" : "Sin asignar";
            ws.Cell(row, 6).Value = t.FechaLimiteSLA?.ToString("dd/MM/yyyy HH:mm") ?? "";
            ws.Cell(row, 1).Style.Fill.BackgroundColor = XLColor.FromHtml("#ffe0e0");
            row++;
        }

        ws.Columns().AdjustToContents();

        using var ms = new MemoryStream();
        workbook.SaveAs(ms);
        return ms.ToArray();
    }

    public async Task<byte[]> GenerarReporteTecnicosExcelAsync(FiltroReporteTecnicosDto filtro)
    {
        var query = _context.Tickets
            .Include(t => t.TecnicoAsignado)
            .Include(t => t.Estado)
            .Where(t => t.TecnicoAsignadoId != null)
            .AsQueryable();

        if (filtro.FechaDesde.HasValue) query = query.Where(t => t.FechaCreacion >= filtro.FechaDesde.Value);
        if (filtro.FechaHasta.HasValue) query = query.Where(t => t.FechaCreacion <= filtro.FechaHasta.Value);

        var tickets = await query.ToListAsync();

        using var workbook = new XLWorkbook();
        var ws = workbook.Worksheets.Add("Rendimiento Técnicos");

        var headers = new[] { "Técnico", "Tickets Atendidos", "Tickets Resueltos", "Tiempo Prom. Resolución (hs)", "% Cumplimiento SLA" };
        for (int i = 0; i < headers.Length; i++)
        {
            ws.Cell(1, i + 1).Value = headers[i];
            ws.Cell(1, i + 1).Style.Font.Bold = true;
            ws.Cell(1, i + 1).Style.Fill.BackgroundColor = XLColor.FromHtml("#1e3a5f");
            ws.Cell(1, i + 1).Style.Font.FontColor = XLColor.White;
        }

        var porTecnico = tickets
            .GroupBy(t => new { t.TecnicoAsignadoId, Nombre = $"{t.TecnicoAsignado!.Nombre} {t.TecnicoAsignado.Apellido}" })
            .OrderByDescending(g => g.Count())
            .ToList();

        int row = 2;
        foreach (var g in porTecnico)
        {
            var resueltos = g.Count(t => t.FechaResolucion.HasValue);
            var tiemposProm = g.Where(t => t.FechaResolucion.HasValue)
                .Select(t => (t.FechaResolucion!.Value - t.FechaCreacion).TotalHours)
                .DefaultIfEmpty(0)
                .Average();
            var enTiempo = g.Count(t => t.SLAEstado == SLAEstado.EnTiempo);
            var slaPercent = g.Count() > 0 ? (decimal)enTiempo / g.Count() * 100 : 0;

            ws.Cell(row, 1).Value = g.Key.Nombre;
            ws.Cell(row, 2).Value = g.Count();
            ws.Cell(row, 3).Value = resueltos;
            ws.Cell(row, 4).Value = Math.Round(tiemposProm, 1);
            ws.Cell(row, 5).Value = $"{slaPercent:F1}%";
            row++;
        }

        ws.Columns().AdjustToContents();

        using var ms = new MemoryStream();
        workbook.SaveAs(ms);
        return ms.ToArray();
    }

    public async Task<byte[]> GenerarReporteTicketPdfAsync(Guid ticketId)
    {
        var ticket = await _context.Tickets
            .Include(t => t.Categoria)
            .Include(t => t.Subcategoria)
            .Include(t => t.Prioridad)
            .Include(t => t.Estado)
            .Include(t => t.UsuarioCreador)
            .Include(t => t.TecnicoAsignado)
            .Include(t => t.Comentarios).ThenInclude(c => c.Usuario)
            .Include(t => t.Adjuntos)
            .Include(t => t.Historial).ThenInclude(h => h.Usuario)
            .FirstOrDefaultAsync(t => t.Id == ticketId)
            ?? throw new KeyNotFoundException($"Ticket {ticketId} no encontrado.");

        var doc = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(2, Unit.Centimetre);
                page.DefaultTextStyle(x => x.FontSize(10));

                page.Header().Column(col =>
                {
                    col.Item().Row(row =>
                    {
                        row.RelativeItem().Column(inner =>
                        {
                            inner.Item().Text("DeskFlow — Reporte de Ticket").Bold().FontSize(16);
                            inner.Item().Text($"Ticket #{ticket.Numero}").FontSize(12);
                        });
                        row.ConstantItem(120).AlignRight().Column(inner =>
                        {
                            inner.Item().Text($"Generado: {DateTime.Now:dd/MM/yyyy HH:mm}");
                        });
                    });
                    col.Item().PaddingTop(5).LineHorizontal(1);
                });

                page.Content().PaddingVertical(10).Column(col =>
                {
                    // Datos del ticket
                    col.Item().Text("Información del Ticket").Bold().FontSize(13);
                    col.Item().PaddingTop(5).Table(table =>
                    {
                        table.ColumnsDefinition(c => { c.RelativeColumn(1); c.RelativeColumn(2); });
                        void AddRow(string label, string value)
                        {
                            table.Cell().Background("#f0f0f0").Padding(4).Text(label).Bold();
                            table.Cell().Padding(4).Text(value);
                        }
                        AddRow("Número:", ticket.Numero);
                        AddRow("Asunto:", ticket.Asunto);
                        AddRow("Categoría:", ticket.Categoria.Nombre);
                        AddRow("Prioridad:", ticket.Prioridad.Nombre);
                        AddRow("Estado:", ticket.Estado.Nombre);
                        AddRow("Creado por:", ticket.UsuarioCreador != null ? $"{ticket.UsuarioCreador.Nombre} {ticket.UsuarioCreador.Apellido}" : "");
                        AddRow("Técnico asignado:", ticket.TecnicoAsignado != null ? $"{ticket.TecnicoAsignado.Nombre} {ticket.TecnicoAsignado.Apellido}" : "Sin asignar");
                        AddRow("Fecha creación:", ticket.FechaCreacion.ToString("dd/MM/yyyy HH:mm"));
                        AddRow("Fecha resolución:", ticket.FechaResolucion?.ToString("dd/MM/yyyy HH:mm") ?? "Pendiente");
                        AddRow("SLA Estado:", ticket.SLAEstado.ToString());
                    });

                    col.Item().PaddingTop(10).Text("Descripción").Bold().FontSize(12);
                    col.Item().PaddingTop(3).Background("#f9f9f9").Padding(8).Text(ticket.Descripcion);

                    // Comentarios públicos
                    var comentariosPublicos = ticket.Comentarios.Where(c => !c.EsInterno).OrderBy(c => c.FechaCreacion).ToList();
                    if (comentariosPublicos.Count > 0)
                    {
                        col.Item().PaddingTop(10).Text("Comentarios").Bold().FontSize(12);
                        foreach (var c in comentariosPublicos)
                        {
                            col.Item().PaddingTop(5).Border(1).BorderColor("#e0e0e0").Padding(6).Column(inner =>
                            {
                                inner.Item().Row(r =>
                                {
                                    r.RelativeItem().Text($"{c.Usuario.Nombre} {c.Usuario.Apellido}").Bold();
                                    r.ConstantItem(150).AlignRight().Text(c.FechaCreacion.ToString("dd/MM/yyyy HH:mm")).FontSize(8);
                                });
                                inner.Item().PaddingTop(3).Text(c.Contenido);
                            });
                        }
                    }

                    // Historial
                    if (ticket.Historial.Count > 0)
                    {
                        col.Item().PaddingTop(10).Text("Historial de Cambios").Bold().FontSize(12);
                        col.Item().PaddingTop(3).Table(table =>
                        {
                            table.ColumnsDefinition(c => { c.RelativeColumn(2); c.RelativeColumn(1); c.RelativeColumn(3); });
                            table.Header(h =>
                            {
                                h.Cell().Background("#1e3a5f").Padding(4).Text("Fecha").FontColor("#ffffff").Bold();
                                h.Cell().Background("#1e3a5f").Padding(4).Text("Usuario").FontColor("#ffffff").Bold();
                                h.Cell().Background("#1e3a5f").Padding(4).Text("Descripción").FontColor("#ffffff").Bold();
                            });
                            foreach (var h in ticket.Historial.OrderBy(h => h.FechaCreacion))
                            {
                                table.Cell().Padding(4).Text(h.FechaCreacion.ToString("dd/MM/yyyy HH:mm"));
                                table.Cell().Padding(4).Text($"{h.Usuario.Nombre} {h.Usuario.Apellido}");
                                table.Cell().Padding(4).Text(h.Descripcion);
                            }
                        });
                    }

                    // Adjuntos
                    if (ticket.Adjuntos.Count > 0)
                    {
                        col.Item().PaddingTop(10).Text("Archivos Adjuntos").Bold().FontSize(12);
                        foreach (var a in ticket.Adjuntos)
                        {
                            col.Item().Text($"• {a.NombreArchivo} ({FormatBytes(a.Tamaño)})");
                        }
                    }
                });

                page.Footer().AlignCenter().Text(text =>
                {
                    text.Span("DeskFlow — Sistema de Ticketera Empresarial | Página ");
                    text.CurrentPageNumber();
                    text.Span(" de ");
                    text.TotalPages();
                });
            });
        });

        return doc.GeneratePdf();
    }

    private static string FormatBytes(long bytes)
    {
        if (bytes < 1024) return $"{bytes} B";
        if (bytes < 1024 * 1024) return $"{bytes / 1024.0:F1} KB";
        return $"{bytes / (1024.0 * 1024.0):F1} MB";
    }
}
