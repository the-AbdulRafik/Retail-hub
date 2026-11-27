using Microsoft.EntityFrameworkCore;
using RetailHub.Api.Common;
using RetailHub.Api.Data;
using RetailHub.Api.Entities;
using RetailHub.Api.Repositories.Interfaces;

namespace RetailHub.Api.Repositories;

public sealed class OrderRepository(ApplicationDbContext dbContext) : IOrderRepository
{
    public async Task<Order> CreateOrderTransactionAsync(
        string userId,
        IReadOnlyList<(int ProductId, int Quantity)> items,
        CancellationToken cancellationToken = default)
    {
        var orderedItems = items
            .OrderBy(i => i.ProductId)
            .ToList();

        var productIds = orderedItems.Select(i => i.ProductId).ToList();

        await using var transaction = await dbContext.Database.BeginTransactionAsync(cancellationToken);

        var products = await dbContext.Products
            .AsNoTracking()
            .Where(p => productIds.Contains(p.Id))
            .ToDictionaryAsync(p => p.Id, cancellationToken);

        var orderItems = new List<OrderItem>(orderedItems.Count);
        decimal totalAmount = 0m;

        foreach (var (productId, quantity) in orderedItems)
        {
            if (!products.TryGetValue(productId, out var product) || !product.IsActive)
            {
                throw new NotFoundException($"Active product with id {productId} was not found.");
            }

            var updatedRows = await dbContext.Products
                .Where(p => p.Id == productId && p.IsActive && p.StockQuantity >= quantity)
                .ExecuteUpdateAsync(
                    setters => setters.SetProperty(p => p.StockQuantity, p => p.StockQuantity - quantity),
                    cancellationToken);

            if (updatedRows == 0)
            {
                throw new ConflictException(
                    $"Insufficient stock for product '{product.Name}'. Requested {quantity}, available {product.StockQuantity}.");
            }

            var lineTotal = product.Price * quantity;
            totalAmount += lineTotal;

            orderItems.Add(new OrderItem
            {
                ProductId = product.Id,
                ProductName = product.Name,
                UnitPrice = product.Price,
                Quantity = quantity,
                PackagingDetails = $"{product.PackagingType} - {product.PackagingSize}"
            });
        }

        var order = new Order
        {
            UserId = userId,
            OrderNumber = $"ORD-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString("N")[..8].ToUpperInvariant()}",
            TotalAmount = totalAmount,
            Status = OrderStatus.Pending,
            CreatedAt = DateTime.UtcNow,
            OrderItems = orderItems
        };

        dbContext.Orders.Add(order);
        await dbContext.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);

        return await dbContext.Orders
            .AsNoTracking()
            .Include(o => o.User)
            .Include(o => o.OrderItems)
            .FirstAsync(o => o.Id == order.Id, cancellationToken);
    }
}
