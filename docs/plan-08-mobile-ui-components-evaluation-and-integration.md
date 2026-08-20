# Plano 08 — Avaliação e Integração de Componentes UI Mobile-First com Tailwind CSS

## Contexto & Avaliação dos Exemplos em `.tmp/`

O usuário disponibilizou dois exemplos de referência na pasta `.tmp`:
1. **`vercel-example`**: Estrutura robusta de componentes UI baseados em `@base-ui/react` e `class-variance-authority` (CVA), com sistema de navegação e layout mobile-first com bottom tabs e top navigation.
2. **`lovable-example`**: Estrutura orientada a TanStack Router com `AppShell`, design tokens `oklch`, componentes rápidos (`ui-bits`, `Stars`, `Indicacoes`, `Verificado`) e adaptação responsiva (desktop top-nav e mobile bottom-nav bar de 56px).

### Diagnóstico de Compatibilidade & Otimizações:
- **Tailwind CSS v4**: A base do projeto já possui Tailwind v4 configurado. Vamos consolidar as variáveis de design no `styles/index.css` (cores semânticas, bordas, anéis de foco, radius matemático, suporte a mobile touch e safe-areas).
- **Sem `fetch` direto & Totalmente integrado ao TanStack Router**: Os componentes de navegação utilizam `<Link>` e `useRouterState` do TanStack Router nativamente.
- **Estrutura Modular e Limpa**:
  - `components/ui/` — Primitives atômicos (Button, Card, Input, Badge, Dialog, Drawer, Sheet, Tabs, Avatar, Skeleton, Separator, Textarea, etc.).
  - `components/mobile/` (ou `components/app/`) — Shell de layout mobile responsivo (`AppShell`, `BottomTabs`, `TopNav`, `MobileHeader`, `MobileCard`, `StatusBadge`).
  - `lib/utils.ts` / `shared/utils/cn.ts` — Utilitário padrão `cn()` com `clsx` e `tailwind-merge`.

---

## Objetivos da Implementação

1. **Tokens de Design no `styles/index.css`**:
   - Definição semântica de `--primary`, `--secondary`, `--background`, `--foreground`, `--muted`, `--accent`, `--destructive`, `--border`, `--input`, `--ring`, `--radius`.
   - Classes utilitárias para mobile: `pb-safe`, `pt-safe`, `-webkit-tap-highlight-color: transparent`.

2. **Biblioteca de Componentes UI (`components/ui/`)**:
   - `button.tsx`: Variantes `default`, `outline`, `secondary`, `ghost`, `destructive`, `link` com CVA e suporte a `@base-ui/react`.
   - `badge.tsx`: Variantes semânticas para status e tags.
   - `card.tsx`: Estrutura com `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`.
   - `input.tsx` & `textarea.tsx`: Inputs estilizados com focus-ring e estados de validação.
   - `tabs.tsx`: Navegação em abas e segmented controls.
   - `dialog.tsx` & `sheet.tsx` / `drawer.tsx`: Modais e bottom sheets para ações e filtros no celular.
   - `avatar.tsx`: Exibição de avatar com iniciais e imagem.
   - `skeleton.tsx`: Feedback de carregamento suave.
   - `separator.tsx`: Divisores sutis sem poluição visual.
   - `ui-bits.tsx`: Componentes de micro-layout (Stars, Indicacoes, Verificado, SectionTitle).

3. **Shell de Aplicação Mobile Responsivo (`components/mobile/` ou `components/app/`)**:
   - `AppShell.tsx`: Layout com barra superior sticky, container com largura contida (`max-w-md` ou `max-w-2xl`), suporte a header actions, e barra inferior de abas no mobile que se converte em navegação horizontal no desktop.
   - `BottomTabs.tsx`: Barra inferior com touch targets de 44px+, ícones Lucide, contadores de notificação e indicador de rota ativa.
   - `TopNav.tsx`: Header superior com botão voltar, título e slot para ações contextuais.

4. **Showcase e Demonstração Prática**:
   - Rota demonstrando o uso dos componentes com TanStack Router e integração com os dados do template.

---

## Próximos Passos

1. Configurar `styles/index.css` com as variáveis de tema e utilitários.
2. Criar `lib/utils.ts` com o helper `cn()`.
3. Implementar a suite de componentes `components/ui/` e `components/app/`.
4. Validar via `bunx tsc --noEmit` e `bun run build`.
5. Gerar o relatório `docs/report-07-mobile-ui-components-integration.md`.
