using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RetailHub.Api.Entities;

namespace RetailHub.Api.Configurations;

public class BrandConfiguration : IEntityTypeConfiguration<Brand>
{
    public void Configure(EntityTypeBuilder<Brand> builder)
    {
        builder.ToTable("Brands");

        builder.HasKey(b => b.Id);

        builder.Property(b => b.Name)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(b => b.Description)
            .HasMaxLength(500);

        builder.Property(b => b.IsActive)
            .HasDefaultValue(true)
            .HasSentinel(true);

        builder.HasIndex(b => b.Name)
            .IsUnique()
            .HasDatabaseName("IX_Brands_Name");

        builder.HasIndex(b => b.IsActive)
            .HasDatabaseName("IX_Brands_IsActive");
    }
}
