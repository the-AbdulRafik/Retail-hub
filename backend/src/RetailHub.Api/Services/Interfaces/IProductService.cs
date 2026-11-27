using RetailHub.Api.DTOs.Catalog;

namespace RetailHub.Api.Services.Interfaces;

public interface IProductService
{
    Task<IReadOnlyList<ProductResponse>> GetAllAsync(bool includeInactive, CancellationToken cancellationToken = default);
    Task<ProductResponse> GetByIdAsync(int id, bool includeInactive, CancellationToken cancellationToken = default);
    Task<ProductResponse> CreateAsync(CreateProductRequest request, CancellationToken cancellationToken = default);
    Task<ProductResponse> UpdateAsync(int id, UpdateProductRequest request, CancellationToken cancellationToken = default);
    Task DeactivateAsync(int id, CancellationToken cancellationToken = default);
}
