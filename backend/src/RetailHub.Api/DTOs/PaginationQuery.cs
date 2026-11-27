using System.ComponentModel.DataAnnotations;

namespace RetailHub.Api.DTOs;

public class PaginationQuery
{
    public const int DefaultPage = 1;
    public const int DefaultPageSize = 10;
    public const int MaxPageSize = 50;

    [Range(1, int.MaxValue, ErrorMessage = "Page must be greater than or equal to 1.")]
    public int Page { get; set; } = DefaultPage;

    [Range(1, MaxPageSize, ErrorMessage = "PageSize must be between 1 and 50.")]
    public int PageSize { get; set; } = DefaultPageSize;
}
