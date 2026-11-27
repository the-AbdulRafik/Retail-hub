# RetailHub Database Design

## 1. Overview

RetailHub uses **Microsoft SQL Server** with **EF Core Code-First** and **ASP.NET Core Identity** (`IdentityDbContext<ApplicationUser>`).

Design rules:
- Shopping cart state lives in the Angular client only; no cart tables exist.
- Product packaging (`PackagingType`, `PackagingSize`) lives directly on `Product`; no variant tables exist.
- Deletions on catalog entities (`Brand`, `Category`, `Product`) use soft deletion (`IsActive = false`).
- Historical order deletion is restricted at the database foreign-key level (`DeleteBehavior.Restrict`).

## 2. Entity Relationship Summary

```text
ApplicationUser (1) ──< (N) Order (1) ──< (N) OrderItem (N) >── (1) Product
                                                                      │
Brand (1) ──< (N) Product >── (1) Category ───────────────────────────┘
```

All business foreign keys use `DeleteBehavior.Restrict` (`ON DELETE NO ACTION` in SQL Server) to prevent accidental cascade deletion of orders or referenced catalog records.

## 3. Tables & Columns

### 3.1 `AspNetUsers` (`ApplicationUser : IdentityUser`)

Inherits all standard ASP.NET Core Identity columns (`Id`, `UserName`, `Email`, `PasswordHash`, etc.) with unique email enforced.

| Column | SQL Type | Constraints | Notes |
| --- | --- | --- | --- |
| `Id` | `nvarchar(450)` | PK | Identity user ID |
| `DisplayName` | `nvarchar(100)` | `NOT NULL` | Display name shown in UI and order views |

### 3.2 `Brands` (`Brand`)

| Column | SQL Type | Constraints | Notes |
| --- | --- | --- | --- |
| `Id` | `int` | PK, `IDENTITY` | |
| `Name` | `nvarchar(100)` | `NOT NULL`, `UNIQUE` (`IX_Brands_Name`) | |
| `Description` | `nvarchar(500)` | `NULL` | |
| `IsActive` | `bit` | `NOT NULL`, `DEFAULT 1` | Soft-delete flag |

### 3.3 `Categories` (`Category`)

Initial retail domain categories: **Pizza**, **Cold Drinks**, **Breads**.

| Column | SQL Type | Constraints | Notes |
| --- | --- | --- | --- |
| `Id` | `int` | PK, `IDENTITY` | |
| `Name` | `nvarchar(100)` | `NOT NULL`, `UNIQUE` (`IX_Categories_Name`) | |
| `Description` | `nvarchar(500)` | `NULL` | |
| `IsActive` | `bit` | `NOT NULL`, `DEFAULT 1` | Soft-delete flag |

### 3.4 `Products` (`Product`)

| Column | SQL Type | Constraints | Notes |
| --- | --- | --- | --- |
| `Id` | `int` | PK, `IDENTITY` | |
| `Name` | `nvarchar(150)` | `NOT NULL` | |
| `Description` | `nvarchar(1000)` | `NULL` | |
| `Price` | `decimal(18,2)` | `NOT NULL`, `CHECK ([Price] >= 0)` | Server-authoritative unit price |
| `ImageUrl` | `nvarchar(500)` | `NULL` | |
| `BrandId` | `int` | `NOT NULL`, FK -> `Brands(Id)` (`Restrict`) | |
| `CategoryId` | `int` | `NOT NULL`, FK -> `Categories(Id)` (`Restrict`) | |
| `PackagingType` | `nvarchar(60)` | `NOT NULL` | e.g., `Box`, `Bottle`, `Can`, `Loaf`, `Pack` |
| `PackagingSize` | `nvarchar(60)` | `NOT NULL` | e.g., `Large 12"`, `500 ml`, `400 g` |
| `StockQuantity` | `int` | `NOT NULL`, `CHECK ([StockQuantity] >= 0)` | |
| `ReorderLevel` | `int` | `NOT NULL`, `CHECK ([ReorderLevel] >= 0)` | Low-stock threshold |
| `IsActive` | `bit` | `NOT NULL`, `DEFAULT 1` | Soft-delete flag |
| `RowVersion` | `rowversion` | `NOT NULL`, Concurrency token | Optimistic concurrency |
| `CreatedAt` | `datetime2` | `NOT NULL`, `DEFAULT GETUTCDATE()` | UTC timestamp |

### 3.5 `Orders` (`Order`)

