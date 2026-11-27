using RetailHub.Api.Entities;

namespace RetailHub.Api.Repositories.Interfaces;

public interface IBrandRepository
{
    Task<IReadOnlyList<Brand>> GetAllAsync(bool includeInactive, CancellationToken cancellationToken = default);
    Task<Brand?> GetByIdAsync(int id, bool includeInactive, CancellationToken cancellationToken = default);
    Task<Brand?> GetTrackedByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<bool> ExistsByNameAsync(string name, int? excludeId = null, CancellationToken cancellationToken = default);
    Task<Brand> AddAsync(Brand brand, CancellationToken cancellationToken = default);
    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}
