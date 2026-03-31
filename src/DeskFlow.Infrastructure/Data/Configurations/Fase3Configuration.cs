using DeskFlow.Core.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace DeskFlow.Infrastructure.Data.Configurations;

public class BaseConocimientoConfiguration : IEntityTypeConfiguration<BaseConocimiento>
{
    public void Configure(EntityTypeBuilder<BaseConocimiento> builder)
    {
        builder.HasKey(b => b.Id);
        builder.Property(b => b.Titulo).HasMaxLength(500).IsRequired();
        builder.Property(b => b.Contenido).IsRequired();
        builder.Property(b => b.Etiquetas).HasMaxLength(1000);

        builder.HasIndex(b => new { b.TenantId, b.CategoriaId });
        builder.HasIndex(b => new { b.TenantId, b.Activo });

        builder.HasOne(b => b.Tenant).WithMany().HasForeignKey(b => b.TenantId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(b => b.Categoria).WithMany().HasForeignKey(b => b.CategoriaId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(b => b.Subcategoria).WithMany().HasForeignKey(b => b.SubcategoriaId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(b => b.Autor).WithMany().HasForeignKey(b => b.AutorId).OnDelete(DeleteBehavior.Restrict);
    }
}

public class ArticuloRelacionadoConfiguration : IEntityTypeConfiguration<ArticuloRelacionado>
{
    public void Configure(EntityTypeBuilder<ArticuloRelacionado> builder)
    {
        builder.HasKey(a => a.Id);
        builder.HasIndex(a => new { a.ArticuloOrigenId, a.ArticuloRelacionadoId }).IsUnique();

        builder.HasOne(a => a.ArticuloOrigen)
            .WithMany(b => b.ArticulosRelacionados)
            .HasForeignKey(a => a.ArticuloOrigenId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(a => a.Articulo)
            .WithMany()
            .HasForeignKey(a => a.ArticuloRelacionadoId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

public class EncuestaConfiguracionConfiguration : IEntityTypeConfiguration<EncuestaConfiguracion>
{
    public void Configure(EntityTypeBuilder<EncuestaConfiguracion> builder)
    {
        builder.HasKey(e => e.Id);
        builder.Property(e => e.Pregunta).HasMaxLength(500).IsRequired();
        builder.HasOne(e => e.Tenant).WithMany().HasForeignKey(e => e.TenantId).OnDelete(DeleteBehavior.Restrict);
    }
}

public class EncuestaRespuestaConfiguration : IEntityTypeConfiguration<EncuestaRespuesta>
{
    public void Configure(EntityTypeBuilder<EncuestaRespuesta> builder)
    {
        builder.HasKey(e => e.Id);
        builder.Property(e => e.Comentario).HasMaxLength(1000);
        builder.HasIndex(e => new { e.TenantId, e.TicketId }).IsUnique(); // Una encuesta por ticket

        builder.HasOne(e => e.Tenant).WithMany().HasForeignKey(e => e.TenantId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(e => e.Ticket).WithMany().HasForeignKey(e => e.TicketId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(e => e.Usuario).WithMany().HasForeignKey(e => e.UsuarioId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(e => e.Tecnico).WithMany().HasForeignKey(e => e.TecnicoId).OnDelete(DeleteBehavior.Restrict);
    }
}

public class EtiquetaConfiguration : IEntityTypeConfiguration<Etiqueta>
{
    public void Configure(EntityTypeBuilder<Etiqueta> builder)
    {
        builder.HasKey(e => e.Id);
        builder.Property(e => e.Nombre).HasMaxLength(50).IsRequired();
        builder.Property(e => e.Color).HasMaxLength(7).IsRequired();
        builder.HasIndex(e => new { e.TenantId, e.Nombre }).IsUnique();
        builder.HasOne(e => e.Tenant).WithMany().HasForeignKey(e => e.TenantId).OnDelete(DeleteBehavior.Restrict);
    }
}

public class TicketEtiquetaConfiguration : IEntityTypeConfiguration<TicketEtiqueta>
{
    public void Configure(EntityTypeBuilder<TicketEtiqueta> builder)
    {
        builder.HasKey(te => te.Id);
        builder.HasIndex(te => new { te.TicketId, te.EtiquetaId }).IsUnique();

        builder.HasOne(te => te.Ticket).WithMany(t => t.Etiquetas).HasForeignKey(te => te.TicketId).OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(te => te.Etiqueta).WithMany(e => e.TicketEtiquetas).HasForeignKey(te => te.EtiquetaId).OnDelete(DeleteBehavior.Cascade);
    }
}

public class AuditLogConfiguration : IEntityTypeConfiguration<AuditLog>
{
    public void Configure(EntityTypeBuilder<AuditLog> builder)
    {
        builder.HasKey(a => a.Id);
        builder.Property(a => a.Accion).HasMaxLength(50).IsRequired();
        builder.Property(a => a.Entidad).HasMaxLength(100).IsRequired();
        builder.Property(a => a.DatosAnteriores).HasColumnType("jsonb");
        builder.Property(a => a.DatosNuevos).HasColumnType("jsonb");
        builder.Property(a => a.IP).HasMaxLength(50);

        builder.HasIndex(a => new { a.TenantId, a.Entidad, a.EntidadId });
        builder.HasIndex(a => a.FechaCreacion);

        builder.HasOne(a => a.Tenant).WithMany().HasForeignKey(a => a.TenantId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(a => a.Usuario).WithMany().HasForeignKey(a => a.UsuarioId).OnDelete(DeleteBehavior.Restrict);
    }
}
