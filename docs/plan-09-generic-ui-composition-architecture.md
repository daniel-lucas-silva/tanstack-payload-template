# Plano 09 — Arquitetura de Componentes Genéricos e Padrão de Composição (`components/ui/`)

## 1. Visão Geral e Intenção do Usuário

O objetivo central deste template é servir de alicerce sólido e reutilizável tanto para a aplicação principal (`app/`) quanto para as aplicações secundárias e remixes (`layers/` ou projetos derivados).

Para garantir a máxima flexibilidade e reutilização:
- Todos os componentes em `components/ui/` devem seguir o **padrão de composição moderno (`data-slot`, sub-componentes atômicos e abertos a estilização via Tailwind/CVA)**.
- Nenhum componente de `components/ui/` deve conter acoplamento com lógica de domínio ou textos fixos hardcoded.
- Os componentes de layout em `components/app/` (como `AppShell`, `BottomTabs`, `TopNav`, `NavGroup`, `MobileBar`) devem ser genéricos, aceitando itens de navegação, renderers e slots flexíveis via props.
- Todos os componentes devem estar devidamente exportados no barrel `components/ui/index.ts` e acessíveis via alias `@/components/ui` ou `@/components/app`.

---

## 2. Padrão de Composição Estabelecido

Cada componente atômico segue o padrão:
1. **Identificador `data-slot`**: Permite estilização contextual, seletores CSS do Tailwind v4 (`has-data-[slot=...]`, `*:data-[slot=...]`), e previsibilidade.
2. **Sub-componentes Modulares (Compound Components)**: Ex.: `Card` -> `CardHeader`, `CardTitle`, `CardDescription`, `CardAction`, `CardContent`, `CardFooter`.
3. **Suporte a Props Nativas e Primitivos**: `React.ComponentProps<"element">` ou primitivos do `@base-ui/react` garantindo acessibilidade (ARIA, foco, navegação por teclado).
4. **Variantes CVA Transparentes**: `buttonVariants`, `badgeVariants`, `alertVariants`, etc., exportados para permitir reuso de estilos em links, tags e botões personalizados.

---

## 3. Catálogo de Componentes Genéricos a Disponibilizar

1. **Botões e Ações**: `button.tsx`, `button-group.tsx`, `toggle.tsx`, `toggle-group.tsx`, `kbd.tsx`.
2. **Formulários e Inputs**: `input.tsx`, `textarea.tsx`, `input-group.tsx`, `field.tsx`, `label.tsx`, `checkbox.tsx`, `switch.tsx`, `radio-group.tsx`, `slider.tsx`, `native-select.tsx`, `select.tsx`.
3. **Layout e Estrutura**: `card.tsx`, `item.tsx`, `empty.tsx`, `separator.tsx`, `aspect-ratio.tsx`, `scroll-area.tsx`, `table.tsx`, `collapsible.tsx`, `accordion.tsx`.
4. **Feedback e Status**: `badge.tsx`, `alert.tsx`, `alert-dialog.tsx`, `progress.tsx`, `spinner.tsx`, `skeleton.tsx`, `toast.tsx` / `sonner.tsx`.
5. **Overlays e Modais**: `dialog.tsx`, `drawer.tsx`, `sheet.tsx`, `popover.tsx`, `dropdown-menu.tsx`, `tooltip.tsx`, `hover-card.tsx`.
6. **Navegação**: `tabs.tsx`, `breadcrumb.tsx`, `pagination.tsx`, `navigation-menu.tsx`.
7. **Identidade e Mídia**: `avatar.tsx`.
8. **Layout & Shell Genérico (`components/app/`)**: `app-shell.tsx`, `bottom-tabs.tsx`, `top-nav.tsx`, `nav-context.tsx`.

---

## 4. Etapas de Execução

1. Portar e consolidar os componentes essenciais de `.tmp/vercel-example/components/ui/` para `components/ui/` adotando as convenções puras de TypeScript e Tailwind v4.
2. Garantir que `components/app/` utilize composição genérica (recebendo listas de tabs, custom icons, brand logos e slots flexíveis).
3. Exportar tudo no barrel `components/ui/index.ts` e `components/app/index.ts`.
4. Atualizar o showcase `/components` para ilustrar a composição e o reuso entre camadas.
5. Validar tipos com `bunx tsc --noEmit` e o build com `bun run build`.
6. Registrar o relatório final em `docs/report-08-generic-ui-composition-architecture.md`.
