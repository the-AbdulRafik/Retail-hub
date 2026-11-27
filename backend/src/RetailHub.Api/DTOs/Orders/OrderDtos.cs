using System.ComponentModel.DataAnnotations;
using RetailHub.Api.Entities;

namespace RetailHub.Api.DTOs.Orders;

public sealed class OrderItemRequest
{
    [Range(1, int.MaxValue, ErrorMessage = "ProductId must be greater than or equal to 1.")]
    public int ProductId { get; set; }

    [Range(1, int.MaxValue, ErrorMessage = "Quantity must be greater than or equal to 1.")]
    public int Quantity { get; set; }
}

public sealed class CreateOrderRequest
{
    [Required]
    [MinLength(1, ErrorMessage = "At least one order item is required.")]
    public List<OrderItemRequest> Items { get; set; } = new();
}

public sealed record OrderItemResponse(
    int Id,
    int ProductId,
    string ProductName,
    decimal UnitPrice,
    int Quantity,
    string PackagingDetails,
    decimal LineTotal);

public sealed record OrderResponse(
    int Id,
    string OrderNumber,
    string UserId,
    string CustomerName,
    decimal TotalAmount,
    string Status,
    DateTime CreatedAt,
    IReadOnlyList<OrderItemResponse> Items);

public sealed class OrderQueryParameters : PaginationQuery
{
    public OrderStatus? Status { get; set; }

    [StringLength(100)]
    public string? Search { get; set; }
}

public sealed class UpdateOrderStatusRequest
{
    [Required]
    public OrderStatus Status { get; set; }
}
