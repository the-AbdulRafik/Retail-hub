# RetailHub API Contract

> **Status:** Implemented MVP Specification — Interactive docs available at `/scalar/v1` and OpenAPI JSON at `/openapi/v1.json` in Development.

## 1. Conventions

- **Base URL (Development):** `https://localhost:7090` / `http://localhost:5266`
- **Content-Type:** `application/json`
- **Authentication:** Bearer JWT in `Authorization: Bearer <token>` header.
- **Roles:** `Customer`, `Admin`
- **Timestamps:** ISO-8601 UTC strings (e.g., `2026-11-27T10:30:00Z`).
- **Pagination Defaults:** `page = 1`, `pageSize = 10`, max `pageSize = 50`. Invalid `page < 1` or `pageSize` outside `1..50` returns `400 Bad Request`.

### Standard Paginated Response Envelope

```json
{
  "items": [],
  "currentPage": 1,
  "pageSize": 10,
  "totalCount": 25,
  "totalPages": 3,
  "hasPreviousPage": false,
  "hasNextPage": true
}
```

### Standard Error Format (`ProblemDetails`)

Single error or domain failure:

```json
{
  "type": "https://tools.ietf.org/html/rfc9110#section-15.5.1",
  "title": "Insufficient stock",
  "status": 409,
  "detail": "Product 'Margherita Pizza' has only 2 unit(s) available.",
  "traceId": "00-..."
}
```

Validation failure (`400 Bad Request`):

```json
{
  "type": "https://tools.ietf.org/html/rfc9110#section-15.5.1",
  "title": "One or more validation errors occurred.",
  "status": 400,
  "errors": {
    "Price": ["Price must be greater than or equal to 0."]
  },
  "traceId": "00-..."
}
```

---

## 2. Health Endpoint

### `GET /api/health`
- **Auth:** Public (`AllowAnonymous`)
- **200 OK:**
```json
{
  "status": "ok",
  "service": "RetailHub.Api",
  "timestamp": "2026-11-27T10:30:00Z"
}
```

---

## 3. Authentication Endpoints

### `POST /api/auth/register`
- **Auth:** Public
- **Request JSON:**
```json
{
  "displayName": "Abdul Rafik",
  "email": "abdul@example.com",
  "password": "Password123"
}
```
- **Validation:**
  - `displayName`: required, 2–100 chars.
  - `email`: required, valid email format, unique.
  - `password`: required, min 8 chars, at least 1 digit.
- **201 Created:**
```json
{
  "token": "<jwt-token>",
  "expiresAt": "2026-11-27T11:30:00Z",
  "user": {
    "id": "user-guid",
    "displayName": "Abdul Rafik",
    "email": "abdul@example.com",
    "roles": ["Customer"]
  }
}
```
- **Status Codes:** `201 Created`, `400 Bad Request` (validation), `409 Conflict` (email already exists).

### `POST /api/auth/login`
- **Auth:** Public
- **Request JSON:**
```json
{
  "email": "abdul@example.com",
  "password": "Password123"
}
```
- **Validation:** `email` required, `password` required.
- **200 OK:** Same payload shape as `register` (`token`, `expiresAt`, `user`).
- **Status Codes:** `200 OK`, `400 Bad Request`, `401 Unauthorized` (invalid credentials).

### `GET /api/auth/me`
- **Auth:** Authenticated (`Customer` or `Admin`)
- **200 OK:**
```json
{
  "id": "user-guid",
  "displayName": "Abdul Rafik",
  "email": "abdul@example.com",
  "roles": ["Customer"]
}
```
- **Status Codes:** `200 OK`, `401 Unauthorized`.

---

## 4. Brand Endpoints

### `GET /api/brands`
- **Auth:** Public (inactive brands returned only when `includeInactive=true` by an `Admin`)
- **Query Parameters:**
  - `includeInactive` (`bool`, optional, default `false`; ignored unless caller is `Admin`)
- **200 OK:**
```json
[
  {
    "id": 1,
    "name": "OvenCraft",
    "description": "Artisan pizzas and breads",
    "isActive": true
  }
]
```
- **Status Codes:** `200 OK`.

