# RetailHub Git Workflow & Ownership

## 1. Branch Strategy

| Branch | Owner | Purpose |
| --- | --- | --- |
| `main` | Technical Lead (maintainer) | Always buildable integration branch; protected by PRs |
| `feature/backend` | Developer 1 (Technical Lead) | ASP.NET Core Web API, EF Core, Identity, JWT, migrations |
| `feature/customer-portal` | Developer 2 | Customer storefront, search/filter, cart, checkout, order history |
| `feature/admin-portal` | Developer 3 | Admin dashboard, brands, categories, products, inventory, orders |

Create short-lived sub-branches from your feature branch if needed, and merge back via Pull Request.

## 2. File & Folder Ownership

| Path | Owner | Rule |
| --- | --- | --- |
| `backend/**` | Developer 1 (Technical Lead) | Only Tech Lead modifies backend & migrations |
| `database/**` | Developer 1 (Technical Lead) | Only Tech Lead modifies DB scripts & docs |
| `docs/API_CONTRACT.md` | Developer 1 (Technical Lead) | Frozen after Phase 1 review; changes require team sync |
| `frontend/.../src/app/core/**` | Developer 1 (or assigned shared owner) | Coordinate before changing models, guards, interceptors, services |
| `frontend/.../src/app/shared/**` | Developer 1 (or assigned shared owner) | Coordinate before editing shared components |
| `frontend/.../src/app/features/customer/**` | Developer 2 | Exclusive ownership for Customer Portal |
| `frontend/.../src/app/features/admin/**` | Developer 3 | Exclusive ownership for Admin Portal |

## 3. Non-Negotiable Repository Rules

1. **Pull Requests Required:** All merges into `main` must go through a GitHub Pull Request reviewed by the Technical Lead.
2. **No Direct `main` Commits:** Never commit directly to `main` during feature development.
3. **No Force Pushes:** Never run `git push --force` on `main` or shared branches.
4. **Small, Focused Commits:** Commit small working increments with clear messages (e.g., `feat(customer): add product search and filter bar`).
5. **No Committed Secrets:** Never commit JWT keys, SQL passwords, `.env` files, or `secrets.json`.
6. **Shared File Coordination:** Announce in team chat before editing `app.routes.ts`, `styles.css`, `core/`, or `shared/`.
7. **No Independent API Contract Changes:** Frontend developers must not assume undocumented fields; backend must not rename contract fields without updating `docs/API_CONTRACT.md` and notifying the team.

## 4. Recommended Sync Cycle (3-Hour Hackathon)

```powershell
# Pull latest main into your feature branch frequently
git checkout feature/customer-portal
git fetch origin
git merge origin/main
```

Resolve conflicts locally on your feature branch, verify `npm run build`, and then open or update your Pull Request.
