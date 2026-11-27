using System.ComponentModel.DataAnnotations;

namespace RetailHub.Api.DTOs.Inventory;

public sealed class InventoryQueryParameters : PaginationQuery
{
    public bool LowStockOnly { get; set; }

    [StringLength(100)]
    public string? Search { get; set; }
}

public sealed class UpdateInventoryRequest
{
    [Range(0, int.MaxValue, ErrorMessage = "StockQuantity must be greater than or equal to 0.")]
    public int StockQuantity { get; set; }

    [Range(0, int.MaxValue, ErrorMessage = "ReorderLevel must be greater than or equal to 0.")]
    public int ReorderLevel { get; set; }

    [Required]
    public string RowVersion { get; set; } = string.Empty;
}

public sealed record InventoryResponse(
    int ProductId,
    string ProductName,
    string BrandName,
    string CategoryName,
    string PackagingType,
    string PackagingSize,
    int StockQuantity,
    int ReorderLevel,
    bool IsLowStock,
    bool IsActive,
    string RowVersion);