### `GET /api/brands/{id}`
- **Auth:** Public (inactive brand visible only to `Admin`)
- **Path Parameters:** `id` (`int`)
- **200 OK:** Single brand object (`id`, `name`, `description`, `isActive`).
- **Status Codes:** `200 OK`, `404 Not Found`.

### `POST /api/brands`
- **Auth:** `Admin`
- **Request JSON:**
```json
{
  "name": "OvenCraft",
  "description": "Artisan pizzas and breads"
}
```
- **Validation:** `name` required, 1–100 chars, unique; `description` max 500 chars.
- **201 Created:** Returns created brand object (`id`, `name`, `description`, `isActive`).
- **Status Codes:** `201 Created`, `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `409 Conflict` (duplicate name).

### `PUT /api/brands/{id}`
- **Auth:** `Admin`
- **Path Parameters:** `id` (`int`)
- **Request JSON:**
```json
{
  "name": "OvenCraft Bakery",
  "description": "Updated description",
  "isActive": true
}
```
- **Validation:** `name` required, 1–100 chars, unique; `description` max 500 chars.
- **200 OK:** Returns updated brand object.
- **Status Codes:** `200 OK`, `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `409 Conflict`.

### `DELETE /api/brands/{id}`
- **Auth:** `Admin`
- **Behavior:** Soft delete (`IsActive = false`).
- **Path Parameters:** `id` (`int`)
- **204 No Content**
- **Status Codes:** `204 No Content`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`.

---

## 5. Category Endpoints

### `GET /api/categories`
- **Auth:** Public (`includeInactive=true` honored for `Admin` only)
- **Query Parameters:** `includeInactive` (`bool`, optional, default `false`)
- **200 OK:**
```json
[
  {
    "id": 1,
    "name": "Pizza",
    "description": "Fresh baked and frozen pizzas",
    "isActive": true
  }
]
```
- **Status Codes:** `200 OK`.

### `GET /api/categories/{id}`
- **Auth:** Public (inactive category visible only to `Admin`)
- **Path Parameters:** `id` (`int`)
- **200 OK:** Single category object (`id`, `name`, `description`, `isActive`).
- **Status Codes:** `200 OK`, `404 Not Found`.

### `POST /api/categories`
- **Auth:** `Admin`
- **Request JSON:**
```json
{
  "name": "Pizza",
  "description": "Fresh baked and frozen pizzas"
}
```
- **Validation:** `name` required, 1–100 chars, unique; `description` max 500 chars.
- **201 Created:** Returns created category object.
- **Status Codes:** `201 Created`, `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `409 Conflict`.

### `PUT /api/categories/{id}`
- **Auth:** `Admin`
- **Path Parameters:** `id` (`int`)
- **Request JSON:**
```json
{
  "name": "Pizza",
  "description": "Updated category description",
  "isActive": true
}
```
- **200 OK:** Returns updated category object.
- **Status Codes:** `200 OK`, `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `409 Conflict`.

### `DELETE /api/categories/{id}`
- **Auth:** `Admin`
- **Behavior:** Soft delete (`IsActive = false`).
- **204 No Content**
- **Status Codes:** `204 No Content`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`.

---

## 6. Product Endpoints

### `GET /api/products`
- **Auth:** Public (`includeInactive=true` honored for `Admin` only)
- **Query Parameters:**
  - `page` (`int`, default `1`, min `1`)
  - `pageSize` (`int`, default `10`, min `1`, max `50`)
  - `search` (`string`, optional; matches product name or description)
  - `categoryId` (`int`, optional)
  - `brandId` (`int`, optional)
  - `packagingType` (`string`, optional)
  - `minPrice` (`decimal`, optional, `>= 0`)
  - `maxPrice` (`decimal`, optional, `>= 0`)
  - `inStockOnly` (`bool`, optional, default `false`)
  - `includeInactive` (`bool`, optional, default `false`, `Admin` only)
  - `sortBy` (`string`, optional whitelist: `name`, `price`, `createdAt`, `stockQuantity`; default `name`)
  - `sortOrder` (`string`, optional whitelist: `asc`, `desc`; default `asc`)
