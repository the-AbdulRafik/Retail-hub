using RetailHub.Api.DTOs.Catalog;
using RetailHub.Api.DTOs.Inventory;
using RetailHub.Api.Entities;

namespace RetailHub.Api.Repositories.Interfaces;

public interface IProductRepository
{
    Task<(IReadOnlyList<Product> Items, int TotalCount)> GetPagedAsync(
        ProductQueryParameters query,
        bool includeInactive,
        CancellationToken cancellationToken = default);
    Task<(IReadOnlyList<Product> Items, int TotalCount)> GetInventoryPagedAsync(
        InventoryQueryParameters query,
        CancellationToken cancellationToken = default);
    Task<Product?> GetByIdAsync(int id, bool includeInactive, CancellationToken cancellationToken = default);
    Task<Product?> GetTrackedByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<bool> IsActiveBrandAsync(int brandId, CancellationToken cancellationToken = default);
    Task<bool> IsActiveCategoryAsync(int categoryId, CancellationToken cancellationToken = default);
    Task<Product> AddAsync(Product product, CancellationToken cancellationToken = default);
    Task<Product> UpdateAsync(Product product, byte[] expectedRowVersion, CancellationToken cancellationToken = default);
    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}