| Column | SQL Type | Constraints | Notes |
| --- | --- | --- | --- |
| `Id` | `int` | PK, `IDENTITY` | |
| `UserId` | `nvarchar(450)` | `NOT NULL`, FK -> `AspNetUsers(Id)` (`Restrict`) | Customer ID |
| `OrderNumber` | `nvarchar(32)` | `NOT NULL`, `UNIQUE` (`IX_Orders_OrderNumber`) | e.g., `ORD-20261127-0001` |
| `TotalAmount` | `decimal(18,2)` | `NOT NULL`, `CHECK ([TotalAmount] >= 0)` | Computed server-side |
| `Status` | `nvarchar(30)` | `NOT NULL`, `CHECK ([Status] IN ('Pending', 'Confirmed', 'Preparing', 'OutForDelivery', 'Delivered', 'Cancelled'))` | Stored as string from `OrderStatus` enum |
| `CreatedAt` | `datetime2` | `NOT NULL`, `DEFAULT GETUTCDATE()` | UTC timestamp |

### 3.6 `OrderItems` (`OrderItem`)

Stores point-in-time snapshots of product name, unit price, and packaging details so historical orders never drift when catalog records change.

| Column | SQL Type | Constraints | Notes |
| --- | --- | --- | --- |
| `Id` | `int` | PK, `IDENTITY` | |
| `OrderId` | `int` | `NOT NULL`, FK -> `Orders(Id)` (`Restrict`) | |
| `ProductId` | `int` | `NOT NULL`, FK -> `Products(Id)` (`Restrict`) | |
| `ProductName` | `nvarchar(150)` | `NOT NULL` | Snapshot at checkout |
| `UnitPrice` | `decimal(18,2)` | `NOT NULL`, `CHECK ([UnitPrice] >= 0)` | Snapshot at checkout |
| `Quantity` | `int` | `NOT NULL`, `CHECK ([Quantity] > 0)` | |
| `PackagingDetails` | `nvarchar(130)` | `NOT NULL` | e.g., `Box - Large 12"` |

## 4. Indexes

| Table | Index Name | Columns | Purpose |
| --- | --- | --- | --- |
| `Brands` | `IX_Brands_Name` | `Name` (Unique) | Prevent duplicate brands & fast lookup |
| `Brands` | `IX_Brands_IsActive` | `IsActive` | Active catalog filtering |
| `Categories` | `IX_Categories_Name` | `Name` (Unique) | Prevent duplicate categories & fast lookup |
| `Categories` | `IX_Categories_IsActive` | `IsActive` | Active catalog filtering |
| `Products` | `IX_Products_Name` | `Name` | Search & name sorting |
| `Products` | `IX_Products_CategoryId_IsActive` | `CategoryId, IsActive` | Category filter queries |
| `Products` | `IX_Products_BrandId_IsActive` | `BrandId, IsActive` | Brand filter queries |
| `Products` | `IX_Products_IsActive_Price` | `IsActive, Price` | Price range & sorting |
| `Products` | `IX_Products_IsActive_StockQuantity` | `IsActive, StockQuantity` | Inventory & low-stock alerts |
| `Orders` | `IX_Orders_OrderNumber` | `OrderNumber` (Unique) | Order lookup |
| `Orders` | `IX_Orders_UserId_CreatedAt` | `UserId, CreatedAt` | Customer order history |
| `Orders` | `IX_Orders_Status_CreatedAt` | `Status, CreatedAt` | Admin order management |
| `OrderItems` | `IX_OrderItems_OrderId` | `OrderId` | Order detail joins |
| `OrderItems` | `IX_OrderItems_ProductId` | `ProductId` | Sales stats & FK lookup |

## 5. Querying, Concurrency & Checkout Mechanics

1. **Server-Side Pagination**: Defaults `Page = 1`, `PageSize = 10`, capped at `MaxPageSize = 50` (`DTOs/PaginationQuery.cs`).
2. **Read-Only Queries**: All catalog, inventory, and order read queries use `.AsNoTracking()`.
3. **Sorting Whitelist**: `GET /api/products` maps `sortBy` through an explicit `switch` expression (`name`, `price`, `createdAt`, `stockQuantity`) so arbitrary property strings are rejected.
4. **Optimistic Concurrency**: `Product.RowVersion` (`rowversion`) detects concurrent admin inventory/product edits and returns `409 Conflict` on `DbUpdateConcurrencyException`.
5. **Atomic Checkout Transaction**: `POST /api/orders` opens a database transaction (`BeginTransactionAsync`), executes an atomic stock decrement (`UPDATE Products SET StockQuantity = StockQuantity - @qty WHERE Id = @id AND IsActive = 1 AND StockQuantity >= @qty` or `ExecuteUpdateAsync` with row-count check), computes line totals from database prices, inserts `Order` + `OrderItems`, and commits or rolls back on insufficient stock.