- **200 OK:**
```json
{
  "items": [
    {
      "id": 10,
      "name": "Margherita Classic Pizza",
      "description": "Stone-baked mozzarella and basil pizza",
      "price": 12.99,
      "imageUrl": "https://example.com/images/margherita.jpg",
      "brandId": 1,
      "brandName": "OvenCraft",
      "categoryId": 1,
      "categoryName": "Pizza",
      "packagingType": "Box",
      "packagingSize": "Large 12\"",
      "stockQuantity": 24,
      "reorderLevel": 5,
      "isActive": true,
      "rowVersion": "AAAAAAAAB9E=",
      "createdAt": "2026-11-27T09:00:00Z"
    }
  ],
  "currentPage": 1,
  "pageSize": 10,
  "totalCount": 1,
  "totalPages": 1,
  "hasPreviousPage": false,
  "hasNextPage": false
}
```
- **Status Codes:** `200 OK`, `400 Bad Request` (invalid sort field or invalid price range).

### `GET /api/products/{id}`
- **Auth:** Public (inactive product visible only to `Admin`)
- **Path Parameters:** `id` (`int`)
- **200 OK:** Single product object (same shape as item above).
- **Status Codes:** `200 OK`, `404 Not Found`.

### `POST /api/products`
- **Auth:** `Admin`
- **Request JSON:**
```json
{
  "name": "Margherita Classic Pizza",
  "description": "Stone-baked mozzarella and basil pizza",
  "price": 12.99,
  "imageUrl": "https://example.com/images/margherita.jpg",
  "brandId": 1,
  "categoryId": 1,
  "packagingType": "Box",
  "packagingSize": "Large 12\"",
  "stockQuantity": 24,
  "reorderLevel": 5
}
```
- **Validation:**
  - `name`: required, 1–150 chars.
  - `description`: max 1000 chars.
  - `price`: `>= 0`.
  - `imageUrl`: optional valid URL, max 500 chars.
  - `brandId`, `categoryId`: must reference active `Brand` and `Category`.
  - `packagingType`: required, max 60 chars.
  - `packagingSize`: required, max 60 chars.
  - `stockQuantity`: `>= 0`.
  - `reorderLevel`: `>= 0`.
- **201 Created:** Created product object.
- **Status Codes:** `201 Created`, `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`.

### `PUT /api/products/{id}`
- **Auth:** `Admin`
- **Path Parameters:** `id` (`int`)
- **Request JSON:** Same fields as `POST`, plus `isActive` (`bool`) and `rowVersion` (`string`, Base64 concurrency token).
- **Validation:** Same as `POST`; `rowVersion` required for optimistic concurrency check.
- **200 OK:** Updated product object with refreshed `rowVersion`.
- **Status Codes:** `200 OK`, `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `409 Conflict` (stale `rowVersion`).

### `DELETE /api/products/{id}`
- **Auth:** `Admin`
- **Behavior:** Soft delete (`IsActive = false`).
- **204 No Content**
- **Status Codes:** `204 No Content`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`.

---

## 7. Inventory Endpoints

### `GET /api/inventory`
- **Auth:** `Admin`
- **Query Parameters:**
  - `page` (`int`, default `1`)
  - `pageSize` (`int`, default `10`, max `50`)
  - `lowStockOnly` (`bool`, optional, default `false` — filters `StockQuantity <= ReorderLevel`)
  - `search` (`string`, optional)
- **200 OK:** Paginated list of inventory items:
```json
{
  "items": [
    {
      "productId": 10,
      "productName": "Margherita Classic Pizza",
      "brandName": "OvenCraft",
      "categoryName": "Pizza",
      "packagingType": "Box",
      "packagingSize": "Large 12\"",
      "stockQuantity": 4,
      "reorderLevel": 5,
      "isLowStock": true,
      "isActive": true,
      "rowVersion": "AAAAAAAAB9E="
    }
  ],
  "currentPage": 1,
  "pageSize": 10,
  "totalCount": 1,
  "totalPages": 1,
  "hasPreviousPage": false,
  "hasNextPage": false
}
```
- **Status Codes:** `200 OK`, `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`.

