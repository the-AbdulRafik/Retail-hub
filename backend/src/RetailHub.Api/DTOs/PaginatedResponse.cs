namespace RetailHub.Api.DTOs;

public sealed record PaginatedResponse<T>(
    IReadOnlyList<T> Items,
    int CurrentPage,
    int PageSize,
    int TotalCount,
    int TotalPages,
    bool HasPreviousPage,
    bool HasNextPage)
{
    public static PaginatedResponse<T> Create(
        IReadOnlyList<T> items,
        int currentPage,
        int pageSize,
        int totalCount)
    {
        var totalPages = totalCount == 0
            ? 0
            : (int)Math.Ceiling(totalCount / (double)pageSize);

        return new PaginatedResponse<T>(
            items,
            currentPage,
            pageSize,
            totalCount,
            totalPages,
            currentPage > 1 && totalPages > 0,
            currentPage < totalPages);
    }
}
