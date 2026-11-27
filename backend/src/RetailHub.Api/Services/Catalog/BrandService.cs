using RetailHub.Api.Common;
using RetailHub.Api.DTOs.Catalog;
using RetailHub.Api.Entities;
using RetailHub.Api.Repositories.Interfaces;
using RetailHub.Api.Services.Interfaces;

namespace RetailHub.Api.Services.Catalog;

public sealed class BrandService(IBrandRepository brandRepository) : IBrandService
{
    public async Task<IReadOnlyList<BrandResponse>> GetAllAsync(bool includeInactive, CancellationToken cancellationToken = default)
    {
        var brands = await brandRepository.GetAllAsync(includeInactive, cancellationToken);
        return brands.Select(MapToResponse).ToList();
    }

    public async Task<BrandResponse> GetByIdAsync(int id, bool includeInactive, CancellationToken cancellationToken = default)
    {
        var brand = await brandRepository.GetByIdAsync(id, includeInactive, cancellationToken)
            ?? throw new NotFoundException($"Brand with id {id} was not found.");

        return MapToResponse(brand);
    }

    public async Task<BrandResponse> CreateAsync(CreateBrandRequest request, CancellationToken cancellationToken = default)
    {
        var name = request.Name.Trim();
        if (await brandRepository.ExistsByNameAsync(name, null, cancellationToken))
        {
            throw new ConflictException($"Brand '{name}' already exists.");
        }

        var brand = new Brand
        {
            Name = name,
            Description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim(),
            IsActive = true
        };

        var created = await brandRepository.AddAsync(brand, cancellationToken);
        return MapToResponse(created);
    }

    public async Task<BrandResponse> UpdateAsync(int id, UpdateBrandRequest request, CancellationToken cancellationToken = default)
    {
        var brand = await brandRepository.GetTrackedByIdAsync(id, cancellationToken)
            ?? throw new NotFoundException($"Brand with id {id} was not found.");

        var name = request.Name.Trim();
        if (await brandRepository.ExistsByNameAsync(name, id, cancellationToken))
        {
            throw new ConflictException($"Brand '{name}' already exists.");
        }

        brand.Name = name;
        brand.Description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim();
        brand.IsActive = request.IsActive;

        await brandRepository.SaveChangesAsync(cancellationToken);
        return MapToResponse(brand);
    }

    public async Task DeactivateAsync(int id, CancellationToken cancellationToken = default)
    {
        var brand = await brandRepository.GetTrackedByIdAsync(id, cancellationToken)
            ?? throw new NotFoundException($"Brand with id {id} was not found.");

        if (!brand.IsActive)
        {
            return;
        }

        brand.IsActive = false;
        await brandRepository.SaveChangesAsync(cancellationToken);
    }

    private static BrandResponse MapToResponse(Brand brand) => new(
        brand.Id,
        brand.Name,
        brand.Description,
        brand.IsActive);
}
