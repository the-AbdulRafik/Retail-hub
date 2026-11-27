using RetailHub.Api.Entities;

namespace RetailHub.Api.Repositories.Interfaces;

public interface ICategoryRepository
{
    Task<IReadOnlyList<Category>> GetAllAsync(bool includeInactive, CancellationToken cancellationToken = default);
    Task<Category?> GetByIdAsync(int id, bool includeInactive, CancellationToken cancellationToken = default);
    Task<Category?> GetTrackedByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<bool> ExistsByNameAsync(string name, int? excludeId = null, CancellationToken cancellationToken = default);
    Task<Category> AddAsync(Category category, CancellationToken cancellationToken = default);
    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}
