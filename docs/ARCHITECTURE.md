# RetailHub Architecture

## 1. Architectural Principles

RetailHub is structured for a **3-hour hackathon** with a **3-person team**:
- **Single backend project** (`RetailHub.Api`) with clear folder boundaries instead of multi-project overhead, MediatR, or CQRS.
- **Single Angular standalone application** (`retail-hub-ui`) housing both Customer and Admin portals under lazy-loaded feature routes.
- **Server-authoritative business logic**: prices, totals, stock availability, and role permissions are always enforced by the API.

## 2. System Topology

```text
┌─────────────────────────────┐         HTTPS / JSON + JWT         ┌──────────────────────────────┐
│   Angular SPA (Port 4200)   │ ─────────────────────────────────► │ ASP.NET Core Web API (.NET10)│
│  - /login, /register        │                                    │  - Controllers               │
│  - /customer (Dev 2)        │ ◄───────────────────────────────── │  - Services                  │
│  - /admin (Dev 3)           │                                    │  - EF Core + Identity        │
└─────────────────────────────┘                                    └──────────────┬───────────────┘
                                                                                  │
                                                                                  ▼
                                                                   ┌──────────────────────────────┐
                                                                   │ Microsoft SQL Server         │
                                                                   │ (localhost\SQLEXPRESS)       │
                                                                   └──────────────────────────────┘
```

## 3. Backend Structure (`backend/src/RetailHub.Api`)

- `Controllers/`: Thin HTTP endpoints handling route binding, `[Authorize]` attributes, and status codes.
- `Services/`: Business logic organized by domain (`Auth`, `Catalog`, `Inventory`, `Orders`) behind interfaces in `Services/Interfaces/`. Services interact directly with `ApplicationDbContext` (no redundant generic repository layer).
- `Entities/`: EF Core domain entities (`ApplicationUser`, `Brand`, `Category`, `Product`, `Order`, `OrderItem`, `OrderStatus`).
- `Configurations/`: Fluent API `IEntityTypeConfiguration<T>` classes for constraints, precision, indexes, and relationships.
- `Data/`: `ApplicationDbContext : IdentityDbContext<ApplicationUser>` and migrations.
- `DTOs/`: Request/response contracts and pagination primitives (`PaginationQuery`, `PagedResponse<T>`).
- `Middleware/`: Global exception handling converting unhandled errors and concurrency conflicts into consistent `ProblemDetails` JSON responses.

## 4. Frontend Structure (`frontend/retail-hub-ui/src/app`)

- `core/`:
  - `models/`: TypeScript interfaces matching `docs/API_CONTRACT.md`.
  - `services/`: HTTP API clients, `AuthService` (JWT token storage & role claims), and client-side `CartService` (signal/BehaviorSubject-based).
  - `guards/`: Route guards (`authGuard`, `adminGuard`, `guestGuard`).
  - `interceptors/`: `authInterceptor` attaching `Authorization: Bearer <token>` and handling `401`/`403`.
- `shared/`: Reusable UI components, pipes, and directives agreed upon by the team.
- `features/auth/`: Login and registration standalone pages.
- `features/customer/`: Lazy-loaded customer portal (`customer.routes.ts`) owned by Developer 2.
- `features/admin/`: Lazy-loaded admin portal (`admin.routes.ts`) owned by Developer 3.

## 5. Security & Secrets

- **Roles**: `Customer` and `Admin` seeded in Identity.
- **JWT**: Symmetric HMAC-SHA256 signing key supplied via `dotnet user-secrets` in development or environment variables in deployment. Never committed to Git.
- **Passwords**: Enforced by ASP.NET Core Identity password policy (minimum 8 characters, upper, lower, digit).
- **Order Integrity**: `POST /api/orders` ignores any client-submitted prices or totals and computes all amounts from the `Products` table inside a transaction.
