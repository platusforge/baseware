# UI Kit

Zero-dependency component library in `web/src/components/` (React + CSS Modules + design tokens). Market patterns (shadcn/Radix/Linear/Vercel): mobile-first, 44px touch targets, visible focus rings, `prefers-reduced-motion`, dark/light via `data-theme`.

## Catalog

| Component | File | Notes |
|---|---|---|
| Button | `button/` | Variants primary/secondary/outline/ghost/danger, sm/md/lg, `loading`, `fullWidth` |
| IconButton | `icon-button/` | Square button, **requires `label`** (aria-label + tooltip) |
| Input / Textarea | `input/` `textarea/` | `label`, `hint`, `error` (role=alert), auto `useId` wiring |
| Select | `select/` | Styled native `<select>` — free native picker + a11y on mobile |
| MultiSelect | `multi-select/` | Chips, search filter, clear-all, Escape + click-outside to close |
| Checkbox / Switch | `checkbox/` `switch/` | 44px hit area; Switch uses `role="switch"` + `aria-checked` |
| Badge | `badge/` | default/primary/success/warning/danger/info, optional dot |
| Avatar | `avatar/` | Initials fallback, 5 sizes, optional presence dot |
| Spinner / Skeleton | `spinner/` `skeleton/` | `role="status"` + sr-only label; shimmer respects reduced motion |
| SearchBar | `search-bar/` | Icon + clear button, optional `debounceMs` |
| DataTable | `data-table/` | Typed columns, sorting (`aria-sort`), row selection, loading skeletons, `responsive="cards"` (stacked cards <720px) or `"scroll"` |
| Pagination | `pagination/` | Ellipsis algorithm, page-size select, compact `Page X of Y` on mobile |
| Modal | `modal/` | Focus trap-lite + restore, Escape/overlay close, scroll lock, **bottom-sheet on mobile** |
| Drawer | `drawer/` | Left/right panel — used for the mobile dashboard nav |
| Dropdown | `dropdown/` | `menu`/`menuitem` roles, ArrowUp/Down nav, Escape refocuses trigger |
| Tabs | `tabs/` | Roving tabindex + Arrow/Home/End, horizontal scroll on mobile |
| Card | `card/` | `Card` + Header/Title/Description/Content/Footer |
| Alert | `alert/` | info/success/warning/danger, optional dismiss |
| EmptyState | `empty-state/` | Icon + title + description + action slot |
| StatCard | `stat-card/` | Metric + trend delta (`invert` for cost-type metrics) |
| Toast | `toast/` | `toast.success/error/info()` event bus + `<Toaster/>` (already in `app.tsx`) |
| Tooltip | `tooltip/` | CSS-only, hover + keyboard focus; never for essential-only info |
| PageHeader | `page-header/` | Title/subtitle/action; stacks full-width on mobile |

```tsx
import { Button, DataTable, Modal, toast } from "@/components";
```

## Rules for new components

1. One folder per component in kebab-case: `index.tsx` + `index.module.css` (+ barrel in `components/index.ts`).
2. Never global CSS — all styles in the module file, tokens from `global.css` (`var(--color-*)`, `var(--radius-*)`).
3. Mobile-first: base styles target phones; enhance with `@media (min-width: 720px)`.
4. Every interactive element is keyboard reachable with `:focus-visible`; icon-only buttons need `aria-label`; async states need `role="status"`/`aria-busy`.
5. Touch targets ≥ 44px on coarse pointers; tables must define `responsive` behavior — never raw horizontal overflow on phones.
6. User-facing strings via props with English defaults (pages own i18n).

## Theming

Change the brand in `global.css` (`--color-primary*`, status colors, radii, shadows). Surfaces automatically adapt to `[data-theme="light"]`. Breakpoints: `<640px` phones, `<720px` component card-layout switch, `<900px` dashboard topbar+drawer.
