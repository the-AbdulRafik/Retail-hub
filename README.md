# RetailHub

RetailHub is a full-stack retail ordering platform for **Pizza**, **Cold Drinks**, and **Breads**, built with **Angular** (standalone architecture), **ASP.NET Core Web API (.NET 10)**, **EF Core**, **ASP.NET Core Identity + JWT**, and **Microsoft SQL Server**.

## Repository Structure

```text
RetailHub/
  frontend/
    retail-hub-ui/          # Angular standalone application (Customer + Admin portals)
  backend/
    RetailHub.sln
    src/
      RetailHub.Api/        # Single ASP.NET Core Web API project (.NET 10)
  database/
    README.md               # SQL Server setup (VS Code SQL Server extension + EF Core)
    scripts/                # Optional helper/verification SQL scripts
  docs/
    API_CONTRACT.md         # Canonical REST API specification
    DATABASE_DESIGN.md      # Schema, constraints, indexes, concurrency, pagination
    ARCHITECTURE.md         # System & layered architecture overview
    STYLE_GUIDE.md          # Proposed design tokens & UI conventions (needs team sign-off)
    COMPONENT_GUIDELINES.md # Frontend component structure & shared UI rules
    GIT_WORKFLOW.md         # Branching, PRs, and file ownership rules
    TEAM_TASKS.md           # Hackathon Phase 1 & Phase 2 task breakdown
```

## Quick Start

### Prerequisites

- [.NET 10 SDK](https://dotnet.microsoft.com/)
- [Node.js](https://nodejs.org/) (v20+) & npm
- Microsoft SQL Server (`SQLEXPRESS` or local SQL Server)
- VS Code with the **SQL Server (mssql)** extension (or any SQL client)

### Backend

```powershell
cd backend/src/RetailHub.Api
dotnet user-secrets set "Jwt:Key" "YOUR_LOCAL_32_CHAR_MIN_SECRET_KEY"
dotnet ef database update
dotnet run
```

### Frontend

```powershell
cd frontend/retail-hub-ui
npm install
npm start
```

## Documentation

- [API Contract](docs/API_CONTRACT.md)
- [Database Design](docs/DATABASE_DESIGN.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Style Guide](docs/STYLE_GUIDE.md)
- [Component Guidelines](docs/COMPONENT_GUIDELINES.md)
- [Git Workflow](docs/GIT_WORKFLOW.md)
- [Team Tasks](docs/TEAM_TASKS.md)
- [Database Setup](database/README.md)
