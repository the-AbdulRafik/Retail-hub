using System.ComponentModel.DataAnnotations;

namespace RetailHub.Api.DTOs.Catalog;

public sealed class CreateProductRequest
{
    [Required]
    [StringLength(150, MinimumLength = 1)]
    public string Name { get; set; } = string.Empty;

    [StringLength(1000)]
    public string? Description { get; set; }

    [Range(0, 999999.99)]
    public decimal Price { get; set; }

    [Url]
    [StringLength(500)]
    public string? ImageUrl { get; set; }

    [Range(1, int.MaxValue)]
    public int BrandId { get; set; }

    [Range(1, int.MaxValue)]
    public int CategoryId { get; set; }

    [Required]
    [StringLength(60, MinimumLength = 1)]
    public string PackagingType { get; set; } = string.Empty;

    [Required]
    [StringLength(60, MinimumLength = 1)]
    public string PackagingSize { get; set; } = string.Empty;

    [Range(0, int.MaxValue)]
    public int StockQuantity { get; set; }

    [Range(0, int.MaxValue)]
    public int ReorderLevel { get; set; }
}

public sealed class UpdateProductRequest
{
    [Required]
    [StringLength(150, MinimumLength = 1)]
    public string Name { get; set; } = string.Empty;

    [StringLength(1000)]
    public string? Description { get; set; }

    [Range(0, 999999.99)]
    public decimal Price { get; set; }

    [Url]
    [StringLength(500)]
    public string? ImageUrl { get; set; }

    [Range(1, int.MaxValue)]
    public int BrandId { get; set; }

    [Range(1, int.MaxValue)]
    public int CategoryId { get; set; }

    [Required]
    [StringLength(60, MinimumLength = 1)]
    public string PackagingType { get; set; } = string.Empty;

    [Required]
    [StringLength(60, MinimumLength = 1)]
    public string PackagingSize { get; set; } = string.Empty;

    [Range(0, int.MaxValue)]
    public int StockQuantity { get; set; }

    [Range(0, int.MaxValue)]
    public int ReorderLevel { get; set; }

    public bool IsActive { get; set; } = true;

    [Required]
    public string RowVersion { get; set; } = string.Empty;
}

public sealed record ProductResponse(
    int Id,
    string Name,
    string? Description,
    decimal Price,
    string? ImageUrl,
    int BrandId,
    string BrandName,
    int CategoryId,
    string CategoryName,
    string PackagingType,
    string PackagingSize,
    int StockQuantity,
    int ReorderLevel,
    bool IsActive,
    string RowVersion,
    DateTime CreatedAt);

public sealed class ProductQueryParameters : PaginationQuery
{
    [StringLength(100)]
    public string? Search { get; set; }

    [Range(1, int.MaxValue)]
    public int? CategoryId { get; set; }

    [Range(1, int.MaxValue)]
    public int? BrandId { get; set; }

    [StringLength(60)]
    public string? PackagingType { get; set; }

    [Range(0, 999999.99)]
    public decimal? MinPrice { get; set; }

    [Range(0, 999999.99)]
    public decimal? MaxPrice { get; set; }

    public bool InStockOnly { get; set; }
    public bool IncludeInactive { get; set; }
    public string SortBy { get; set; } = "name";
    public string SortOrder { get; set; } = "asc";
}
