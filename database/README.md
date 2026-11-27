# RetailHub Database Setup

RetailHub uses **Microsoft SQL Server** managed via **EF Core Code-First Migrations** and inspected with the **VS Code SQL Server (`mssql`) extension** (no SSMS required).

## Default Local Connection

Configured in `backend/src/RetailHub.Api/appsettings.Development.json`:

```text
Server=localhost\SQLEXPRESS;Database=RetailHubDb;Trusted_Connection=True;Encrypt=True;TrustServerCertificate=True;
```

This matches the local `MSSQL$SQLEXPRESS` Windows service using Integrated Windows Authentication with `Encrypt=True` and `TrustServerCertificate=True`.

## Connecting with VS Code SQL Server Extension

1. Open the **SQL Server** sidebar panel in VS Code.
2. Add or reuse the connection profile:
   - **Server name:** `localhost\SQLEXPRESS`
   - **Authentication type:** `Integrated` (Windows Authentication)
   - **Database name:** `RetailHubDb` (leave blank initially before running migrations, or select after `dotnet ef database update`)
   - **Encrypt:** `Mandatory`
   - **Trust server certificate:** `true`
3. Run EF Core migrations to create the database and schema:

```powershell
cd backend/src/RetailHub.Api
dotnet ef database update
```

4. Refresh the connection in VS Code SQL Server extension to browse tables (`AspNetUsers`, `Brands`, `Categories`, `Products`, `Orders`, `OrderItems`), indexes, and constraints.

## Common EF Core Commands

Run from `backend/src/RetailHub.Api`:

```powershell
# Add a new migration
dotnet ef migrations add <MigrationName>

# Apply pending migrations to SQL Server
dotnet ef database update

# Remove the last unapplied migration
dotnet ef migrations remove

# Generate an idempotent SQL script for review or manual execution
dotnet ef migrations script --idempotent -o ../../../database/scripts/schema.sql
```

## Notes

- Do **not** commit credentials, personal connection overrides, or `.env` files.
- Keep custom verification/seed SQL scripts under `database/scripts/` if needed for team testing.
