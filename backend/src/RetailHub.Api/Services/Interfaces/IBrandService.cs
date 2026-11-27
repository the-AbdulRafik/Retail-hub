using RetailHub.Api.DTOs.Catalog;

namespace RetailHub.Api.Services.Interfaces;

public interface IBrandService
{
    Task<IReadOnlyList<BrandResponse>> GetAllAsync(bool includeInactive, CancellationToken cancellationToken = default);
    Task<BrandResponse> GetByIdAsync(int id, bool includeInactive, CancellationToken cancellationToken = default);
    Task<BrandResponse> CreateAsync(CreateBrandRequest request, CancellationToken cancellationToken = default);
    Task<BrandResponse> UpdateAsync(int id, UpdateBrandRequest request, CancellationToken cancellationToken = default);
    Task DeactivateAsync(int id, CancellationToken cancellationToken = default);
}
