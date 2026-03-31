using DeskFlow.Core.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace DeskFlow.Infrastructure.Data.Configurations;

public class TenantConfiguration : IEntityTypeConfiguration<Tenant>
{
    public void Configure(EntityTypeBuilder<Tenant> builder)
    {
        builder.HasKey(t => t.Id);
        builder.Property(t => t.Nombre).HasMaxLength(200).IsRequired();
        builder.Property(t => t.Dominio).HasMaxLength(100);
        builder.Property(t => t.Logo).HasMaxLength(500);
        builder.Property(t => t.ColorPrimario).HasMaxLength(20);
        // PostgreSQL allows multiple NULLs in a unique index natively — no filter needed
        builder.HasIndex(t => t.Dominio).IsUnique();
    }
}

public class RolConfiguration : IEntityTypeConfiguration<Rol>
{
    public void Configure(EntityTypeBuilder<Rol> builder)
    {
        builder.HasKey(r => r.Id);
        builder.Property(r => r.Nombre).HasMaxLength(100).IsRequired();
        builder.Property(r => r.Descripcion).HasMaxLength(300);
        builder.HasIndex(r => new { r.TenantId, r.Nombre }).IsUnique();

        builder.HasOne(r => r.Tenant)
            .WithMany(t => t.Roles)
            .HasForeignKey(r => r.TenantId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

public class UsuarioConfiguration : IEntityTypeConfiguration<Usuario>
{
    public void Configure(EntityTypeBuilder<Usuario> builder)
    {
        builder.HasKey(u => u.Id);
        builder.Property(u => u.Nombre).HasMaxLength(100).IsRequired();
        builder.Property(u => u.Apellido).HasMaxLength(100).IsRequired();
        builder.Property(u => u.Email).HasMaxLength(200).IsRequired();
        builder.Property(u => u.PasswordHash).HasMaxLength(500).IsRequired();
        builder.Property(u => u.RefreshToken).HasMaxLength(500);

        builder.HasIndex(u => new { u.TenantId, u.Email }).IsUnique();

        builder.HasOne(u => u.Tenant)
            .WithMany(t => t.Usuarios)
            .HasForeignKey(u => u.TenantId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(u => u.Rol)
            .WithMany(r => r.Usuarios)
            .HasForeignKey(u => u.RolId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(u => u.Sucursal)
            .WithMany(s => s.Usuarios)
            .HasForeignKey(u => u.SucursalId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(u => u.Area)
            .WithMany(a => a.Usuarios)
            .HasForeignKey(u => u.AreaId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

public class SucursalConfiguration : IEntityTypeConfiguration<Sucursal>
{
    public void Configure(EntityTypeBuilder<Sucursal> builder)
    {
        builder.HasKey(s => s.Id);
        builder.Property(s => s.Nombre).HasMaxLength(200).IsRequired();
        builder.Property(s => s.Direccion).HasMaxLength(400);

        builder.HasOne(s => s.Tenant)
            .WithMany(t => t.Sucursales)
            .HasForeignKey(s => s.TenantId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

public class AreaConfiguration : IEntityTypeConfiguration<Area>
{
    public void Configure(EntityTypeBuilder<Area> builder)
    {
        builder.HasKey(a => a.Id);
        builder.Property(a => a.Nombre).HasMaxLength(200).IsRequired();
        builder.Property(a => a.Descripcion).HasMaxLength(400);

        builder.HasOne(a => a.Tenant)
            .WithMany(t => t.Areas)
            .HasForeignKey(a => a.TenantId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(a => a.HelpDesk)
            .WithMany()
            .HasForeignKey(a => a.HelpDeskId)
            .OnDelete(DeleteBehavior.SetNull)
            .IsRequired(false);
    }
}

public class CategoriaConfiguration : IEntityTypeConfiguration<Categoria>
{
    public void Configure(EntityTypeBuilder<Categoria> builder)
    {
        builder.HasKey(c => c.Id);
        builder.Property(c => c.Nombre).HasMaxLength(200).IsRequired();
        builder.Property(c => c.Descripcion).HasMaxLength(400);
        builder.Property(c => c.Icono).HasMaxLength(100);

        builder.HasOne(c => c.Tenant)
            .WithMany(t => t.Categorias)
            .HasForeignKey(c => c.TenantId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

public class SubcategoriaConfiguration : IEntityTypeConfiguration<Subcategoria>
{
    public void Configure(EntityTypeBuilder<Subcategoria> builder)
    {
        builder.HasKey(s => s.Id);
        builder.Property(s => s.Nombre).HasMaxLength(200).IsRequired();
        builder.Property(s => s.Descripcion).HasMaxLength(400);

        builder.HasOne(s => s.Tenant)
            .WithMany()
            .HasForeignKey(s => s.TenantId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(s => s.Categoria)
            .WithMany(c => c.Subcategorias)
            .HasForeignKey(s => s.CategoriaId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public class PrioridadConfiguration : IEntityTypeConfiguration<Prioridad>
{
    public void Configure(EntityTypeBuilder<Prioridad> builder)
    {
        builder.HasKey(p => p.Id);
        builder.Property(p => p.Nombre).HasMaxLength(100).IsRequired();
        builder.Property(p => p.Color).HasMaxLength(20).IsRequired();

        builder.HasOne(p => p.Tenant)
            .WithMany(t => t.Prioridades)
            .HasForeignKey(p => p.TenantId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

public class EstadoTicketConfiguration : IEntityTypeConfiguration<EstadoTicket>
{
    public void Configure(EntityTypeBuilder<EstadoTicket> builder)
    {
        builder.HasKey(e => e.Id);
        builder.Property(e => e.Nombre).HasMaxLength(100).IsRequired();
        builder.Property(e => e.Color).HasMaxLength(20).IsRequired();
    }
}

public class SLAConfiguracionConfiguration : IEntityTypeConfiguration<SLAConfiguracion>
{
    public void Configure(EntityTypeBuilder<SLAConfiguracion> builder)
    {
        builder.HasKey(s => s.Id);

        builder.HasOne(s => s.Tenant)
            .WithMany()
            .HasForeignKey(s => s.TenantId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(s => s.Prioridad)
            .WithMany(p => p.SLAConfiguraciones)
            .HasForeignKey(s => s.PrioridadId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(s => s.Categoria)
            .WithMany(c => c.SLAConfiguraciones)
            .HasForeignKey(s => s.CategoriaId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