### `GET /api/inventory/{productId}`
- **Auth:** `Admin`
- **Path Parameters:** `productId` (`int`)
- **200 OK:** Single inventory item (same shape as item above).
- **Status Codes:** `200 OK`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`.

### `PUT /api/inventory/{productId}`
- **Auth:** `Admin`
- **Path Parameters:** `productId` (`int`)
- **Request JSON:**
```json
{
  "stockQuantity": 50,
  "reorderLevel": 10,
  "rowVersion": "AAAAAAAAB9E="
}
```
- **Validation:** `stockQuantity >= 0`, `reorderLevel >= 0`, `rowVersion` required.
- **200 OK:** Updated inventory item with new `rowVersion`.
- **Status Codes:** `200 OK`, `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `409 Conflict` (stale `rowVersion`).

---

## 8. Order Endpoints

### `POST /api/orders`
- **Auth:** Authenticated (`Customer` or `Admin`)
- **Security Rule:** Request accepts **only** `productId` and `quantity`. Unit prices, packaging snapshots, and order totals are computed exclusively on the server inside a database transaction with atomic stock decrement.
- **Request JSON:**
```json
{
  "items": [
    { "productId": 10, "quantity": 2 },
    { "productId": 15, "quantity": 3 }
  ]
}
```
- **Validation:**
  - `items`: required, non-empty, no duplicate `productId` entries (or server aggregates).
  - `quantity`: integer `> 0`.
  - Every `productId` must exist, be `IsActive = true`, and have `StockQuantity >= quantity`.
- **201 Created:**
```json
{
  "id": 101,
  "orderNumber": "ORD-20261127-0101",
  "userId": "user-guid",
  "customerName": "Abdul Rafik",
  "totalAmount": 31.95,
  "status": "Pending",
  "createdAt": "2026-11-27T10:45:00Z",
  "items": [
    {
      "id": 201,
      "productId": 10,
      "productName": "Margherita Classic Pizza",
      "unitPrice": 12.99,
      "quantity": 2,
      "packagingDetails": "Box - Large 12\"",
      "lineTotal": 25.98
    }
  ]
}
```
- **Status Codes:** `201 Created`, `400 Bad Request`, `401 Unauthorized`, `404 Not Found` (unknown/inactive product), `409 Conflict` (insufficient stock).

### `GET /api/orders/my`
- **Auth:** Authenticated (`Customer` or `Admin`)
- **Query Parameters:** `page` (`1`), `pageSize` (`10`, max `50`), `status` (optional `OrderStatus`), `search` (optional `OrderNumber`).
- **200 OK:** `PaginatedResponse<OrderResponse>` owned by the current authenticated user (newest first).
- **Status Codes:** `200 OK`, `400 Bad Request`, `401 Unauthorized`.

### `GET /api/orders/{id}`
- **Auth:** Authenticated; `Customer` may access **only** their own order, `Admin` may access any order.
- **Path Parameters:** `id` (`int`)
- **200 OK:** Full order object including `items`.
- **Status Codes:** `200 OK`, `401 Unauthorized`, `403 Forbidden` (order belongs to another user), `404 Not Found`.

### `GET /api/orders`
- **Auth:** `Admin`
- **Query Parameters:** `page` (`1`), `pageSize` (`10`, max `50`), `status` (optional), `search` (optional `OrderNumber` or customer name/email).
- **200 OK:** `PaginatedResponse<OrderResponse>` of all orders (newest first).
- **Status Codes:** `200 OK`, `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`.

### `PATCH /api/orders/{id}/status`
- **Auth:** `Admin`
- **Path Parameters:** `id` (`int`)
- **Request JSON:**
```json
{
  "status": "Confirmed"
}
```
- **Validation & State Transitions:**
  - `Pending` -> `Confirmed` or `Cancelled`
  - `Confirmed` -> `Preparing` or `Cancelled`
  - `Preparing` -> `OutForDelivery` or `Cancelled`
  - `OutForDelivery` -> `Delivered`
  - `Delivered` and `Cancelled` are terminal states.
  - Transitioning to `Cancelled` atomically restores `StockQuantity` for all order items inside a transaction.
- **200 OK:** Updated order object.
- **Status Codes:** `200 OK`, `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `409 Conflict` (invalid state transition).
