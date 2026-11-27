# RetailHub Component Guidelines

## 1. Shared Component Ownership

- `src/app/core/` and `src/app/shared/` are owned by the **Technical Lead (Developer 1)** or an explicitly assigned shared owner.
- Customer-only components belong in `src/app/features/customer/components/` (owned by **Developer 2**).
- Admin-only components belong in `src/app/features/admin/components/` (owned by **Developer 3**).
- Do not promote a component into `shared/` unless both portals genuinely reuse it and the Technical Lead approves the move.

## 2. Component Naming & File Structure

- Use Angular **standalone components** only (no `NgModule`).
- Selector prefix: `app-` (kebab-case, e.g., `app-product-card`, `app-pagination`).
- Angular 22 concise file naming (matches generated workspace):
  - `feature-name.ts`
  - `feature-name.html` (or inline `template` for small placeholders)
  - `feature-name.css`
  - `feature-name.spec.ts`
- Folder per component inside `pages/` or `components/`:
  ```text
  features/customer/
    pages/
      catalog-page/
        catalog-page.ts
        catalog-page.html
        catalog-page.css
    components/
      product-card/
        product-card.ts
        product-card.html
        product-card.css
  ```

## 3. Reusable Components (Keep Minimal)

Only build small, focused shared primitives when needed:
- `Pagination` (page prev/next, page indicator)
- `StatusBadge` (order status / active / low-stock chip)
- `ConfirmDialog` or inline confirmation banner

Avoid building a large generic UI library during the 3-hour hackathon window.

## 4. CSS Variables

- Reference semantic tokens from `src/styles.css` (`var(--color-primary)`, `var(--color-border)`, `var(--radius-md)`).
- Never hardcode brand hex colors directly inside feature component stylesheets so team-approved token updates propagate automatically.

## 5. Accessibility

- Use semantic HTML (`<header>`, `<main>`, `<nav>`, `<section>`, `<button type="button">`, `<table>` with `<th scope="col">`).
- All interactive controls must be keyboard-focusable with visible `:focus-visible` outlines.
- Provide `alt` text on product images and `aria-label` on icon-only buttons.

## 6. Responsive Design

- Mobile-first CSS with CSS Grid and Flexbox (`gap`, `flex-wrap`).
- Avoid fixed pixel widths on containers; use `max-width` and percentage/fluid tracks.

## 7. Loading, Empty & Error States

Every data-driven page must explicitly render:
1. **Loading state:** clear indicator (`Loading products...`) while HTTP request is pending.
2. **Empty state:** helpful message and reset action when `items.length === 0`.
3. **Error state:** non-crashing error banner showing the API `ProblemDetails.detail` (or fallback message) plus a retry button.
