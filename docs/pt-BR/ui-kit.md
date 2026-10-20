# UI Kit

Biblioteca de componentes zero-dependência em `web/src/components/` (React + CSS Modules + tokens). Padrões de mercado (shadcn/Radix/Linear/Vercel): mobile-first, alvos de toque 44px, anel de foco visível, `prefers-reduced-motion`, dark/light via `data-theme`.

## Catálogo

| Componente | Pasta | Notas |
|---|---|---|
| Button | `button/` | Variantes primary/secondary/outline/ghost/danger/danger-outline, sm/md/lg, `loading`, `fullWidth`, encaminha `ref` |
| IconButton | `icon-button/` | Botão quadrado, **`label` obrigatório** (aria-label + tooltip) |
| LanguageSwitcher | `language-switcher/` | `menu` (select nativo com nomes completos) ou `toggle` (alterna idioma, `iconOnly` para trilhos); persiste a escolha e atualiza `<html lang>` |
| Sidebar / SidebarNav | `sidebar/` | Sidebar desktop retrátil (estado do modo trilho é do consumidor) + nav compartilhada do drawer mobile |
| Brand | `brand/` | Marca (símbolo + nome) — rebranding em um só lugar; `markOnly` para espaços compactos |
| AuthCard | `auth-card/` | Shell de card centralizado das páginas de auth: marca, título/subtítulo, corpo, rodapé |
| SiteHeader / SiteFooter | `site-header/` `site-footer/` | Chrome público: nav fixa com CTA que reflete a sessão + troca de idioma; links do rodapé |
| SiteLayout | `site-layout/` | Wrapper de páginas públicas (header + conteúdo centralizado + footer), largura sm/md/lg |
| Input / Textarea | `input/` `textarea/` | `label`, `hint`, `error` (role=alert), ligação automática via `useId`; `type="password"` ganha botão de mostrar senha (`revealLabel`/`hideLabel`) |
| Select | `select/` | `<select>` nativo estilizado — picker nativo + a11y grátis no mobile |
| MultiSelect | `multi-select/` | Chips, busca, limpar tudo, Escape + clique-fora fecha |
| Checkbox / Switch | `checkbox/` `switch/` | Área de toque 44px; Switch usa `role="switch"` + `aria-checked` |
| Badge | `badge/` | default/primary/success/warning/danger/info, dot opcional |
| Avatar | `avatar/` | Iniciais como fallback, 5 tamanhos, dot de presença opcional |
| Spinner / Skeleton | `spinner/` `skeleton/` | `role="status"` + label sr-only; shimmer respeita reduced motion |
| SearchBar | `search-bar/` | Ícone + botão limpar próprio (o nativo do WebKit fica oculto), `debounceMs`, `clearLabel` |
| DataTable | `data-table/` | Colunas tipadas, ordenação (`aria-sort`), seleção, skeletons, `responsive="cards"`/`"scroll"`; copiar célula no clique (`copyable`), toolbar embutida (slot de busca via `toolbar`), `columnManager` (ocultar/reordenar, persiste com `storageKey`), exportação Excel sem dependências (`exportable`) e labels localizados (`labels`, ver `useDataTableLabels`) |
| ColumnManager | `column-manager/` | Popover para mostrar/ocultar e reordenar colunas (checkboxes + setas); usado pelo DataTable, usável sozinho |
| Pagination | `pagination/` | Algoritmo com elipse, seletor de page-size, `Página X de Y` compacta no mobile, `labels` localizados |
| Modal | `modal/` | Foco gerenciado + restauração, Escape/overlay fecha, trava scroll, **bottom-sheet no mobile**, `closeLabel` |
| Drawer | `drawer/` | Painel lateral — usado na navegação mobile do dashboard, `closeLabel` |
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
| PageTransition | `page-transition/` | Repete uma animação sutil de fade + subida a cada navegação (key por pathname); respeita `prefers-reduced-motion` |

```tsx
import { Button, DataTable, Modal, toast } from "@/components";
```

## Galeria

Prints capturados do app rodando com o tema escuro padrão (`inputs.png` vs `inputs-light.png` mostra a variante clara). Todas as imagens ficam em `docs/assets/ui-kit/`.

### Fundamentos

![Brand — nome completo e somente símbolo](../assets/ui-kit/brand.png)
![PageHeader com título, subtítulo e ação](../assets/ui-kit/page-header.png)

### Ações

![Variantes, tamanhos, estados loading/disabled do Button e IconButton](../assets/ui-kit/button.png)

### Formulários

