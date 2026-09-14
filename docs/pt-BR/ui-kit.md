# UI Kit

Biblioteca de componentes zero-dependência em `web/src/components/` (React + CSS Modules + tokens). Padrões de mercado (shadcn/Radix/Linear/Vercel): mobile-first, alvos de toque 44px, anel de foco visível, `prefers-reduced-motion`, dark/light via `data-theme`.

## Catálogo

| Componente | Pasta | Notas |
|---|---|---|
| Button | `button/` | Variantes primary/secondary/outline/ghost/danger, sm/md/lg, `loading`, `fullWidth` |
| IconButton | `icon-button/` | Botão quadrado, **`label` obrigatório** (aria-label + tooltip) |
| Input / Textarea | `input/` `textarea/` | `label`, `hint`, `error` (role=alert), ligação automática via `useId` |
| Select | `select/` | `<select>` nativo estilizado — picker nativo + a11y grátis no mobile |
| MultiSelect | `multi-select/` | Chips, busca, limpar tudo, Escape + clique-fora fecha |
| Checkbox / Switch | `checkbox/` `switch/` | Área de toque 44px; Switch usa `role="switch"` + `aria-checked` |
| Badge | `badge/` | default/primary/success/warning/danger/info, dot opcional |
| Avatar | `avatar/` | Iniciais como fallback, 5 tamanhos, dot de presença opcional |
| Spinner / Skeleton | `spinner/` `skeleton/` | `role="status"` + label sr-only; shimmer respeita reduced motion |
| SearchBar | `search-bar/` | Ícone + botão limpar, `debounceMs` opcional |
| DataTable | `data-table/` | Colunas tipadas, ordenação (`aria-sort`), seleção, skeletons, `responsive="cards"` (cards empilhados <720px) ou `"scroll"` |
| Pagination | `pagination/` | Algoritmo com elipse, seletor de page-size, `Página X de Y` compacta no mobile |
| Modal | `modal/` | Foco gerenciado + restauração, Escape/overlay fecha, trava scroll, **bottom-sheet no mobile** |
| Drawer | `drawer/` | Painel lateral — usado na navegação mobile do dashboard |
| Dropdown | `dropdown/` | Papéis `menu`/`menuitem`, setas navegam, Escape devolve o foco |
| Tabs | `tabs/` | Roving tabindex + setas/Home/End, rolagem horizontal no mobile |
| Card | `card/` | `Card` + Header/Title/Description/Content/Footer |
| Alert | `alert/` | info/success/warning/danger, `role` opcional + dismiss |
| EmptyState | `empty-state/` | Ícone + título + descrição + ação |
| StatCard | `stat-card/` | Métrica + estado `loading` + delta (`invert` p/ custo) |
| PricingTable | `pricing-table/` | Busca `GET /billing/plans` (fallback local), trial, loading/erro, CTAs 44px |
| CookieConsent | `cookie-consent/` | Diálogo LGPD, `role="dialog"` + `aria-live`, CSS module + tokens |
| Toast | `toast/` | `toast.success/error/info()` via eventos + `<Toaster/>` (já montado no `app.tsx`) |
| Tooltip | `tooltip/` | Só CSS, hover + foco de teclado; nunca para informação essencial |
| PageHeader | `page-header/` | Título/subtítulo/ação; empilha full-width no mobile |

```tsx
import { Button, DataTable, Modal, toast } from "@/components";
```

## Regras para novos componentes

1. Uma pasta por componente em kebab-case: `index.tsx` + `index.module.css` (+ barrel em `components/index.ts`).
2. Nada de CSS global — estilos no module, tokens do `global.css` (`var(--color-*)`, `var(--radius-*)`).
3. Mobile-first: base para celular; evolua com `@media (min-width: 720px)`.
4. Tudo interativo alcançável por teclado com `:focus-visible`; botão só-ícone exige `aria-label`; estados async usam `role="status"`/`aria-busy`.
5. Alvos de toque ≥ 44px; tabelas sempre com comportamento `responsive` — nunca overflow horizontal cru no celular.
6. Strings visíveis via props com default em inglês (i18n é dono da página).
