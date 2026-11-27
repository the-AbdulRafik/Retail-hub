# RetailHub Style Guide (Proposed Defaults)

> **Proposal Status:** These design tokens and UI conventions are **proposed Phase 1 defaults**. Both frontend developers (**Developer 2 – Customer Portal** and **Developer 3 – Admin Portal**) must review and agree on any adjustments before Phase 2 UI implementation.

## 1. Proposed Design Tokens (`src/styles.css`)

### Colors

| Token | Proposed Value | Usage |
| --- | --- | --- |
| `--color-primary` | `#c2410c` | Primary brand actions, active links, warm food/retail accent |
| `--color-primary-hover` | `#9a3412` | Hover/active state for primary buttons |
| `--color-secondary` | `#1e293b` | Secondary actions, admin headers, dark neutral surfaces |
| `--color-success` | `#15803d` | In-stock badges, order delivered/confirmed states |
| `--color-warning` | `#b45309` | Low-stock warnings (`StockQuantity <= ReorderLevel`), pending states |
| `--color-danger` | `#b91c1c` | Out-of-stock, validation errors, destructive/cancel actions |
| `--color-bg` | `#f8fafc` | Page canvas background |
| `--color-surface` | `#ffffff` | Cards, tables, forms, modals |
| `--color-border` | `#e2e8f0` | Hairlines, card borders, input borders |
| `--color-text` | `#0f172a` | Primary body and heading copy |
| `--color-text-muted` | `#475569` | Secondary labels, packaging metadata, helper text |

### Typography & Font Sizes

- **Font stack (`--font-sans`):** `system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif`
- **Scale:**
  - `xs`: `0.75rem` (12px) — badges, table metadata
  - `sm`: `0.875rem` (14px) — labels, secondary copy, table cells
  - `base`: `1rem` (16px) — body copy, form inputs
  - `lg`: `1.125rem` (18px) — card titles
  - `xl`: `1.25rem` (20px) — section headers
  - `2xl`: `1.5rem` (24px) — page titles

### Spacing Scale

- `4px` (`0.25rem`), `8px` (`0.5rem`), `12px` (`0.75rem`), `16px` (`1rem`), `24px` (`1.5rem`), `32px` (`2rem`), `48px` (`3rem`)

### Border Radius & Shadows

- `--radius-sm`: `0.375rem` (6px) — buttons, inputs, nav items
- `--radius-md`: `0.5rem` (8px) — cards, panels, tables
- `--radius-lg`: `0.75rem` (12px) — modals, highlight banners
- `--shadow-sm`: `0 1px 2px rgba(15, 23, 42, 0.06)`
- `--shadow-md`: `0 4px 12px rgba(15, 23, 42, 0.08)`

## 2. UI Conventions

### Button Variants
- **Primary:** Solid `--color-primary` background, white text (Add to Cart, Checkout, Save).
- **Secondary:** `--color-surface` background, `1px solid var(--color-border)`, `--color-secondary` text (Cancel, Reset Filters).
- **Danger:** Solid `--color-danger` or danger-outline for deactivate/cancel order actions (require confirmation prompt).
- **Disabled:** `opacity: 0.55; cursor: not-allowed;` (never hide action state silently).

### Form Conventions
- Use Angular **Reactive Forms** (`FormGroup`, `FormControl`, `Validators`).
- Always pair `<label [for]="id">` with each input.
- Show field-level validation messages beneath inputs only after `touched || dirty || submitted`.
- Disable submit button and show loading label while request is in flight.

### Table Conventions (Admin Portal)
- Wrap tables in an overflow container (`overflow-x: auto`) for narrow screens.
- Right-align numeric columns (`Price`, `Stock`, `TotalAmount`).
- Include clear status pills (`Active`/`Inactive`, `Low Stock`, `OrderStatus`).
- Support server-side pagination controls matching API `page` and `pageSize`.

### Card Conventions (Customer Portal)
- Product cards display: image (with fallback), product name, brand & category badge, packaging summary (`PackagingType - PackagingSize`), price, stock indicator, and primary action.
- Keep card heights consistent inside CSS Grid (`grid-template-columns: repeat(auto-fill, minmax(240px, 1fr))`).

### Navigation
- Top bar holds brand link, portal switcher (visibility governed by role once auth is active), cart summary badge (Customer), and auth controls (`Login` / `Register` / `Logout`).
- Admin portal may add a secondary sub-navigation bar/sidebar inside `features/admin/`.

### Responsive Breakpoints
- **Mobile:** `< 640px` (single column grid, stacked filters/forms)
- **Tablet:** `640px – 1023px` (2-column product grid, collapsible nav)
- **Desktop:** `>= 1024px` (max container `1200px`, 3–4 column product grid)