![Input (com hint, erro e mostrar senha), Textarea, Select, Checkbox e Switch](../assets/ui-kit/inputs.png)
![Os mesmos campos com os tokens do tema claro](../assets/ui-kit/inputs-light.png)
![MultiSelect com busca, chips e limpar tudo](../assets/ui-kit/multi-select.png)

### Exibição

![Variantes do Badge e tamanhos do Avatar com presença](../assets/ui-kit/badge-avatar.png)
![Família Card e StatCard com deltas de tendência](../assets/ui-kit/card-statcard.png)
![Tabs com badges](../assets/ui-kit/tabs.png)

### Feedback

![Variantes do Alert, tamanhos do Spinner, Skeleton e EmptyState](../assets/ui-kit/feedback.png)
![Pilha de toasts (success, error, info)](../assets/ui-kit/toast.png)
![Tooltip no hover/foco de teclado](../assets/ui-kit/tooltip.png)

### Dados

![DataTable com a toolbar embutida: slot de busca, gerenciador de colunas e exportação Excel](../assets/ui-kit/data-table.png)
![ColumnManager aberto: mostrar/ocultar e reordenar colunas](../assets/ui-kit/column-manager.png)
![DataTable em cards no mobile](../assets/ui-kit/data-table-mobile.png)
![DataTable na página de admin: cabeçalhos ordenáveis, células copiáveis, colunas e exportação](../assets/ui-kit/admin-table.png)

### Overlays

![Modal](../assets/ui-kit/modal.png)
![Drawer](../assets/ui-kit/drawer.png)
![Drawer no mobile](../assets/ui-kit/drawer-mobile.png)
![Menu Dropdown com ícones, item de perigo e desabilitado](../assets/ui-kit/dropdown.png)

### Shells e preços

![Sidebar expandida — marca, seletor de organização, nav e botão de recolher](../assets/ui-kit/sidebar.png)
![Sidebar recolhida em trilho de ícones (estado persiste no localStorage)](../assets/ui-kit/sidebar-collapsed.png)
![Shell AuthCard na página de login](../assets/ui-kit/auth-card.png)
![AuthCard no mobile](../assets/ui-kit/auth-card-mobile.png)
![SiteHeader com CTA que reflete a sessão](../assets/ui-kit/site-header.png)
![SiteFooter](../assets/ui-kit/site-footer.png)
![PricingTable com o plano em destaque](../assets/ui-kit/pricing-table.png)

## Regras para novos componentes

1. Uma pasta por componente em kebab-case: `index.tsx` + `index.module.css` (+ barrel em `components/index.ts`).
2. Nada de CSS global — estilos no module, tokens do `global.css` (`var(--color-*)`, `var(--radius-*)`).
3. Mobile-first: base para celular; evolua com `@media (min-width: 720px)`.
4. Tudo interativo alcançável por teclado com `:focus-visible`; botão só-ícone exige `aria-label`; estados async usam `role="status"`/`aria-busy`.
5. Alvos de toque ≥ 44px; tabelas sempre com comportamento `responsive` — nunca overflow horizontal cru no celular.
6. Strings visíveis via props com default em inglês (i18n é dono da página). Páginas usam `useI18n()` e `useDataTableLabels()` — veja [i18n](i18n.md).

## Theming

Troque a marca no `global.css` (`--color-primary*`, cores de status, raios, sombras). As superfícies se adaptam sozinhas ao `[data-theme="light"]`. Breakpoints: `<640px` celulares, `<720px` troca para layout em cards de componentes, `<900px` topbar+drawer do dashboard.

Tokens de primária: `--color-primary-soft` é fundo de chip sólido (avatar, badges); `--color-primary-tint` + `--color-primary-tint-text` formam a placa de destaque ciente do tema usada por estados ativos de nav, chips de ícone e glows de página — use o par tint em elementos sobre o fundo da página.

## Movimento

Tokens no `global.css`: `--duration-fast` (150ms) para overlays/saídas, `--duration-base` (220ms) para entradas, `--duration-slow` (280ms) para mudanças estruturais, `--ease-out` para entradas e `--ease-smooth` para transições estruturais. Tudo é desativado em `prefers-reduced-motion` (durações e delays forçados a 0).

| Superfície | Movimento |
|---|---|
| Sidebar | Transição de largura/padding, labels (max-width + fade), colapso animado do wordmark, chevron girando |
| PageTransition | Fade + subida de 6px em cada navegação do dashboard |
| Drawer | Fade do overlay + slide conforme o lado; permanece montado para a animação de saída |
| Modal | Fade do overlay + subida/escala do diálogo; saída animada antes do unmount |
| Toast / Skeleton | Slide-in / shimmer |
| Overview | Subida escalonada dos stat cards e ações rápidas |
