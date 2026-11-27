using RetailHub.Api.DTOs;
using RetailHub.Api.DTOs.Catalog;

namespace RetailHub.Api.Services.Interfaces;

public interface IProductService
{
    Task<PaginatedResponse<ProductResponse>> GetPagedAsync(
        ProductQueryParameters queryParameters,
        bool canIncludeInactive,
        CancellationToken cancellationToken = default);
    Task<ProductResponse> GetByIdAsync(int id, bool includeInactive, CancellationToken cancellationToken = default);
    Task<ProductResponse> CreateAsync(CreateProductRequest request, CancellationToken cancellationToken = default);
    Task<ProductResponse> UpdateAsync(int id, UpdateProductRequest request, CancellationToken cancellationToken = default);
    Task DeactivateAsync(int id, CancellationToken cancellationToken = default);
}
