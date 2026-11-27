using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RetailHub.Api.Entities;

namespace RetailHub.Api.Configurations;

public class ProductConfiguration : IEntityTypeConfiguration<Product>
{
    public void Configure(EntityTypeBuilder<Product> builder)
    {
        builder.ToTable("Products", t =>
        {
            t.HasCheckConstraint("CK_Products_Price_NonNegative", "[Price] >= 0");
            t.HasCheckConstraint("CK_Products_StockQuantity_NonNegative", "[StockQuantity] >= 0");
            t.HasCheckConstraint("CK_Products_ReorderLevel_NonNegative", "[ReorderLevel] >= 0");
        });

        builder.HasKey(p => p.Id);

        builder.Property(p => p.Name)
            .IsRequired()
            .HasMaxLength(150);

        builder.Property(p => p.Description)
            .HasMaxLength(1000);

        builder.Property(p => p.Price)
            .HasPrecision(18, 2);

        builder.Property(p => p.ImageUrl)
            .HasMaxLength(500);

        builder.Property(p => p.PackagingType)
            .IsRequired()
            .HasMaxLength(60);

        builder.Property(p => p.PackagingSize)
            .IsRequired()
            .HasMaxLength(60);

        builder.Property(p => p.IsActive)
            .HasDefaultValue(true)
            .HasSentinel(true);

        builder.Property(p => p.RowVersion)
            .IsRowVersion();

        builder.Property(p => p.CreatedAt)
            .HasDefaultValueSql("GETUTCDATE()");

        builder.HasOne(p => p.Brand)
            .WithMany(b => b.Products)
            .HasForeignKey(p => p.BrandId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(p => p.Category)
            .WithMany(c => c.Products)
            .HasForeignKey(p => p.CategoryId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(p => p.Name)
            .HasDatabaseName("IX_Products_Name");

        builder.HasIndex(p => new { p.CategoryId, p.IsActive })
            .HasDatabaseName("IX_Products_CategoryId_IsActive");

        builder.HasIndex(p => new { p.BrandId, p.IsActive })
            .HasDatabaseName("IX_Products_BrandId_IsActive");

        builder.HasIndex(p => new { p.IsActive, p.Price })
            .HasDatabaseName("IX_Products_IsActive_Price");

        builder.HasIndex(p => new { p.IsActive, p.StockQuantity })
            .HasDatabaseName("IX_Products_IsActive_StockQuantity");
    }
}
