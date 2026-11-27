# RetailHub Hackathon Team Tasks (3-Hour Plan)

## Phase 1: Foundation & Alignment (Completed by Technical Lead)

- [x] Repository layout, `.gitignore`, `.editorconfig`
- [x] `.NET 10` Web API + EF Core SQL Server + Identity + Initial Migration
- [x] Angular standalone shell + `core/`, `shared/`, `features/` route placeholders
- [x] `docs/DATABASE_DESIGN.md`, `docs/API_CONTRACT.md`, `docs/STYLE_GUIDE.md`, `docs/COMPONENT_GUIDELINES.md`, `docs/GIT_WORKFLOW.md`
- [ ] **Team Checkpoint (10 min):** Review `API_CONTRACT.md` and `STYLE_GUIDE.md` together, create feature branches, and confirm local DB + dev servers run.

---

## Phase 2: Parallel Implementation Window

### Developer 1 – Technical Lead (`feature/backend` + `core/`)
1. Seed initial Identity roles (`Admin`, `Customer`), demo Admin account (via local config/user-secrets or dev seeder), and starter categories (`Pizza`, `Cold Drinks`, `Breads`) + sample brands/products.
2. Implement JWT token service + `AuthController` (`register`, `login`, `me`).
3. Implement `BrandsController`, `CategoriesController`, `ProductsController` (pagination, search, filters, sorting whitelist, `AsNoTracking`, `RowVersion` concurrency).
4. Implement `InventoryController` (`GET /api/inventory`, `PUT /api/inventory/{productId}`).
5. Implement `OrdersController` (`POST /api/orders` transactional checkout with atomic stock decrement, `GET /api/orders/my`, `GET /api/orders/{id}`, `GET /api/orders`, `PATCH /api/orders/{id}/status`).
6. Implement Angular `core/models/`, `core/services/auth.service.ts`, `core/interceptors/auth.interceptor.ts`, `core/guards/`, and `Auth` login/register pages.
7. Review PRs and maintain `main`.

### Developer 2 – Customer Portal (`feature/customer-portal`)
- Scope: `src/app/features/customer/**`
1. Client-side `CartService` (or signal store) for add/remove/quantity updates and cart total preview.
2. Product catalog page with search, category filter (`Pizza`, `Cold Drinks`, `Breads`), brand filter, price/sort controls, and server-side pagination.
3. Product detail view highlighting `PackagingType`, `PackagingSize`, stock status, and add-to-cart control.
4. Shopping cart & checkout page calling `POST /api/orders` (sending only `productId` and `quantity`) and handling `409 Conflict` stock errors cleanly.
5. Customer order history list & order detail view (`GET /api/orders/my`, `GET /api/orders/{id}`).

### Developer 3 – Admin Portal (`feature/admin-portal`)
- Scope: `src/app/features/admin/**`
1. Admin dashboard page showing summary business statistics (order counts, revenue, low-stock alerts).
2. Brand management CRUD + soft delete (`GET/POST/PUT/DELETE /api/brands`).
3. Category management CRUD + soft delete (`GET/POST/PUT/DELETE /api/categories`).
4. Product management CRUD with `PackagingType`, `PackagingSize`, `RowVersion` handling (`GET/POST/PUT/DELETE /api/products`).
5. Inventory management screen with low-stock filter (`GET /api/inventory`, `PUT /api/inventory/{productId}`).
6. Order management table & status updater (`GET /api/orders`, `PATCH /api/orders/{id}/status`).

---

## Phase 3: Integration & Demo Prep (Final 30–40 min)
1. Merge `feature/backend`, `feature/customer-portal`, and `feature/admin-portal` into `main` via PRs.
2. End-to-end smoke test: Register -> Browse/Filter Pizza/Cold Drinks/Breads -> Cart -> Checkout -> Verify DB stock decrement -> Admin updates order status -> Customer sees updated order status.
