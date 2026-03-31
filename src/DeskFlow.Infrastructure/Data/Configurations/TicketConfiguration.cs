using DeskFlow.Core.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace DeskFlow.Infrastructure.Data.Configurations;

public class TicketConfiguration : IEntityTypeConfiguration<Ticket>
{
    public void Configure(EntityTypeBuilder<Ticket> builder)
    {
        builder.HasKey(t => t.Id);

        builder.Property(t => t.Numero).HasMaxLength(20).IsRequired();
        builder.Property(t => t.Asunto).HasMaxLength(300).IsRequired();
        builder.Property(t => t.Descripcion).IsRequired();

        builder.HasIndex(t => new { t.TenantId, t.Numero }).IsUnique();
        builder.HasIndex(t => new { t.TenantId, t.EstadoId });
        builder.HasIndex(t => new { t.TenantId, t.TecnicoAsignadoId });
        builder.HasIndex(t => t.FechaCreacion);

        // Relationships - UsuarioCreador
        builder.HasOne(t => t.UsuarioCreador)
            .WithMany(u => u.TicketsCreados)
            .HasForeignKey(t => t.UsuarioCreadorId)
            .OnDelete(DeleteBehavior.Restrict);

        // TecnicoAsignado
        builder.HasOne(t => t.TecnicoAsignado)
            .WithMany(u => u.TicketsAsignados)
            .HasForeignKey(t => t.TecnicoAsignadoId)
            .OnDelete(DeleteBehavior.Restrict);

        // Supervisor
        builder.HasOne(t => t.Supervisor)
            .WithMany(u => u.TicketsSupervisados)
            .HasForeignKey(t => t.SupervisorId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(t => t.Categoria)
            .WithMany(c => c.Tickets)
            .HasForeignKey(t => t.CategoriaId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(t => t.Subcategoria)
            .WithMany(s => s.Tickets)
            .HasForeignKey(t => t.SubcategoriaId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(t => t.Prioridad)
            .WithMany(p => p.Tickets)
            .HasForeignKey(t => t.PrioridadId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(t => t.Estado)
            .WithMany(e => e.Tickets)
            .HasForeignKey(t => t.EstadoId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(t => t.Sucursal)
            .WithMany(s => s.Tickets)
            .HasForeignKey(t => t.SucursalId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(t => t.Area)
            .WithMany(a => a.Tickets)
            .HasForeignKey(t => t.AreaId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(t => t.Tenant)
            .WithMany(t => t.Tickets)
            .HasForeignKey(t => t.TenantId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

public class HistorialTicketConfiguration : IEntityTypeConfiguration<HistorialTicket>
{
    public void Configure(EntityTypeBuilder<HistorialTicket> builder)
    {
        builder.HasKey(h => h.Id);
        builder.Property(h => h.Descripcion).HasMaxLength(500);

        builder.HasOne(h => h.Ticket)
            .WithMany(t => t.Historial)
            .HasForeignKey(h => h.TicketId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(h => h.Usuario)
            .WithMany(u => u.Historial)
            .HasForeignKey(h => h.UsuarioId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(h => h.EstadoAnterior)
            .WithMany(e => e.HistorialesAnteriores)
            .HasForeignKey(h => h.EstadoAnteriorId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(h => h.EstadoNuevo)
            .WithMany(e => e.HistorialesNuevos)
            .HasForeignKey(h => h.EstadoNuevoId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

public class ComentarioTicketConfiguration : IEntityTypeConfiguration<ComentarioTicket>
{
    public void Configure(EntityTypeBuilder<ComentarioTicket> builder)
    {
        builder.HasKey(c => c.Id);
        builder.Property(c => c.Contenido).IsRequired();

        builder.HasOne(c => c.Ticket)
            .WithMany(t => t.Comentarios)
            .HasForeignKey(c => c.TicketId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(c => c.Usuario)
            .WithMany(u => u.Comentarios)
            .HasForeignKey(c => c.UsuarioId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

public class AdjuntoTicketConfiguration : IEntityTypeConfiguration<AdjuntoTicket>
{
    public void Configure(EntityTypeBuilder<AdjuntoTicket> builder)
    {
        builder.HasKey(a => a.Id);
        builder.Property(a => a.NombreArchivo).HasMaxLength(255).IsRequired();
        builder.Property(a => a.RutaArchivo).HasMaxLength(500).IsRequired();
        builder.Property(a => a.TipoArchivo).HasMaxLength(100).IsRequired();

        builder.HasOne(a => a.Ticket)
            .WithMany(t => t.Adjuntos)
            .HasForeignKey(a => a.TicketId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(a => a.Comentario)
            .WithMany(c => c.Adjuntos)
            .HasForeignKey(a => a.ComentarioId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
