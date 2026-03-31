using DeskFlow.Core.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace DeskFlow.Infrastructure.Data.Configurations;

public class NotificacionConfiguration : IEntityTypeConfiguration<Notificacion>
{
    public void Configure(EntityTypeBuilder<Notificacion> builder)
    {
        builder.HasKey(n => n.Id);
        builder.Property(n => n.Titulo).HasMaxLength(200).IsRequired();
        builder.Property(n => n.Mensaje).HasMaxLength(1000).IsRequired();

        builder.HasIndex(n => new { n.TenantId, n.UsuarioId, n.Leida });
        builder.HasIndex(n => n.FechaCreacion);

        builder.HasOne(n => n.Tenant)
            .WithMany()
            .HasForeignKey(n => n.TenantId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(n => n.Usuario)
            .WithMany()
            .HasForeignKey(n => n.UsuarioId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(n => n.Ticket)
            .WithMany()
            .HasForeignKey(n => n.TicketId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}

public class TecnicoCategoriaConfiguration : IEntityTypeConfiguration<TecnicoCategoria>
{
    public void Configure(EntityTypeBuilder<TecnicoCategoria> builder)
    {
        builder.HasKey(tc => tc.Id);
        builder.HasIndex(tc => new { tc.TenantId, tc.TecnicoId, tc.CategoriaId }).IsUnique();

        builder.HasOne(tc => tc.Tenant)
            .WithMany()
            .HasForeignKey(tc => tc.TenantId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(tc => tc.Tecnico)
            .WithMany()
            .HasForeignKey(tc => tc.TecnicoId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(tc => tc.Categoria)
            .WithMany()
            .HasForeignKey(tc => tc.CategoriaId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

public class PlantillaConfiguration : IEntityTypeConfiguration<Plantilla>
{
    public void Configure(EntityTypeBuilder<Plantilla> builder)
    {
        builder.HasKey(p => p.Id);
        builder.Property(p => p.Nombre).HasMaxLength(200).IsRequired();
        builder.Property(p => p.Contenido).IsRequired();

        builder.HasOne(p => p.Tenant)
            .WithMany()
            .HasForeignKey(p => p.TenantId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(p => p.Categoria)
            .WithMany()
            .HasForeignKey(p => p.CategoriaId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(p => p.CreadoPor)
            .WithMany()
            .HasForeignKey(p => p.CreadoPorId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
