using RetailHub.Api.DTOs.Catalog;

namespace RetailHub.Api.Services.Interfaces;

public interface ICategoryService
{
    Task<IReadOnlyList<CategoryResponse>> GetAllAsync(bool includeInactive, CancellationToken cancellationToken = default);
    Task<CategoryResponse> GetByIdAsync(int id, bool includeInactive, CancellationToken cancellationToken = default);
    Task<CategoryResponse> CreateAsync(CreateCategoryRequest request, CancellationToken cancellationToken = default);
    Task<CategoryResponse> UpdateAsync(int id, UpdateCategoryRequest request, CancellationToken cancellationToken = default);
    Task DeactivateAsync(int id, CancellationToken cancellationToken = default);
}
