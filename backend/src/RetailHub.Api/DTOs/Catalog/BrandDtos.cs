using System.ComponentModel.DataAnnotations;

namespace RetailHub.Api.DTOs.Catalog;

public sealed class CreateBrandRequest
{
    [Required]
    [StringLength(100, MinimumLength = 1)]
    public string Name { get; set; } = string.Empty;

    [StringLength(500)]
    public string? Description { get; set; }
}

public sealed class UpdateBrandRequest
{
    [Required]
    [StringLength(100, MinimumLength = 1)]
    public string Name { get; set; } = string.Empty;

    [StringLength(500)]
    public string? Description { get; set; }

    public bool IsActive { get; set; } = true;
}

public sealed record BrandResponse(
    int Id,
    string Name,
    string? Description,
    bool IsActive);
