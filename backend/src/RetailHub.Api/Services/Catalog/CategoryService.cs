using RetailHub.Api.Common;
using RetailHub.Api.DTOs.Catalog;
using RetailHub.Api.Entities;
using RetailHub.Api.Repositories.Interfaces;
using RetailHub.Api.Services.Interfaces;

namespace RetailHub.Api.Services.Catalog;

public sealed class CategoryService(ICategoryRepository categoryRepository) : ICategoryService
{
    public async Task<IReadOnlyList<CategoryResponse>> GetAllAsync(bool includeInactive, CancellationToken cancellationToken = default)
    {
        var categories = await categoryRepository.GetAllAsync(includeInactive, cancellationToken);
        return categories.Select(MapToResponse).ToList();
    }

    public async Task<CategoryResponse> GetByIdAsync(int id, bool includeInactive, CancellationToken cancellationToken = default)
    {
        var category = await categoryRepository.GetByIdAsync(id, includeInactive, cancellationToken)
            ?? throw new NotFoundException($"Category with id {id} was not found.");

        return MapToResponse(category);
    }

    public async Task<CategoryResponse> CreateAsync(CreateCategoryRequest request, CancellationToken cancellationToken = default)
    {
        var name = request.Name.Trim();
        if (await categoryRepository.ExistsByNameAsync(name, null, cancellationToken))
        {
            throw new ConflictException($"Category '{name}' already exists.");
        }

        var category = new Category
        {
            Name = name,
            Description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim(),
            IsActive = true
        };

        var created = await categoryRepository.AddAsync(category, cancellationToken);
        return MapToResponse(created);
    }

    public async Task<CategoryResponse> UpdateAsync(int id, UpdateCategoryRequest request, CancellationToken cancellationToken = default)
    {
        var category = await categoryRepository.GetTrackedByIdAsync(id, cancellationToken)
            ?? throw new NotFoundException($"Category with id {id} was not found.");

        var name = request.Name.Trim();
        if (await categoryRepository.ExistsByNameAsync(name, id, cancellationToken))
        {
            throw new ConflictException($"Category '{name}' already exists.");
        }

        category.Name = name;
        category.Description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim();
        category.IsActive = request.IsActive;

        await categoryRepository.SaveChangesAsync(cancellationToken);
        return MapToResponse(category);
    }

    public async Task DeactivateAsync(int id, CancellationToken cancellationToken = default)
    {
        var category = await categoryRepository.GetTrackedByIdAsync(id, cancellationToken)
            ?? throw new NotFoundException($"Category with id {id} was not found.");

        if (!category.IsActive)
        {
            return;
        }

        category.IsActive = false;
        await categoryRepository.SaveChangesAsync(cancellationToken);
    }

    private static CategoryResponse MapToResponse(Category category) => new(
        category.Id,
        category.Name,
        category.Description,
        category.IsActive);
}
